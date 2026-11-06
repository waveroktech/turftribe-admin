import AdminVenueClusters from '@/_pages/admin/venues/clusters';

import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Clusters & fees · Backoffice',
};

const AdminVenueClustersPage = () => {
	return <AdminVenueClusters />;
};

export default AdminVenueClustersPage;
