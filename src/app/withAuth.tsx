'use client';

import { selectUser } from '@/features/auth/authSlice';
import { useAppSelector } from '@/lib/hooks';
import { redirect } from 'next/navigation';

// Only checks that someone is signed in. What they may see or do is decided by
// the backend, which refuses requests the user isn't allowed to make.
export const withAuth = (WrappedComponent: any) => {
	return function WithAuth(props: any) {
		const user = useAppSelector(selectUser);

		if (!user) {
			redirect('/sign-in');
		}

		return <WrappedComponent {...props} />;
	};
};
