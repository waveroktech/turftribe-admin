import SignIn from '@/_pages/auth/sign-in';
import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Sign In',
};

const SignInpage = () => {
	return <SignIn />;
};

export default SignInpage;
