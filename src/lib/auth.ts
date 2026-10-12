export async function setAuthCookie(name: string, value: string) {
	try {
		const response = await fetch('/api/auth/set-cookie', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ name, value }),
		});

		return await response.json();
	} catch (error) {
		console.error('Error setting auth cookie:', error);
		throw error;
	}
}

export async function deleteAuthCookie(
	name: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const response = await fetch('/api/auth/delete-cookie', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ name }),
		});

		return await response.json();
	} catch (error) {
		console.error('Error deleting cookie:', error);
		return { success: false, error: 'Failed to delete cookie' };
	}
}

// The backoffice is for superadmins only. Every gate (sign-in, withAuth,
// the dashboard layout) asks this; the backend still enforces its own checks.
export const SUPERADMIN_USER_TYPE = 'superadmin';

export const isSuperAdmin = (user: { currentUserType?: string } | null | undefined) =>
	user?.currentUserType === SUPERADMIN_USER_TYPE;
