'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { withAuth } from '../withAuth';
import { useIsPlatformAdmin } from '@/lib/admin';
import { SidebarProvider } from '@/components/ui/sidebar';

import AppSidebar from '@/components/app-sidebar';

const Layout = ({ children }: { children: React.ReactNode }) => {
	const router = useRouter();
	const allowed = useIsPlatformAdmin();

	// Anyone without a platform role is sent to sign in. The backend's
	// PlatformAdminGuard rejects their requests regardless.
	useEffect(() => {
		if (!allowed) router.replace('/sign-in');
	}, [allowed, router]);

	return (
		<SidebarProvider>
			<AppSidebar />
			<main className='flex overflow-x-hidden'>
				<div className='app-container w-full flex-1 lg:p-0'>
					<div className='bg-[#F7F7F7] lg:rounded-[24px] min-h-screen scrollbar-hide'>
						{allowed ? children : null}
					</div>
				</div>
			</main>
		</SidebarProvider>
	);
};

export default withAuth(Layout);
