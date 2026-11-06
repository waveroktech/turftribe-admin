import {
	Boxes,
	Building2,
	CalendarDays,
	LandPlot,
	MapPinned,
	Ticket,
	CreditCard,
	LayoutDashboard,
	Package,
	ShoppingBag,
	Store,
	Trophy,
	Users,
} from 'lucide-react';
import type { PlatformPermission } from './permissions';

export const ADMIN_HOME = '/admin';
export const MERCH_HOME = '/admin/merch';
export const VENUES_HOME = '/admin/venues';

const icon = (Icon: typeof LayoutDashboard) => <Icon strokeWidth={2} />;

export type AdminLinkGroup = 'Backoffice' | 'Venues' | 'Merchandise';

// Each page needs the platform permission its data comes from. The sidebar
// hides links the user can't open, and the layout blocks the page itself.
export const adminSidebarLinks: {
	name: string;
	href: string;
	group: AdminLinkGroup;
	permission: PlatformPermission;
	icon: React.ReactNode;
	iconActive: React.ReactNode;
}[] = [
	{ name: 'Dashboard', href: ADMIN_HOME, group: 'Backoffice', permission: 'platform:overview', icon: icon(LayoutDashboard), iconActive: icon(LayoutDashboard) },
	{ name: 'Communities', href: '/admin/communities', group: 'Backoffice', permission: 'platform:communities', icon: icon(Building2), iconActive: icon(Building2) },
	{ name: 'Users', href: '/admin/users', group: 'Backoffice', permission: 'platform:users', icon: icon(Users), iconActive: icon(Users) },
	{ name: 'Payments', href: '/admin/payments', group: 'Backoffice', permission: 'platform:payments', icon: icon(CreditCard), iconActive: icon(CreditCard) },
	{ name: 'Sports', href: '/admin/sports', group: 'Backoffice', permission: 'platform:sports', icon: icon(Trophy), iconActive: icon(Trophy) },
	{ name: 'Venues', href: VENUES_HOME, group: 'Venues', permission: 'platform:venues', icon: icon(LandPlot), iconActive: icon(LandPlot) },
	{ name: 'Calendar', href: `${VENUES_HOME}/calendar`, group: 'Venues', permission: 'platform:venues', icon: icon(CalendarDays), iconActive: icon(CalendarDays) },
	{ name: 'Bookings', href: `${VENUES_HOME}/bookings`, group: 'Venues', permission: 'platform:venues', icon: icon(Ticket), iconActive: icon(Ticket) },
	{ name: 'Clusters & fees', href: `${VENUES_HOME}/clusters`, group: 'Venues', permission: 'platform:venues', icon: icon(MapPinned), iconActive: icon(MapPinned) },
	{ name: 'Products', href: MERCH_HOME, group: 'Merchandise', permission: 'platform:merch', icon: icon(ShoppingBag), iconActive: icon(ShoppingBag) },
	{ name: 'Stock & prices', href: `${MERCH_HOME}/stock`, group: 'Merchandise', permission: 'platform:merch', icon: icon(Boxes), iconActive: icon(Boxes) },
	{ name: 'Orders', href: `${MERCH_HOME}/orders`, group: 'Merchandise', permission: 'platform:merch', icon: icon(Package), iconActive: icon(Package) },
	{ name: 'Vendors', href: `${MERCH_HOME}/vendors`, group: 'Merchandise', permission: 'platform:merch', icon: icon(Store), iconActive: icon(Store) },
];

export const ADMIN_LINK_GROUPS: AdminLinkGroup[] = ['Backoffice', 'Venues', 'Merchandise'];

// The most specific href wins, so /admin/users matches "Users" rather than
// the /admin dashboard, and nested routes keep their parent.
export const linkForPath = (pathname: string) =>
	adminSidebarLinks
		.filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
		.sort((a, b) => b.href.length - a.href.length)[0];
