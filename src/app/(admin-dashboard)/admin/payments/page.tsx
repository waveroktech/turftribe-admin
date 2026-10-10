import AdminPayments from '@/_pages/admin/payments';

import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Payments · Backoffice',
};

const AdminPaymentsPage = () => {
	return <AdminPayments />;
};

export default AdminPaymentsPage;
