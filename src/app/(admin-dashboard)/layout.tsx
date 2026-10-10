'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { withAuth } from '../withAuth';
import { adminSidebarLinks, linkForPath } from '@/lib/admin';
import { usePermissions } from '@/hooks/usePermissions';
import { SidebarProvider } from '@/components/ui/sidebar';

import AppSidebar from '@/components/app-sidebar';

const Layout = ({ children }: { children: React.ReactNode }) => {
	const router = useRouter();
	const pathname = usePathname();
	const { can, hasBackofficeAccess } = usePermissions();

	// Anyone without backoffice permissions is sent to sign in, and a page
	// the user's role doesn't cover sends them to the first one it does.
	// The backend refuses their requests regardless.
	const page = linkForPath(pathname);
	const allowed = hasBackofficeAccess && (!page || can(page.permission));
	useEffect(() => {
		if (!hasBackofficeAccess) {
			router.replace('/sign-in');
		} else if (!allowed) {
			const fallback = adminSidebarLinks.find((link) => can(link.permission));
			router.replace(fallback?.href ?? '/sign-in');
		}
	}, [allowed, can, hasBackofficeAccess, router]);

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
