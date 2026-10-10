import AdminDashboard from '@/_pages/admin/dashboard';

import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Backoffice',
};

const AdminDashboardPage = () => {
	return <AdminDashboard />;
};

export default AdminDashboardPage;
