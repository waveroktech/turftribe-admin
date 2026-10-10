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
