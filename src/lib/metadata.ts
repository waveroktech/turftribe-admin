import { Metadata } from 'next';

const title =
	'Turftriibe — Find your team, play your game, make every match unforgettable.';
const description =
	'Sign up today and experience football like never before. Get matched, stay in the game, and join a community that’s passionate about social sport community —just like you.';
const url = 'https://turftriibe.com';

interface NewMetada extends Metadata {
	whatsApp: {
		card: 'summary_large_image';
		title: string;
		description: string;
		image: Record<string, string> | string;
		url: string;
	};
}

export const metaDataOptions: NewMetada = {
	generator: 'Next.js',
	applicationName: 'Turftribe',
	referrer: 'origin-when-cross-origin',
	keywords: [
		'local sports',
		'find pitches',
		'sports teammates',
		'nearby games',
		'team finder',
		'pickup games',
		'sports community',
		'match organizer',
		'field locator',
		'game scheduler',
		'sports networking',
		'team building',
		'recreational sports',
		'play together',
		'game discovery',
		'sports meetup',
		'pitch finder',
		'team matchmaking',
		'local matches',
		'sports coordination',
	],
	authors: [{ name: 'Kelvin Ochubili', url: 'https://twitter.com/iykekelvins' }],
	creator: 'Kelvin Ochubili',
	publisher: 'Kelvin Ochubili',
	formatDetection: {
		email: false,
		address: false,
		telephone: false,
	},
	openGraph: {
		title,
		description,
		url,
		siteName: 'Turftribe',
		images: [
			{
				url: `/opengraph-image.png`,
				width: 800,
				height: 600,
				alt: 'Turftribe',
			},
			{
				url: `/opengraph-image.png`,
				width: 1800,
				height: 1600,
				alt: 'Turftribe',
			},
		],
		locale: 'en_US',
		type: 'website',
	},
	icons: {
		icon: '/icons/favicon.png',
		shortcut: '/icons/favicon.png',
		apple: '/icons/favicon.png',
		other: {
			rel: 'apple-touch-icon-precomposed',
			url: '/icons/favicon.png',
		},
	},
	twitter: {
		card: 'summary_large_image',
		title,
		description,
		creator: '@iykekelvins',
		images: {
			url: `/twitter-image.png`,
			alt: 'Turftribe',
		},
	},
	whatsApp: {
		card: 'summary_large_image',
		image: '/twitter-image.png',
		title: 'Turftriibe — Find your team, play your game',
		description:
			'Sign up today and experience football like never before. Get matched, stay in the game, and join a community that’s passionate about social sport community—just like you.',
		url: 'https://turfriibe.com',
	},
};
