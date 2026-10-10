import AdminCommunities from '@/_pages/admin/communities';

import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Communities · Backoffice',
};

const AdminCommunitiesPage = () => {
	return <AdminCommunities />;
};

export default AdminCommunitiesPage;
