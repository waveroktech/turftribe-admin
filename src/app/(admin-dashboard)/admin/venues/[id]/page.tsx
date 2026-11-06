import AdminVenueDetail from '@/_pages/admin/venues/detail';

import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Venue · Backoffice',
};

const AdminVenueDetailPage = async ({ params }: { params: Promise<{ id: string }> }) => {
	const { id } = await params;
	return <AdminVenueDetail id={id} />;
};

export default AdminVenueDetailPage;
