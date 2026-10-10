import { Mail, MapPin, Phone } from 'lucide-react';
import { useGetAdminPaymentsQuery, useGetAdminUserQuery } from '@/features/admin/adminApi';
import { usePermissions } from '@/hooks/usePermissions';
import { AdminUser } from '@/features/admin/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { getSport } from '@/lib/sports';

import { AdminQueryState, PAYMENT_STATUS_TONE, Pill, SheetCloseButton, dateTime, fullName, naira, shortDate } from '../shared';

export const initials = (user: Pick<AdminUser, 'firstName' | 'lastName'>) =>
	`${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase() || 'TT';

const RECENT_PAYMENTS = 10;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<section className='flex flex-col gap-2'>
		<h3 className='text-[11px] font-semibold uppercase tracking-wide text-subtle'>{title}</h3>
		{children}
	</section>
);

const UserSheet = ({ user, onClose }: { user: AdminUser; onClose: () => void }) => {
	// The list row renders the header straight away; the rest loads in.
	const { data: detail, error, isLoading } = useGetAdminUserQuery(user.id);
	// Their payments come from the payments list, so they need that permission.
	const { can } = usePermissions();
	const canSeePayments = can('platform:payments');
	const { data: payments } = useGetAdminPaymentsQuery(
		{ userId: user.id, limit: RECENT_PAYMENTS },
		{ skip: !canSeePayments }
	);
	const recentPayments = payments?.data ?? [];
	const name = fullName(user.firstName, user.lastName);

	return (
		<Sheet open onOpenChange={(open) => !open && onClose()}>
			<SheetContent className='w-full overflow-y-auto bg-[#F7F7F7] p-0 sm:max-w-md'>
				<SheetCloseButton />
				<div className='flex flex-col gap-6 p-6'>
					<header className='flex items-center gap-4 pr-10'>
						<Avatar className='h-14 w-14 rounded-2xl'>
							{user.profileImageUrl && (
								<AvatarImage src={user.profileImageUrl} alt={name} className='object-cover' />
							)}
							<AvatarFallback className='rounded-2xl bg-brand text-base font-bold text-ink'>
								{initials(user)}
							</AvatarFallback>
						</Avatar>
						<div className='min-w-0'>
							<SheetTitle className='truncate text-lg font-bold capitalize text-ink'>{name}</SheetTitle>
							<SheetDescription className='flex flex-wrap items-center gap-1.5 text-xs text-subtle'>
								<Pill tone='neutral'>{user.currentUserType}</Pill>
								{user.role && <Pill tone='warning'>{user.role}</Pill>}
								{user.locked && <Pill tone='danger'>Locked</Pill>}
								<span>Joined {shortDate(user.createdAt)}</span>
							</SheetDescription>
						</div>
					</header>

					<div className='grid grid-cols-2 gap-3'>
						<div className='rounded-2xl bg-surface-raised p-3 ring-1 ring-black/[0.06]'>
							<p className='text-[11px] font-medium text-subtle'>Total spent</p>
							<p className='mt-0.5 text-lg font-bold tabular-nums text-ink'>{naira(user.totalSpent)}</p>
						</div>
						<div className='rounded-2xl bg-surface-raised p-3 ring-1 ring-black/[0.06]'>
							<p className='text-[11px] font-medium text-subtle'>Last active</p>
							<p className='mt-0.5 text-lg font-bold text-ink'>{shortDate(user.lastActiveAt)}</p>
						</div>
					</div>

					<Section title='Contact'>
						<ul className='flex flex-col gap-2 text-sm text-ink'>
							<li className='flex items-center gap-2'>
								<Mail className='h-4 w-4 text-subtle' />
								<a href={`mailto:${user.email}`} className='truncate hover:underline'>
									{user.email}
								</a>
							</li>
							{user.phoneNumber && (
								<li className='flex items-center gap-2'>
									<Phone className='h-4 w-4 text-subtle' />
									<a href={`tel:${user.phoneNumber}`} className='hover:underline'>
										{user.phoneNumber}
									</a>
								</li>
							)}
							{detail?.country && (
								<li className='flex items-center gap-2'>
									<MapPin className='h-4 w-4 text-subtle' />
									{detail.country}
								</li>
							)}
						</ul>
					</Section>

					{error ? (
						<AdminQueryState error={error} endpoint={`GET /admin/users/:id`} />
					) : isLoading || !detail ? (
						<div className='flex flex-col gap-3'>
							<Skeleton className='h-24 w-full rounded-2xl' />
							<Skeleton className='h-40 w-full rounded-2xl' />
						</div>
					) : (
						<>
							{detail.sports.length > 0 && (
								<Section title='Sports'>
									<div className='flex flex-wrap gap-1.5'>
										{detail.sports.map((sport) => (
											<Pill key={sport} tone='neutral'>
												{getSport(sport).label}
											</Pill>
										))}
									</div>
								</Section>
							)}

							<Section title={`Communities (${detail.communities.length})`}>
								{detail.communities.length ? (
									<ul className='overflow-hidden rounded-2xl bg-surface-raised ring-1 ring-black/[0.06]'>
										{detail.communities.map((community) => (
											<li
												key={community.id}
												className='flex items-center justify-between gap-3 border-b border-line/60 px-3.5 py-2.5 text-sm last:border-b-0'>
												<span className='truncate font-medium capitalize text-ink'>{community.name}</span>
												<span className='shrink-0 text-xs capitalize text-subtle'>
													{community.role}
													{community.joinedAt && ` · ${shortDate(community.joinedAt)}`}
												</span>
											</li>
										))}
									</ul>
								) : (
									<p className='text-sm text-subtle'>Not in any community yet.</p>
								)}
							</Section>

							{canSeePayments && (
								<Section title='Recent payments'>
									{recentPayments.length ? (
										<ul className='overflow-hidden rounded-2xl bg-surface-raised ring-1 ring-black/[0.06]'>
											{recentPayments.map((payment) => (
												<li
													key={payment.id}
													className='flex items-start justify-between gap-3 border-b border-line/60 px-3.5 py-2.5 last:border-b-0'>
													<div className='min-w-0'>
														<p className='truncate text-sm font-medium capitalize text-ink'>
															{payment.match?.title ?? payment.type}
														</p>
														<p className='truncate text-xs text-subtle'>
															{payment.community?.name ?? '—'} · {dateTime(payment.createdAt)}
														</p>
													</div>
													<div className='flex shrink-0 flex-col items-end gap-1'>
														<span className='text-sm font-bold tabular-nums text-ink'>{naira(payment.amount)}</span>
														<Pill tone={PAYMENT_STATUS_TONE[payment.status]}>{payment.status}</Pill>
													</div>
												</li>
											))}
										</ul>
									) : (
										<p className='text-sm text-subtle'>No payments yet.</p>
									)}
								</Section>
							)}
						</>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
};

export default UserSheet;
