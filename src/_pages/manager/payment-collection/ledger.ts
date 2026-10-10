import {
	addMonths,
	endOfMonth,
	endOfYear,
	format,
	isWithinInterval,
	startOfMonth,
	startOfYear,
	subMonths,
	subYears,
} from 'date-fns';
import { saveAs } from 'file-saver';
import { BookingsSummary, GamePayoutsSummary } from '@/features/manager/payment-collection/types';

export const naira = (value: number) => `₦${Math.round(value).toLocaleString('en-NG')}`;

export const compactNaira = new Intl.NumberFormat('en-NG', {
	style: 'currency',
	currency: 'NGN',
	notation: 'compact',
	maximumFractionDigits: 1,
});

export const shortDate = (value?: string | null) =>
	value ? format(new Date(value), 'd MMM yyyy') : '';

// ── Periods ────────────────────────────────────────────────────────────────

export type Period = { key: string; label: string; from?: Date; to?: Date };

export const ALL_TIME: Period = { key: 'all', label: 'All time' };

export const periodPresets = (now = new Date()): Period[] => [
	ALL_TIME,
	{ key: 'this-month', label: 'This month', from: startOfMonth(now), to: endOfMonth(now) },
	{
		key: 'last-month',
		label: 'Last month',
		from: startOfMonth(subMonths(now, 1)),
		to: endOfMonth(subMonths(now, 1)),
	},
	{
		key: 'last-3',
		label: 'Last 3 months',
		from: startOfMonth(subMonths(now, 2)),
		to: endOfMonth(now),
	},
	{ key: 'this-year', label: 'This year', from: startOfYear(now), to: endOfYear(now) },
	{
		key: 'last-year',
		label: 'Last year',
		from: startOfYear(subYears(now, 1)),
		to: endOfYear(subYears(now, 1)),
	},
];

export const monthPeriod = (month: Date): Period => ({
	key: `month-${format(month, 'yyyy-MM')}`,
	label: format(month, 'MMMM yyyy'),
	from: startOfMonth(month),
	to: endOfMonth(month),
});

export const yearPeriod = (year: number): Period => {
	const date = new Date(year, 0, 1);
	return { key: `year-${year}`, label: String(year), from: startOfYear(date), to: endOfYear(date) };
};

export const inPeriod = (period: Period, value?: string | null) => {
	if (!period.from || !period.to) return true;
	if (!value) return false;
	return isWithinInterval(new Date(value), { start: period.from, end: period.to });
};

// ── Search ─────────────────────────────────────────────────────────────

export const normalise = (query: string) => query.trim().replace(/^@/, '');

// ── Trend ──────────────────────────────────────────────────────────────────

export type TrendView = 'month' | 'year';

export type TrendBucketInfo = {
	key: string;
	label: string;
	period: string;
	start: Date;
	from: string;
	to: string;
};

export type TrendPoint = TrendBucketInfo & {
	collected: number;
	commission: number;
	games: number;
	bookings: number;
	paidOut: number;
};

// Months of the chosen year up to now (later months would read as ₦0), or one
// bucket per year.
export const trendBuckets = (view: TrendView, year: number, years: number[]): TrendBucketInfo[] => {
	const now = new Date();
	if (view === 'month') {
		return Array.from({ length: 12 }, (_, i) => addMonths(new Date(year, 0, 1), i))
			.filter((start) => start <= now)
			.map((start) => ({
				key: format(start, 'yyyy-MM'),
				label: format(start, 'MMM'),
				period: format(start, 'MMMM yyyy'),
				start,
				from: startOfMonth(start).toISOString(),
				to: endOfMonth(start).toISOString(),
			}));
	}
	return years.map((y) => {
		const start = new Date(y, 0, 1);
		return {
			key: String(y),
			label: String(y),
			period: String(y),
			start,
			from: startOfYear(start).toISOString(),
			to: endOfYear(start).toISOString(),
		};
	});
};

export const trendPoints = (
	buckets: TrendBucketInfo[],
	data?: Record<string, { bookings: BookingsSummary; payouts: GamePayoutsSummary }>
): TrendPoint[] =>
	buckets.map((bucket) => {
		const entry = data?.[bucket.key];
		return {
			...bucket,
			collected: entry?.bookings.collected ?? 0,
			commission: entry?.bookings.commission ?? 0,
			games: entry?.bookings.games ?? 0,
			bookings: entry?.bookings.bookings ?? 0,
			paidOut: entry?.payouts.paid.amount ?? 0,
		};
	});

// Years from the community's first game to now.
export const ledgerYears = (matchDates: Record<string, string>) => {
	const current = new Date().getFullYear();
	const first = Object.values(matchDates).reduce(
		(min, date) => Math.min(min, new Date(date).getFullYear()),
		current
	);
	return Array.from({ length: current - first + 1 }, (_, i) => first + i);
};

// ── CSV export ─────────────────────────────────────────────────────────────

type Cell = string | number | null | undefined;

const csvCell = (value: Cell) => {
	const text = value === null || value === undefined ? '' : String(value);
	return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const downloadCsv = (filename: string, header: string[], rows: Cell[][]) => {
	const body = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
	// BOM so Excel opens ₦ and names correctly.
	saveAs(new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' }), filename);
};

export const csvName = (community: string | undefined, what: string, period: Period) =>
	[community || 'community', what, period.key === 'all' ? 'all-time' : period.label, format(new Date(), 'yyyy-MM-dd')]
		.join('_')
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, '-') + '.csv';

export const sum = <T>(rows: T[], pick: (row: T) => number) =>
	rows.reduce((total, row) => total + (pick(row) || 0), 0);
