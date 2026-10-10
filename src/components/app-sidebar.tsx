'use client';

import { usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { selectUser, setSignUpSuccess, setUser } from '@/features/auth/authSlice';
import { deleteAuthCookie } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { adminSidebarLinks } from '@/lib/admin';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Menu, PanelLeftClose } from 'lucide-react';

import Image from 'next/image';
import Link from 'next/link';

const initials = (first = '', last = '') =>
	`${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'TT';

const AppSidebar = () => {
	const { toggleSidebar, open, isMobile } = useSidebar();
	const pathname = usePathname();
	const dispatch = useAppDispatch();
	const user = useAppSelector(selectUser);
	const links = adminSidebarLinks;
	const expanded = open || isMobile;

	// The most specific href wins, so /admin/users highlights "Users" rather
	// than the /admin dashboard, and nested routes keep their parent lit.
	const activeHref = links
		.filter(
			(link) => pathname === link.href || pathname.startsWith(`${link.href}/`)
		)
		.sort((a, b) => b.href.length - a.href.length)[0]?.href;

	const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

	const handleLogout = async () => {
		dispatch(setUser(null));
		dispatch(setSignUpSuccess(false));

		await deleteAuthCookie('access-token');
	};

	return (
		<Sidebar collapsible='icon'>
			{/* Soft brand glow behind the logo */}
			<div
				aria-hidden
				className='pointer-events-none absolute inset-x-0 top-0 h-56 rounded-tr-[24px] bg-[radial-gradient(120%_70%_at_0%_0%,hsl(var(--brand)/0.14),transparent_70%)]'
			/>

			<SidebarHeader
				className={cn(
					'relative flex flex-row items-center pt-7 pb-2',
					expanded ? 'justify-between px-5' : 'justify-center px-2'
				)}>
				{expanded ? (
					<>
						<Link href={links[0]?.href ?? '/'} aria-label='TurfTribe backoffice home'>
							<Image
								src='/icons/logo-green.svg'
								width={105.33}
								height={16}
								alt='turftribe logo in green'
							/>
						</Link>
						<button
							onClick={toggleSidebar}
							aria-label='Collapse sidebar'
							className='grid h-9 w-9 place-items-center rounded-xl text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60'>
							<PanelLeftClose className='h-5 w-5' />
						</button>
					</>
				) : (
					<button
						onClick={toggleSidebar}
						aria-label='Expand sidebar'
						className='grid h-10 w-10 place-items-center rounded-xl text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60'>
						<Menu className='h-5 w-5' />
					</button>
				)}
			</SidebarHeader>

			<SidebarContent className='relative mt-4'>
				<SidebarGroup className={cn(expanded ? 'px-3' : 'px-2')}>
					<SidebarGroupLabel className='mb-1 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-white/35'>
						Backoffice
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu className='gap-1'>
							{links.map((link) => {
								const active = link.href === activeHref;

								return (
									<SidebarMenuItem
										key={link.name}
										onClick={() => {
											if (isMobile) toggleSidebar();
										}}>
										<SidebarMenuButton
											asChild
											isActive={active}
											tooltip={link.name}
											className={cn(
												'group/link h-11 gap-3 rounded-xl px-3 text-[0.9375rem] transition-all duration-200 ease-out',
												'focus-visible:ring-2 focus-visible:ring-brand/60',
												active
													? 'bg-brand font-semibold text-ink shadow-[0_8px_24px_-10px_hsl(var(--brand)/0.7)] hover:bg-brand hover:text-ink data-[active=true]:bg-brand data-[active=true]:text-ink'
													: 'font-medium text-white/65 hover:bg-white/[0.06] hover:text-white',
												!expanded && 'justify-center px-0'
											)}>
											<Link href={link.href} aria-current={active ? 'page' : undefined}>
												<span
													className={cn(
														'grid shrink-0 place-items-center transition-opacity [&_svg]:h-5 [&_svg]:w-5',
														active ? 'opacity-100' : 'opacity-60 group-hover/link:opacity-100'
													)}>
													{active ? link.iconActive : link.icon}
												</span>
												{expanded && <span className='truncate'>{link.name}</span>}
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

			</SidebarContent>

			<SidebarFooter className={cn('pb-6 pt-3', expanded ? 'px-3' : 'px-2')}>
				{expanded ? (
					<div className='flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-2.5'>
						<Avatar className='h-10 w-10 shrink-0 rounded-xl'>
							{user?.profileImageUrl && (
								<AvatarImage
									src={user.profileImageUrl}
									alt={fullName}
									className='object-cover'
								/>
							)}
							<AvatarFallback className='rounded-xl bg-brand text-sm font-bold text-ink'>
								{initials(user?.firstName, user?.lastName)}
							</AvatarFallback>
						</Avatar>
						<div className='min-w-0 flex-1'>
							<p className='truncate text-sm font-semibold capitalize text-white'>
								{fullName || 'TurfTribe admin'}
							</p>
							<p className='truncate text-xs text-white/45'>
								Platform admin
							</p>
						</div>
						<button
							onClick={handleLogout}
							aria-label='Log out'
							title='Log out'
							className='grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/55 transition-colors hover:bg-danger/15 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/60'>
							<LogOut className='h-[18px] w-[18px]' />
						</button>
					</div>
				) : (
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton
								onClick={handleLogout}
								tooltip='Log out'
								aria-label='Log out'
								className='h-11 justify-center rounded-xl text-white/55 hover:bg-danger/15 hover:text-danger'>
								<LogOut className='!h-5 !w-5' />
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				)}
			</SidebarFooter>
		</Sidebar>
	);
};

export default AppSidebar;
