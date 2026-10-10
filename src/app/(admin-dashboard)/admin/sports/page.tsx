import AdminSports from '@/_pages/admin/sports';

import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Sports · Backoffice',
};

const AdminSportsPage = () => {
	return <AdminSports />;
};

export default AdminSportsPage;
