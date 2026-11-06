import { Suspense } from 'react';
import AdminVenueCalendar from '@/_pages/admin/venues/calendar';

import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Venue calendar · Backoffice',
};

// The calendar reads ?venue and ?location, which needs a Suspense boundary.
const AdminVenueCalendarPage = () => (
	<Suspense>
		<AdminVenueCalendar />
	</Suspense>
);

export default AdminVenueCalendarPage;
