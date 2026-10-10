import { ComponentType, SVGProps } from 'react';
import { Bike, Dumbbell, Footprints, Trophy, Volleyball } from 'lucide-react';

/*
 * Sport registry. A community's `category` is its sport; everything sport-specific
 * the UI needs (icon, headline stats, position codes) lives here so pages stay
 * generic. Adding a sport = adding an entry. Unknown sports still render via
 * `getSport`'s generic fallback, which picks headline stats from the data.
 */

type IconComponent = ComponentType<{ className?: string }>;

export type StatDef = {
	key: string;
	label: string;
	/** 2–4 letter code for tight spaces (player card, list rows). */
	short: string;
	color: string;
	/** Other titles managers use for the same stat (all lower-case). */
	aliases?: string[];
	unit?: string;
};

export type SportDef = {
	id: string;
	label: string;
	/** 2–3 letter code shown on the player card when no position applies. */
	code: string;
	icon: IconComponent;
	/** Up to three stats that define a player in this sport, in display order. */
	headline: StatDef[];
	/** designation (lower-case) → short position code. */
	positions?: Record<string, string>;
	known: boolean;
};

const svgIcon = (d: string): IconComponent => {
	const Icon = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
		<svg viewBox='4 4 16 16' fill='currentColor' aria-hidden className={className} {...props}>
			<path d={d} />
		</svg>
	);
	return Icon;
};

const FootballIcon = svgIcon('M18.5663 16.5714C19.4839 15.2571 20 13.7143 20 12C20 10.4571 19.5412 9.02857 18.7957 7.82857C18.7957 7.77143 18.7384 7.77143 18.7384 7.71429C17.3047 5.48571 14.8387 4 11.9713 4C9.10394 4 6.58065 5.48571 5.2043 7.77143C5.2043 7.82857 5.14695 7.82857 5.14695 7.88571C4.40143 9.08571 4 10.5143 4 12.0571C4 13.7714 4.51613 15.3143 5.43369 16.6286L5.49104 16.6857C6.86738 18.6857 9.27599 20 11.9713 20C14.6667 20 17.0179 18.6857 18.509 16.6857C18.509 16.6286 18.509 16.6286 18.5663 16.5714ZM17.7061 15.7143L15.6416 16L14.8387 15.2L15.9857 11.8857L17.7634 11.0286L18.9104 11.7143C18.9104 11.8286 18.9104 11.9429 18.9104 12.1143C18.853 13.3714 18.4516 14.6857 17.7061 15.7143ZM17.6487 8.17143L17.19 9.88571L15.3548 10.8L12.5448 8.85714V6.62857L14.4946 5.65714C15.8136 6.17143 16.9032 7.02857 17.6487 8.17143ZM9.39068 5.65714L11.3978 6.62857V8.85714L8.58781 10.8571L6.69534 9.94286L6.23656 8.17143C7.03943 7.02857 8.12903 6.17143 9.39068 5.65714ZM5.08961 11.6L6.23656 10.9143L8.01434 11.8286L9.16129 15.1429L8.35842 15.9429L6.23656 15.7143C5.49104 14.6286 5.08961 13.3714 5.08961 12C5.08961 11.8857 5.08961 11.7143 5.08961 11.6ZM10.1935 18.6286L9.21864 16.6857L9.90681 16H14.0358L14.724 16.6857L13.7491 18.6286C13.1756 18.8 12.6022 18.8571 11.9713 18.8571C11.3405 18.8571 10.767 18.7429 10.1935 18.6286Z');
const BasketballIcon = svgIcon('M12 4C10.4178 4 8.87103 4.46919 7.55544 5.34824C6.23985 6.22729 5.21447 7.47672 4.60897 8.93853C4.00347 10.4003 3.84504 12.0089 4.15372 13.5607C4.4624 15.1126 5.22433 16.538 6.34315 17.6569C7.46197 18.7757 8.88743 19.5376 10.4393 19.8463C11.9911 20.155 13.5997 19.9965 15.0615 19.391C16.5233 18.7855 17.7727 17.7602 18.6518 16.4446C19.5308 15.129 20 13.5822 20 12C19.9978 9.87895 19.1542 7.84542 17.6544 6.34562C16.1546 4.84581 14.121 4.00224 12 4ZM6.76923 7.70538C7.63293 8.75095 8.15941 10.0338 8.27923 11.3846H5.25923C5.38067 10.0341 5.90696 8.7518 6.76923 7.70538ZM12.6154 11.3846V5.25923C13.995 5.38418 15.3026 5.93132 16.36 6.82615C15.2664 8.10776 14.6095 9.70445 14.4846 11.3846H12.6154ZM11.3846 11.3846H9.51539C9.39052 9.70445 8.73363 8.10776 7.64 6.82615C8.69745 5.93132 10.005 5.38418 11.3846 5.25923V11.3846ZM8.27923 12.6154C8.15941 13.9662 7.63293 15.249 6.76923 16.2946C5.90696 15.2482 5.38067 13.9658 5.25923 12.6154H8.27923ZM9.51539 12.6154H11.3846V18.7408C10.005 18.6158 8.69745 18.0687 7.64 17.1738C8.73349 15.8922 9.39036 14.2955 9.51539 12.6154ZM12.6154 12.6154H14.4846C14.6096 14.2955 15.2665 15.8922 16.36 17.1738C15.3026 18.0687 13.995 18.6158 12.6154 18.7408V12.6154ZM15.7208 12.6154H18.7408C18.6193 13.9658 18.093 15.2482 17.2308 16.2946C16.3671 15.249 15.8406 13.9662 15.7208 12.6154ZM15.7208 11.3846C15.8406 10.0338 16.3671 8.75095 17.2308 7.70538C18.093 8.7518 18.6193 10.0341 18.7408 11.3846H15.7208Z');
const TennisIcon = svgIcon('M17.6568 6.34308C16.538 5.22428 15.1125 4.46237 13.5606 4.15371C12.0088 3.84504 10.4003 4.00348 8.93849 4.60899C7.47669 5.21449 6.22727 6.23987 5.34823 7.55546C4.46919 8.87105 4 10.4178 4 12C4 13.5822 4.46919 15.129 5.34823 16.4445C6.22727 17.7601 7.47669 18.7855 8.93849 19.391C10.4003 19.9965 12.0088 20.155 13.5606 19.8463C15.1125 19.5376 16.538 18.7757 17.6568 17.6569C18.4052 16.9172 18.9994 16.0363 19.4049 15.0652C19.8105 14.0942 20.0193 13.0523 20.0193 12C20.0193 10.9477 19.8105 9.90582 19.4049 8.93478C18.9994 7.96374 18.4052 7.08283 17.6568 6.34308ZM7.20909 7.21308C8.31676 6.1039 9.77636 5.41545 11.3368 5.26616C11.1864 6.82651 10.4949 8.2851 9.38217 9.38923C8.27654 10.5 6.81765 11.1897 5.25755 11.3392C5.40813 9.77867 6.09828 8.31948 7.20909 7.21308ZM5.25371 12.5754C7.14331 12.4245 8.9167 11.603 10.2537 10.2592C11.5983 8.92265 12.4204 7.14912 12.5714 5.25923C14.1623 5.39186 15.6547 6.08386 16.7838 7.2124C17.9129 8.34094 18.6057 9.83303 18.7391 11.4238C16.8502 11.5785 15.0775 12.3988 13.7369 13.7385C12.3963 15.0782 11.575 16.8504 11.4191 18.7392C9.82821 18.6066 8.33578 17.9146 7.20667 16.7861C6.07757 15.6575 5.38482 14.1654 5.2514 12.5746L5.25371 12.5754ZM16.786 16.7869C15.6781 17.8958 14.2186 18.5842 12.6583 18.7338C12.812 17.1747 13.5017 15.7172 14.6099 14.6097C15.718 13.5022 17.176 12.8134 18.7352 12.6608C18.5853 14.221 17.896 15.6802 16.786 16.7869Z');

const SPORTS: Record<string, Omit<SportDef, 'id' | 'known'>> = {
	football: {
		label: 'Football',
		code: 'FB',
		icon: FootballIcon,
		headline: [
			{ key: 'goals', label: 'Goals', short: 'GLS', color: '#27AE60', aliases: ['goal'] },
			{ key: 'assists', label: 'Assists', short: 'AST', color: '#1270CA', aliases: ['assist'] },
			{
				key: 'clean sheets',
				label: 'Clean Sheets',
				short: 'CS',
				color: '#F2994A',
				aliases: ['clean sheet', 'cleansheet', 'cleansheets'],
			},
		],
		positions: {
			goalkeeper: 'GK',
			defender: 'DEF',
			'defensive midfielder': 'DM',
			'attacking midfielder': 'AM',
			midfielder: 'MID',
			winger: 'WG',
			striker: 'ST',
			forward: 'FW',
			coach: 'COA',
		},
	},
	basketball: {
		label: 'Basketball',
		code: 'BB',
		icon: BasketballIcon,
		headline: [
			{ key: 'points', label: 'Points', short: 'PTS', color: '#F2994A', aliases: ['point', 'pts'] },
			{ key: 'rebounds', label: 'Rebounds', short: 'REB', color: '#1270CA', aliases: ['rebound', 'reb'] },
			{ key: 'assists', label: 'Assists', short: 'AST', color: '#27AE60', aliases: ['assist', 'ast'] },
		],
		positions: {
			'point guard (pg)': 'PG',
			'shooting guard (sg)': 'SG',
			'power forward (pf)': 'PF',
			'small forward (sf)': 'SF',
			'center back (cb)': 'C',
			center: 'C',
			coach: 'COA',
		},
	},
	tennis: {
		label: 'Tennis',
		code: 'TN',
		icon: TennisIcon,
		headline: [
			{ key: 'wins', label: 'Wins', short: 'W', color: '#27AE60', aliases: ['win', 'matches won'] },
			{ key: 'aces', label: 'Aces', short: 'ACE', color: '#9B51E0', aliases: ['ace'] },
			{ key: 'sets won', label: 'Sets Won', short: 'SET', color: '#1270CA', aliases: ['sets', 'set won', 'set'] },
		],
		positions: {
			'baseliner (tennis)': 'BL',
			'all-court player (tennis)': 'AC',
			'counterpuncher (tennis)': 'CP',
			'big server (tennis)': 'BS',
			'coach (tennis)': 'COA',
		},
	},
	volleyball: {
		label: 'Volleyball',
		code: 'VB',
		icon: Volleyball,
		headline: [
			{ key: 'kills', label: 'Kills', short: 'KIL', color: '#EB5757', aliases: ['kill', 'spikes', 'spike'] },
			{ key: 'aces', label: 'Aces', short: 'ACE', color: '#9B51E0', aliases: ['ace'] },
			{ key: 'blocks', label: 'Blocks', short: 'BLK', color: '#1270CA', aliases: ['block'] },
		],
		positions: {
			setter: 'S',
			hitter: 'OH',
			'defensive specialist': 'DS',
			coach: 'COA',
		},
	},
	running: {
		label: 'Running',
		code: 'RN',
		icon: Footprints,
		headline: [
			{ key: 'distance', label: 'Distance', short: 'KM', color: '#27AE60', aliases: ['km', 'kilometres', 'kilometers'], unit: 'km' },
			{ key: 'runs', label: 'Runs', short: 'RUN', color: '#1270CA', aliases: ['run', 'races', 'race'] },
			{ key: 'personal bests', label: 'Personal Bests', short: 'PB', color: '#F2C94C', aliases: ['pb', 'pbs', 'personal best'] },
		],
	},
	cycling: {
		label: 'Cycling',
		code: 'CY',
		icon: Bike,
		headline: [
			{ key: 'distance', label: 'Distance', short: 'KM', color: '#27AE60', aliases: ['km'], unit: 'km' },
			{ key: 'rides', label: 'Rides', short: 'RID', color: '#1270CA', aliases: ['ride'] },
			{ key: 'elevation', label: 'Elevation', short: 'ELV', color: '#F2994A', aliases: ['climb', 'climbing'], unit: 'm' },
		],
	},
	fitness: {
		label: 'Fitness',
		code: 'FT',
		icon: Dumbbell,
		headline: [
			{ key: 'sessions', label: 'Sessions', short: 'SES', color: '#27AE60', aliases: ['session', 'workouts', 'workout'] },
		],
	},
};

const SPORT_ALIASES: Record<string, string> = {
	soccer: 'football',
	'5-a-side': 'football',
	futsal: 'football',
	athletics: 'running',
	jogging: 'running',
	gym: 'fitness',
};

/** Palette for stats a sport doesn't define, in a stable order. */
export const EXTRA_COLORS = ['#9B51E0', '#EB5757', '#2D9CDB', '#F2C94C', '#64748B'];

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

/** Backend default for communities without a category. */
export const DEFAULT_SPORT = 'football';

export const sportId = (category?: string | null) => {
	const key = (category || DEFAULT_SPORT).trim().toLowerCase();
	return SPORT_ALIASES[key] ?? key;
};

export const getSport = (category?: string | null): SportDef => {
	const id = sportId(category);
	const def = SPORTS[id];
	if (def) return { id, known: true, ...def };
	return {
		id,
		label: titleCase(id),
		code: id.replace(/[^a-z]/g, '').slice(0, 2).toUpperCase() || 'SP',
		icon: Trophy,
		headline: [],
		known: false,
	};
};

/** Folds a recorded stat title onto the sport's canonical key. */
export const statKey = (sport: SportDef, title: string) => {
	const key = title.trim().toLowerCase();
	const match = sport.headline.find((s) => s.key === key || s.aliases?.includes(key));
	return match?.key ?? key;
};

export const statDef = (sport: SportDef, key: string, index = 0): StatDef =>
	sport.headline.find((s) => s.key === key) ?? {
		key,
		label: titleCase(key),
		short: key.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase(),
		color: EXTRA_COLORS[index % EXTRA_COLORS.length],
	};

export const positionCode = (sport: SportDef, designation?: string) => {
	const key = designation?.trim().toLowerCase();
	if (!key) return sport.code;
	return sport.positions?.[key] ?? sport.code;
};
