import AdminMerchVendors from '@/_pages/admin/merch/vendors';

import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Vendors · Backoffice',
};

const AdminMerchVendorsPage = () => {
	return <AdminMerchVendors />;
};

export default AdminMerchVendorsPage;
