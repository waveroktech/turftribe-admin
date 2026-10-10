import { Building2, CreditCard, LayoutDashboard, Trophy, Users } from 'lucide-react';
import { useAppSelector } from './hooks';
import { selectUser } from '@/features/auth/authSlice';
import type { User } from '@/features/users/types';

// Mirrors the backend's PlatformAdminGuard (turftribe-backend
// src/features/auth/admin.guard.ts). The guard is the real check; this only
// decides what the UI shows.
export const PLATFORM_ADMIN_ROLES = ['admin', 'superadmin'];

export const ADMIN_HOME = '/admin';

export const isPlatformAdmin = (user: User | null | undefined) =>
	!!user?.role && PLATFORM_ADMIN_ROLES.includes(user.role);

export const useIsPlatformAdmin = () => isPlatformAdmin(useAppSelector(selectUser));

const icon = (Icon: typeof LayoutDashboard) => <Icon strokeWidth={2} />;

export const adminSidebarLinks = [
	{ name: 'Dashboard', href: ADMIN_HOME, icon: icon(LayoutDashboard), iconActive: icon(LayoutDashboard) },
	{ name: 'Communities', href: '/admin/communities', icon: icon(Building2), iconActive: icon(Building2) },
	{ name: 'Users', href: '/admin/users', icon: icon(Users), iconActive: icon(Users) },
	{ name: 'Payments', href: '/admin/payments', icon: icon(CreditCard), iconActive: icon(CreditCard) },
	{ name: 'Sports', href: '/admin/sports', icon: icon(Trophy), iconActive: icon(Trophy) },
];
