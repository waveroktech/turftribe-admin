import AdminVenues from '@/_pages/admin/venues/home';

import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Venues · Backoffice',
};

const AdminVenuesPage = () => {
	return <AdminVenues />;
};

export default AdminVenuesPage;
