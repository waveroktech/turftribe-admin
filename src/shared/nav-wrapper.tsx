'use client';

import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import { selectUser } from '@/features/auth/authSlice';
import { useSidebar } from '@/components/ui/sidebar';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { ADMIN_HOME } from '@/lib/admin';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Menu } from 'lucide-react';

type NavProps = {
	title: string;
	children?: React.ReactNode;
	back?: boolean;
};

const NavWrapper: React.FC<NavProps> = ({ title, children, back }) => {
	const match = useMediaQuery('(max-width:769px)');
	const router = useRouter();

	const user = useAppSelector(selectUser);

	const { toggleSidebar } = useSidebar();

	return (
		<>
			{!match ? (
				<header className='sticky top-0 z-10 bg-[#F7F7F7] pt-4 px-4'>
					<nav className='flex items-center justify-between bg-white px-3 py-4 rounded-[12px]'>
						<div className='flex md:items-center gap-2.5 flex-col md:flex-row'>
							<h1
								className={cn(
									'text-[#444444] text-[1.25rem] font-semibold capitalize',
									back && 'flex items-center gap-2'
								)}>
								{back && (
									<button onClick={() => router.back()}>
										<svg
											width='24'
											height='24'
											viewBox='0 0 24 24'
											fill='none'
											xmlns='http://www.w3.org/2000/svg'>
											<path
												d='M9 14L6.82842 11.8284C5.49509 10.4951 4.82843 9.82843 4.82843 9C4.82843 8.17157 5.49509 7.50491 6.82843 6.17157L9 4'
												stroke='#606367'
												strokeWidth='2'
												strokeLinecap='round'
												strokeLinejoin='round'
											/>
											<path
												d='M5 9H12C15.7712 9 17.6569 9 18.8284 10.1716C20 11.3431 20 13.2288 20 17V20'
												stroke='#606367'
												strokeWidth='2'
												strokeLinecap='round'
											/>
										</svg>
									</button>
								)}
								{title}
							</h1>
						</div>

						<div className='flex items-center gap-2'>
							<Image
								src={user?.profileImageUrl ?? '/images/user.png'}
								width={48}
								height={48}
								alt='user profile pic'
								className='rounded-full object-cover min-h-12'
							/>
							<div className='mr-4'>
								<h2 className='text-[#0C0C0C] text-sm font-bold capitalize'>
									{user?.firstName} {user?.lastName}
								</h2>
								<p className='text-[#6A6A6A] text-xs font-medium mt-[10px] capitalize'>
									Platform admin
								</p>
							</div>
						</div>
					</nav>
				</header>
			) : (
				<>
					{/* Mobile app bar */}
					<header className='sticky top-0 z-20 border-b border-black/[0.04] bg-surface/85 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-surface/70'>
						<nav className='flex h-14 items-center justify-between'>
							<div className='flex items-center gap-3'>
								<button
									onClick={toggleSidebar}
									aria-label='Open menu'
									className='-ml-1.5 flex h-9 w-9 items-center justify-center rounded-full text-ink transition-colors active:bg-black/5'>
									<Menu className='h-[22px] w-[22px]' strokeWidth={2.2} />
								</button>
								<Link href={ADMIN_HOME}>
									<Image
										src='/icons/logo.svg'
										width={92}
										height={17}
										alt='turftribe logo'
									/>
								</Link>
							</div>
							<Image
								src={user?.profileImageUrl ?? '/images/user.png'}
								width={36}
								height={36}
								alt='user profile pic'
								className='h-9 w-9 rounded-full object-cover ring-2 ring-brand ring-offset-1 ring-offset-surface'
							/>
						</nav>
					</header>

					{/* Large title, iOS style */}
					<div className='px-4 pb-2 pt-4'>
						<div className='flex items-center gap-2'>
							{back && (
								<button
									onClick={() => router.back()}
									aria-label='Go back'
									className='-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-ink shadow-sm ring-1 ring-black/[0.04] active:scale-95'>
									<ChevronLeft className='h-5 w-5' strokeWidth={2.4} />
								</button>
							)}
							<h1 className='truncate text-[26px] font-bold capitalize leading-tight tracking-tight text-ink'>
								{title}
							</h1>
						</div>
					</div>
				</>
			)}
			<div className={cn('h-full', match ? 'px-4 pb-12 pt-2' : 'p-4')}>{children}</div>
		</>
	);
};

export default NavWrapper;
