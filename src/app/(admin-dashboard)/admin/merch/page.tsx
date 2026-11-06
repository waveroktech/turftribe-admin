import AdminMerchProducts from '@/_pages/admin/merch/products';

import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Products · Backoffice',
};

const AdminMerchProductsPage = () => {
	return <AdminMerchProducts />;
};

export default AdminMerchProductsPage;
