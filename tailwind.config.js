/* eslint-disable @typescript-eslint/no-require-imports */
/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['class'],
	content: [
		'./app/**/*.{js,ts,jsx,tsx,mdx}',
		'./_pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./shared/**/*.{js,ts,jsx,tsx,mdx}',
		'./components/**/*.{js,ts,jsx,tsx,mdx}',

		// Or if using `src` directory:
		'./src/**/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			boxShadow: {
				auth: '4px 4px 16px 10px #868C981A',
				card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px -12px rgba(16, 24, 40, 0.12)',
				'card-hover':
					'0 2px 4px rgba(16, 24, 40, 0.06), 0 20px 40px -16px rgba(16, 24, 40, 0.22)',
			},
			colors: {
				'primary-black': '#0C0C0C',
				primary: {
					DEFAULT: '#CEEE6F',
					foreground: 'hsl(var(--brand-foreground))',
				},
				brand: {
					DEFAULT: 'hsl(var(--brand) / <alpha-value>)',
					foreground: 'hsl(var(--brand-foreground) / <alpha-value>)',
					soft: 'hsl(var(--brand-soft) / <alpha-value>)',
					strong: 'hsl(var(--brand-strong) / <alpha-value>)',
				},
				ink: {
					DEFAULT: 'hsl(var(--ink) / <alpha-value>)',
					foreground: 'hsl(var(--ink-foreground) / <alpha-value>)',
				},
				surface: {
					DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
					raised: 'hsl(var(--surface-raised) / <alpha-value>)',
				},
				line: 'hsl(var(--line) / <alpha-value>)',
				subtle: 'hsl(var(--text-subtle) / <alpha-value>)',
				success: 'hsl(var(--success) / <alpha-value>)',
				warning: 'hsl(var(--warning) / <alpha-value>)',
				danger: 'hsl(var(--danger) / <alpha-value>)',
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
				},
				gray: {
					1: '#333333',
					2: '#F1F1F1',
					5: '#E0E0E0',
					6: '#F2F2F2',
					900: '#18181B',
				},
				grey: {
					default: '#E5E5E5',
					1: '#F8F8F8',
				},
				'icon-grey': '#606367',
				neutral: {
					100: '#E7EAEE',
					500: '#64748B',
					800: '#191D23',
				},
				green: '#27AE60',
				'green-light': '#F8FFE4',
				textGrey: '#333333',
				grey: '#A5A5A5',
				backgroundColor: '#868C9866',
				red: '#F23E2C',
				pill: '#5258660D',
				lightGrey: '#F7F7F7',
				oddCard: '#212B06BF',
				bgGrey: '#f1f1f1',
				yellow: '#F2C94C',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))',
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))',
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					1: 'hsl(var(--chart-1))',
					2: 'hsl(var(--chart-2))',
					3: 'hsl(var(--chart-3))',
					4: 'hsl(var(--chart-4))',
					5: 'hsl(var(--chart-5))',
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))',
				},
			},
			fontFamily: {
				poppins: ['var(--font-poppins)'],
				quicksand: ['var(--font-quicksand)'],
				sfpro: ['var(--font-sfpro)'],
				plus_jakarta: ['var(--font-plus_jakarta)'],
				questrial: ['var(--font-questrial)'],
				inter: ['var(--font-inter)'],
				lexend: ['var(--font-lexend)'],
				'dm-sans': ['var(--font-dm-sans)'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			screens: {
				des: '1200px',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};
