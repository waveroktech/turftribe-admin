import { redirect } from 'next/navigation';

// The backoffice lives under /admin; withAuth sends signed-out visitors on to /sign-in.
export default function Home() {
	redirect('/admin');
}
