import AdminUsers from '@/_pages/admin/users';

import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Users · Backoffice',
};

const AdminUsersPage = () => {
	return <AdminUsers />;
};

export default AdminUsersPage;
