import {
	Boxes,
	Building2,
	CreditCard,
	LayoutDashboard,
	Package,
	ShoppingBag,
	Store,
	Trophy,
	Users,
} from 'lucide-react';

export const ADMIN_HOME = '/admin';
export const MERCH_HOME = '/admin/merch';

const icon = (Icon: typeof LayoutDashboard) => <Icon strokeWidth={2} />;

export type AdminLinkGroup = 'Backoffice' | 'Merchandise';

// Every signed-in user sees every link. The backend decides whether each
// page's requests succeed; see docs/admin-backend-contract.md.
export const adminSidebarLinks: {
	name: string;
	href: string;
	group: AdminLinkGroup;
	icon: React.ReactNode;
	iconActive: React.ReactNode;
}[] = [
	{ name: 'Dashboard', href: ADMIN_HOME, group: 'Backoffice', icon: icon(LayoutDashboard), iconActive: icon(LayoutDashboard) },
	{ name: 'Communities', href: '/admin/communities', group: 'Backoffice', icon: icon(Building2), iconActive: icon(Building2) },
	{ name: 'Users', href: '/admin/users', group: 'Backoffice', icon: icon(Users), iconActive: icon(Users) },
	{ name: 'Payments', href: '/admin/payments', group: 'Backoffice', icon: icon(CreditCard), iconActive: icon(CreditCard) },
	{ name: 'Sports', href: '/admin/sports', group: 'Backoffice', icon: icon(Trophy), iconActive: icon(Trophy) },
	{ name: 'Products', href: MERCH_HOME, group: 'Merchandise', icon: icon(ShoppingBag), iconActive: icon(ShoppingBag) },
	{ name: 'Stock & prices', href: `${MERCH_HOME}/stock`, group: 'Merchandise', icon: icon(Boxes), iconActive: icon(Boxes) },
	{ name: 'Orders', href: `${MERCH_HOME}/orders`, group: 'Merchandise', icon: icon(Package), iconActive: icon(Package) },
	{ name: 'Vendors', href: `${MERCH_HOME}/vendors`, group: 'Merchandise', icon: icon(Store), iconActive: icon(Store) },
];

export const ADMIN_LINK_GROUPS: AdminLinkGroup[] = ['Backoffice', 'Merchandise'];

// The most specific href wins, so /admin/users matches "Users" rather than
// the /admin dashboard, and nested routes keep their parent.
export const linkForPath = (pathname: string) =>
	adminSidebarLinks
		.filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
		.sort((a, b) => b.href.length - a.href.length)[0];
