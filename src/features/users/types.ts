import type { Permission, PlatformPermission } from '@/lib/permissions';

export interface User {
	_id: string;
	userId: string;
	email: string;
	otpEmail: string;
	firstName: string;
	lastName: string;
	nickName: string;
	phoneNumber: string;
	dob: string;
	height: string | number;
	weight: string | number;
	ratings: number;
	country: string;
	currentCommunity: string;
	designation: string;
	locked: boolean;
	communities: string[];
	gender: string;
	preferredSport: string;
	profileImageUrl: string;
	sports: string[];
	completionPercent: string;
	isProfileCompleted: true;
	communityManaged: string;
	// 'member' | 'manager' | 'staff' | 'superadmin'. Staff are users given a
	// role under Accounts & Settings > Access control. Only 'superadmin' may
	// use the backoffice (see isSuperAdmin in lib/auth).
	currentUserType?: string;
	staffRole?: { id: string; name: string; permissions: Permission[] } | null;
	// Pages a staff user may open; null for owners and players (unrestricted).
	permissions?: Permission[] | null;
	// Platform role: 'admin' | 'superadmin'; null for everyone else.
	role?: string | null;
	// Backoffice permissions the platform role grants. Read through
	// usePermissions().
	platformPermissions?: PlatformPermission[];
	isKycCompleted: boolean;
	banks: {
		bankName: string;
		accountName: string;
		accountNumber: string;
	}[];
}

export type UsersData = {
	data: User[];
	pagination: Pagination;
};
