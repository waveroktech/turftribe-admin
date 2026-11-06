import AdminMerchStock from '@/_pages/admin/merch/stock';

import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Stock & prices · Backoffice',
};

const AdminMerchStockPage = () => {
	return <AdminMerchStock />;
};

export default AdminMerchStockPage;
