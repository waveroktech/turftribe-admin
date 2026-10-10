import { useMemo } from 'react';
import { useAppSelector } from '@/lib/hooks';
import { selectUser } from '@/features/auth/authSlice';
import type { User } from '@/features/users/types';
import type { PlatformPermission } from '@/lib/permissions';

export const platformPermissionsOf = (user: Pick<User, 'platformPermissions'> | null | undefined) =>
	user?.platformPermissions ?? [];

// Anyone whose platform role grants at least one backoffice permission.
export const hasBackofficeAccess = (user: Pick<User, 'platformPermissions'> | null | undefined) =>
	platformPermissionsOf(user).length > 0;

// The one place screens ask "may this user see/do X?". The answer comes from
// the permissions the backend sent at login, so the UI hides exactly what
// the API would refuse.
export function usePermissions() {
	const user = useAppSelector(selectUser);

	return useMemo(() => {
		const granted = new Set<PlatformPermission>(platformPermissionsOf(user));
		return {
			permissions: [...granted],
			hasBackofficeAccess: granted.size > 0,
			can: (permission: PlatformPermission) => granted.has(permission),
		};
	}, [user]);
}
