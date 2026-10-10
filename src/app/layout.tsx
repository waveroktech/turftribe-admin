import type { Metadata, Viewport } from 'next';
import {
	Poppins,
	Quicksand,
	Plus_Jakarta_Sans,
	Questrial,
	Inter,
	DM_Sans,
	Lexend,
} from 'next/font/google';
import { metaDataOptions } from '@/lib/metadata';
import { Toaster as Sonner } from '@/components/ui/sonner';

import localFont from 'next/font/local';
import StoreProvider from './store-provider';
import './globals.css';

// Configure the fonts
const sfPro = localFont({
	src: [
		{
			path: './fonts/SFProRegular.otf',
			weight: '400',
			style: 'normal',
		},
		{
			path: './fonts/SFProMedium.otf',
			weight: '500',
			style: 'normal',
		},
		{
			path: './fonts/SFProMedium.otf',
			weight: '600',
			style: 'normal',
		},
		{
			path: './fonts/SFProBold.otf',
			weight: '700',
			style: 'normal',
		},
	],
	variable: '--font-sfpro',
});

const quicksand = Quicksand({
	variable: '--font-quicksand',
	subsets: ['latin'],
	weight: ['300', '400', '500', '600', '700'],
});

const poppins = Poppins({
	variable: '--font-poppins',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
});

const plus_jakarta = Plus_Jakarta_Sans({
	variable: '--font-plus_jakarta',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700', '800'],
});

const questrial = Questrial({
	variable: '--font-questrial',
	subsets: ['latin'],
	weight: ['400'],
});

const inter = Inter({
	variable: '--font-inter',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
});

const dmSans = DM_Sans({
	variable: '--font-dm-sans',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
});

const lexend = Lexend({
	variable: '--font-lexend',
	subsets: ['latin'],
	weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
	title: {
		default: 'TurfTribe Backoffice',
		template: '%s | TurfTribe Backoffice',
	},
	description: 'Platform administration for TurfTribe.',
	metadataBase: new URL('https://turftriibe.com'),
	...metaDataOptions,
	robots: { index: false, follow: false },
};
export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	viewportFit: 'cover',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='en'>
			<body
				className={`${quicksand.variable} 
				${poppins.variable} 
				${sfPro.variable} 
				${plus_jakarta.variable} 
				${questrial.variable} 
				${inter.variable}
				${dmSans.variable}
				${lexend.variable}
				antialiased`}>
				<Sonner richColors position='top-right' closeButton />
				<StoreProvider>{children}</StoreProvider>
			</body>
		</html>
	);
}