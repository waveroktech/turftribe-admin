'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CalendarCheck, Gauge, LandPlot, MapPin, Plus, ShieldCheck, Wallet } from 'lucide-react';
import {
	useGetVenueOrganisationsQuery,
	useGetVenueOverviewQuery,
	useGetVenueSettingsQuery,
} from '@/features/venues/venuesApi';
import type { VenueOrganisation, VenueSettings } from '@/features/venues/types';
import { VENUES_HOME } from '@/lib/admin';

import NavWrapper from '@/shared/nav-wrapper';
import { AdminQueryState, EmptyRows, KpiCard, Pill, RowsSkeleton, count, naira } from '../../shared';
import OrgDialog, { TURFTRIIBE_VENUE } from '../org-dialog';
import { DemoBanner, effectiveFeeRate, percent, primaryButtonClass, secondaryButtonClass, sportLabel } from '../shared';

const VenueCard = ({ org, settings }: { org: VenueOrganisation; settings?: VenueSettings }) => {
	const rate = effectiveFeeRate(org, settings);
	const unsearchable = org.stats.locations - org.stats.searchableLocations;
	const noPayout = !org.platformOwned && !org.payout?.paystackSubaccountCode;

	return (
		<Link
			href={`${VENUES_HOME}/${org.id}`}
			className='flex min-w-0 flex-col gap-4 rounded-3xl border border-black/[0.06] bg-surface-raised p-5 shadow-card transition-colors hover:border-ink/30'>
			<div className='flex items-start justify-between gap-3'>
				<div className='min-w-0'>
					<p className='flex items-center gap-2 truncate font-bold text-ink'>
						{org.name}
						{org.platformOwned && (
							<span className='inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-ink'>
								<ShieldCheck className='h-3 w-3' />
								Run by TurfTriibe
							</span>
						)}
					</p>
					<p className='truncate text-xs text-subtle'>
						{org.sports.map(sportLabel).join(' · ')} · {org.address}
					</p>
				</div>
				<Pill tone={org.status === 'active' ? 'success' : 'neutral'}>{org.status}</Pill>
			</div>

			{(noPayout || unsearchable > 0) && (
				<div className='flex flex-col gap-1.5'>
					{noPayout && (
						<p className='flex items-center gap-1.5 rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger'>
							<AlertTriangle className='h-3.5 w-3.5 shrink-0' />
							No Paystack subaccount, so its slots can’t be paid for online.
						</p>
					)}
					{unsearchable > 0 && (
						<p className='flex items-center gap-1.5 rounded-xl bg-warning/15 px-3 py-2 text-xs text-[#8A5A00]'>
							<MapPin className='h-3.5 w-3.5 shrink-0' />
							{unsearchable} location{unsearchable === 1 ? '' : 's'} without coordinates, so not searchable.
						</p>
					)}
				</div>
			)}

			<dl className='grid grid-cols-2 gap-3 border-t border-line/60 pt-3 text-xs sm:grid-cols-5'>
				<div>
					<dt className='text-subtle'>Places</dt>
					<dd className='mt-0.5 font-semibold text-ink'>{count(org.stats.places)}</dd>
				</div>
				<div>
					<dt className='text-subtle'>Locations</dt>
					<dd className='mt-0.5 font-semibold text-ink'>{count(org.stats.locations)}</dd>
				</div>
				<div>
					<dt className='text-subtle'>Upcoming</dt>
					<dd className='mt-0.5 font-semibold text-ink'>{count(org.stats.upcomingBookings)}</dd>
				</div>
				<div>
					<dt className='text-subtle'>GMV</dt>
					<dd className='mt-0.5 font-semibold text-ink'>{naira(org.stats.gmv)}</dd>
				</div>
				<div>
					<dt className='text-subtle'>Fee</dt>
					<dd className='mt-0.5 font-semibold text-ink'>
						{rate === null ? 'Own venue' : `${percent(rate)}${org.feeRate !== null ? '*' : ''}`}
					</dd>
				</div>
			</dl>
		</Link>
	);
};

const AdminVenues = () => {
	const router = useRouter();
	const { data: orgs = [], error, isLoading, refetch } = useGetVenueOrganisationsQuery();
	const { data: overview, isLoading: overviewLoading } = useGetVenueOverviewQuery();
	const { data: settings } = useGetVenueSettingsQuery();
	// undefined = closed, 'venue' = adding a partner, 'turftriibe' = setting up TurfTriibe.
	const [adding, setAdding] = useState<'venue' | 'turftriibe' | undefined>(undefined);

	const hasTurfTriibe = orgs.some((org) => org.platformOwned);

	return (
		<NavWrapper title='Venues'>
			<div className='mt-2 flex flex-col gap-4 pb-10 md:mt-4'>
				<DemoBanner />

				{overview && (
					<div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4 md:gap-4'>
						<KpiCard
							highlight
							loading={overviewLoading}
							title='Venue revenue this month'
							icon={<Wallet />}
							value={naira(overview.feesThisMonth + overview.ownVenueRevenueThisMonth)}
							caption={`${naira(overview.feesThisMonth)} fees + ${naira(overview.ownVenueRevenueThisMonth)} own venues`}
						/>
						<KpiCard
							loading={overviewLoading}
							title='Booking GMV this month'
							icon={<CalendarCheck />}
							value={naira(overview.gmvThisMonth)}
							caption={`${count(overview.bookingsThisMonth)} bookings`}
						/>
						<KpiCard
							loading={overviewLoading}
							title='Bookable locations'
							icon={<LandPlot />}
							value={count(overview.locations)}
							caption={`${count(overview.searchableLocations)} searchable · ${count(overview.venues)} venues`}
						/>
						<KpiCard
							loading={overviewLoading}
							title='Peak utilisation'
							icon={<Gauge />}
							value={`${Math.round(overview.peakUtilisation * 100)}%`}
							caption='Booked ÷ open, 17:00–22:00, last 28 days'
						/>
					</div>
				)}

				<div className='flex flex-wrap items-center justify-between gap-3'>
					<p className='max-w-2xl text-sm text-subtle'>
						Venue organisations own places and the pitches or courts in them, each with its own calendar. TurfTriibe runs
						its own venues from here; partner venues are added on their behalf for now.
					</p>
					{!error && (
						<div className='flex gap-2'>
							{!isLoading && !hasTurfTriibe && (
								<button onClick={() => setAdding('turftriibe')} className={primaryButtonClass}>
									<ShieldCheck className='h-4 w-4' />
									Set up TurfTriibe
								</button>
							)}
							<button
								onClick={() => setAdding('venue')}
								className={hasTurfTriibe ? primaryButtonClass : secondaryButtonClass}>
								<Plus className='h-4 w-4' />
								Add venue
							</button>
						</div>
					)}
				</div>

				{error ? (
					<AdminQueryState error={error} endpoint='GET /venues/organisations' onRetry={refetch} />
				) : isLoading ? (
					<RowsSkeleton rows={3} />
				) : orgs.length === 0 ? (
					<EmptyRows
						title='No venues yet'
						info='Set up TurfTriibe as the first venue owner, then add its places, pitches and courts.'
					/>
				) : (
					<div className='grid gap-3 md:gap-4 lg:grid-cols-2'>
						{orgs.map((org) => (
							<VenueCard key={org.id} org={org} settings={settings} />
						))}
					</div>
				)}
			</div>

			{adding && (
				<OrgDialog
					org={null}
					preset={adding === 'turftriibe' ? TURFTRIIBE_VENUE : undefined}
					settings={settings}
					onClose={() => setAdding(undefined)}
					onSaved={(org) => router.push(`${VENUES_HOME}/${org.id}`)}
				/>
			)}
		</NavWrapper>
	);
};

export default AdminVenues;
