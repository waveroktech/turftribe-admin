import { Building2, CreditCard, LayoutDashboard, Trophy, Users } from 'lucide-react';
import type { PlatformPermission } from './permissions';

export const ADMIN_HOME = '/admin';

const icon = (Icon: typeof LayoutDashboard) => <Icon strokeWidth={2} />;

// Each page needs the platform permission its data comes from. The sidebar
// hides links the user can't open, and the layout blocks the page itself.
export const adminSidebarLinks: {
	name: string;
	href: string;
	permission: PlatformPermission;
	icon: React.ReactNode;
	iconActive: React.ReactNode;
}[] = [
	{ name: 'Dashboard', href: ADMIN_HOME, permission: 'platform:overview', icon: icon(LayoutDashboard), iconActive: icon(LayoutDashboard) },
	{ name: 'Communities', href: '/admin/communities', permission: 'platform:communities', icon: icon(Building2), iconActive: icon(Building2) },
	{ name: 'Users', href: '/admin/users', permission: 'platform:users', icon: icon(Users), iconActive: icon(Users) },
	{ name: 'Payments', href: '/admin/payments', permission: 'platform:payments', icon: icon(CreditCard), iconActive: icon(CreditCard) },
	{ name: 'Sports', href: '/admin/sports', permission: 'platform:sports', icon: icon(Trophy), iconActive: icon(Trophy) },
];

// The most specific href wins, so /admin/users matches "Users" rather than
// the /admin dashboard, and nested routes keep their parent.
export const linkForPath = (pathname: string) =>
	adminSidebarLinks
		.filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
		.sort((a, b) => b.href.length - a.href.length)[0];
