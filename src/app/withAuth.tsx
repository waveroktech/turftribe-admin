'use client';

import { selectUser } from '@/features/auth/authSlice';
import { useAppSelector } from '@/lib/hooks';
import { redirect } from 'next/navigation';
import { isSuperAdmin } from '@/lib/auth';

export const withAuth = (WrappedComponent: any) => {
	return function WithAuth(props: any) {
		const user = useAppSelector(selectUser);

		if (!isSuperAdmin(user)) {
			redirect('/sign-in');
		}

		return <WrappedComponent {...props} />;
	};
};
