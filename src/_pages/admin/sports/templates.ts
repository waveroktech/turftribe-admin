import { SportInput } from '@/features/admin/types';

// Starting points for a new sport. Admins edit everything after picking one;
// the backend is the source of truth once saved.
export const SPORT_TEMPLATES: SportInput[] = [
	{
		key: 'football',
		name: 'Football',
		isActive: true,
		formats: [
			{ name: '5-a-side', playersPerSide: 5, durationMinutes: 40 },
			{ name: '7-a-side', playersPerSide: 7, durationMinutes: 60 },
			{ name: '11-a-side', playersPerSide: 11, durationMinutes: 90 },
		],
		stats: [
			{ key: 'goals', label: 'Goals', short: 'GLS', headline: true },
			{ key: 'assists', label: 'Assists', short: 'AST', headline: true },
			{ key: 'clean sheets', label: 'Clean Sheets', short: 'CS', headline: true },
			{ key: 'saves', label: 'Saves', short: 'SAV', headline: false },
		],
		positions: [
			{ name: 'Goalkeeper', code: 'GK' },
			{ name: 'Defender', code: 'DEF' },
			{ name: 'Midfielder', code: 'MID' },
			{ name: 'Winger', code: 'WG' },
			{ name: 'Striker', code: 'ST' },
		],
	},
	{
		key: 'basketball',
		name: 'Basketball',
		isActive: true,
		formats: [
			{ name: '3x3', playersPerSide: 3, durationMinutes: 10 },
			{ name: '5v5', playersPerSide: 5, durationMinutes: 40 },
		],
		stats: [
			{ key: 'points', label: 'Points', short: 'PTS', headline: true },
			{ key: 'rebounds', label: 'Rebounds', short: 'REB', headline: true },
			{ key: 'assists', label: 'Assists', short: 'AST', headline: true },
			{ key: 'steals', label: 'Steals', short: 'STL', headline: false },
			{ key: 'blocks', label: 'Blocks', short: 'BLK', headline: false },
		],
		positions: [
			{ name: 'Point Guard', code: 'PG' },
			{ name: 'Shooting Guard', code: 'SG' },
			{ name: 'Small Forward', code: 'SF' },
			{ name: 'Power Forward', code: 'PF' },
			{ name: 'Center', code: 'C' },
		],
	},
	{
		key: 'tennis',
		name: 'Tennis',
		isActive: true,
		formats: [
			{ name: 'Singles', playersPerSide: 1, durationMinutes: 90 },
			{ name: 'Doubles', playersPerSide: 2, durationMinutes: 90 },
		],
		stats: [
			{ key: 'wins', label: 'Wins', short: 'W', headline: true },
			{ key: 'aces', label: 'Aces', short: 'ACE', headline: true },
			{ key: 'sets won', label: 'Sets Won', short: 'SET', headline: true },
		],
		positions: [
			{ name: 'Baseliner', code: 'BL' },
			{ name: 'All-court player', code: 'AC' },
			{ name: 'Serve and volleyer', code: 'SV' },
		],
	},
	{
		key: 'running',
		name: 'Running',
		isActive: true,
		formats: [
			{ name: '5K', playersPerSide: null, durationMinutes: null },
			{ name: '10K', playersPerSide: null, durationMinutes: null },
			{ name: 'Half marathon', playersPerSide: null, durationMinutes: null },
			{ name: 'Marathon', playersPerSide: null, durationMinutes: null },
		],
		stats: [
			{ key: 'distance', label: 'Distance', short: 'KM', unit: 'km', headline: true },
			{ key: 'runs', label: 'Runs', short: 'RUN', headline: true },
			{ key: 'personal bests', label: 'Personal Bests', short: 'PB', headline: true },
		],
		positions: [],
	},
];

export const BLANK_SPORT: SportInput = {
	key: '',
	name: '',
	isActive: true,
	formats: [],
	stats: [],
	positions: [],
};

export const slugify = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
