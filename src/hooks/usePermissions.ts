import { useMemo } from 'react';
import { useAppSelector } from '@/lib/hooks';
import { selectUser } from '@/features/auth/authSlice';
import { PLATFORM_PERMISSIONS, type PlatformPermission } from '@/lib/permissions';
import { isSuperAdmin } from '@/lib/auth';

// The one place screens ask "may this user see/do X?". Superadmins may do
// everything; nobody else gets past the backoffice gate.
export function usePermissions() {
	const user = useAppSelector(selectUser);

	return useMemo(() => {
		const superAdmin = isSuperAdmin(user);
		const granted = new Set<PlatformPermission>(superAdmin ? PLATFORM_PERMISSIONS : []);
		return {
			permissions: [...granted],
			hasBackofficeAccess: superAdmin,
			can: (permission: PlatformPermission) => granted.has(permission),
		};
	}, [user]);
}
