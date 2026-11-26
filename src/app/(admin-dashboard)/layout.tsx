'use client';

import { withAuth } from '../withAuth';
import { SidebarProvider } from '@/components/ui/sidebar';

import AppSidebar from '@/components/app-sidebar';

// Every signed-in user sees every page. The backend decides what data they get;
// a refused request shows the "no access" state on that section.
const Layout = ({ children }: { children: React.ReactNode }) => {
	return (
		<SidebarProvider>
			<AppSidebar />
			<main className='flex overflow-x-hidden'>
				<div className='app-container w-full flex-1 lg:p-0'>
					<div className='bg-[#F7F7F7] lg:rounded-[24px] min-h-screen scrollbar-hide'>{children}</div>
				</div>
			</main>
		</SidebarProvider>
	);
};

export default withAuth(Layout);
