// Mirrors the backend's Permission enum (turftribe-backend
// src/constants/permissions.ts). Each one unlocks a single manager page.
export type Permission =
	| 'dashboard'
	| 'games'
	| 'members'
	| 'payments'
	| 'subscription'
	| 'settings'
	| 'profile';

// Mirrors the backend's PlatformPermission enum (same file). Login returns
// the ones the user's platform role grants as `platformPermissions`; the
// backend enforces them on every request, so these only shape the UI.
export const PLATFORM_PERMISSIONS = [
	'platform:overview',
	'platform:communities',
	'platform:users',
	'platform:payments',
	'platform:payouts',
	'platform:subscriptions',
	'platform:sports',
] as const;

export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number];
