import AdminVenueBookings from '@/_pages/admin/venues/bookings';

import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Venue bookings · Backoffice',
};

const AdminVenueBookingsPage = () => {
	return <AdminVenueBookings />;
};

export default AdminVenueBookingsPage;
