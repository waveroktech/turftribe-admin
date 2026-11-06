import AdminMerchOrders from '@/_pages/admin/merch/orders';

import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Orders · Backoffice',
};

const AdminMerchOrdersPage = () => {
	return <AdminMerchOrders />;
};

export default AdminMerchOrdersPage;
