import type { FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { addDays, format, isSameMonth, startOfDay } from 'date-fns';
import { haversineKm, locationCoordinates } from './geo';
import type {
	Area,
	AreaInput,
	BlockDaysInput,
	Cluster,
	ClusterInput,
	LocationInput,
	ManualBookingInput,
	Place,
	PlaceInput,
	ScheduleInput,
	Slot,
	SlotAction,
	SlotBooking,
	SlotStatus,
	StoredSlotStatus,
	VenueBooking,
	VenueBookingStatus,
	VenueLocation,
	VenueOrganisation,
	VenueOrganisationInput,
	VenueOverview,
	VenueSettings,
} from './types';

/*
 * Demo venue data, served in place of the /venues/* endpoints until the
 * backend ships. On by default in development and off in production builds;
 * NEXT_PUBLIC_VENUES_DEMO=true|false overrides either way. The store lives in
 * memory, so edits last until the page reloads.
 *
 * NEXT_PUBLIC_VENUES_DEMO=empty starts with nothing (only the default fee), to
 * see the pages as they'll look on day one.
 *
 * The seed mirrors the launch plan: TurfTriibe is the first venue owner, with
 * a site in Ikoyi and one in Ikeja, inside the two launch clusters.
 */
export const VENUES_DEMO =
	process.env.NEXT_PUBLIC_VENUES_DEMO === 'true' ||
	process.env.NEXT_PUBLIC_VENUES_DEMO === 'empty' ||
	(process.env.NEXT_PUBLIC_VENUES_DEMO !== 'false' && process.env.NODE_ENV === 'development');

export const VENUES_DEMO_EMPTY = process.env.NEXT_PUBLIC_VENUES_DEMO === 'empty';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const seeded = (seed: number) => () => {
	seed = (seed * 16807) % 2147483647;
	return (seed - 1) / 2147483646;
};

let nextId = 1;
const id = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${nextId++}`;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

const image = (label: string, bg: string) =>
	`https://placehold.co/800x500/${bg}/ffffff/png?text=${encodeURIComponent(label)}`;

// Settings

let settings: VenueSettings = { defaultFeeRate: 10 };

// Organisations

type StoredOrg = Omit<VenueOrganisation, 'stats'>;

const TURFTRIIBE_ID = 'org-turftriibe';

let organisations: StoredOrg[] = [
	{
		id: TURFTRIIBE_ID,
		type: 'venue',
		name: 'TurfTriibe',
		platformOwned: true,
		address: 'Ikoyi and Ikeja, Lagos',
		contact: { name: 'TurfTriibe Venues', email: 'venues@turftriibe.com', phone: '0700 000 0000' },
		sports: ['football', 'padel', 'basketball'],
		payout: {
			bankName: 'TurfTriibe operating account',
			accountNumber: '••••••••••',
			accountName: 'TurfTriibe',
			paystackSubaccountCode: null,
		},
		feeRate: null,
		status: 'active',
		owners: [],
		createdAt: daysAgo(30),
	},
];

// Places and locations

let places: Place[] = [
	{
		id: 'place-tt-ikoyi',
		organisationId: TURFTRIIBE_ID,
		name: 'TurfTriibe Ikoyi',
		address: 'Off Alexander Road, Ikoyi, Lagos',
		coordinates: { lat: 6.4527, lng: 3.4385 },
		photos: [image('TurfTriibe Ikoyi', '1b5e20')],
		amenities: ['Floodlights', 'Changing rooms', 'Parking', 'Drinking water'],
		createdAt: daysAgo(30),
	},
	{
		id: 'place-tt-ikeja',
		organisationId: TURFTRIIBE_ID,
		name: 'TurfTriibe Ikeja',
		address: 'Off Obafemi Awolowo Way, Ikeja, Lagos',
		coordinates: { lat: 6.599, lng: 3.356 },
		photos: [image('TurfTriibe Ikeja', '33691e')],
		amenities: ['Floodlights', 'Parking', 'Seating'],
		createdAt: daysAgo(21),
	},
];

let locations: VenueLocation[] = [
	{
		id: 'loc-ikoyi-pitch-a',
		organisationId: TURFTRIIBE_ID,
		placeId: 'place-tt-ikoyi',
		name: 'Pitch A · 5-a-side',
		sport: 'football',
		capacity: 12,
		basePrice: 40000,
		coordinates: null,
		status: 'active',
		scheduledUntil: null,
		createdAt: daysAgo(30),
	},
	{
		id: 'loc-ikoyi-padel-1',
		organisationId: TURFTRIIBE_ID,
		placeId: 'place-tt-ikoyi',
		name: 'Padel Court 1',
		sport: 'padel',
		capacity: 4,
		basePrice: 25000,
		coordinates: null,
		status: 'active',
		scheduledUntil: null,
		createdAt: daysAgo(30),
	},
	{
		id: 'loc-ikeja-main',
		organisationId: TURFTRIIBE_ID,
		placeId: 'place-tt-ikeja',
		name: 'Main Pitch · 7-a-side',
		sport: 'football',
		capacity: 16,
		basePrice: 30000,
		coordinates: null,
		status: 'active',
		scheduledUntil: null,
		createdAt: daysAgo(21),
	},
	{
		id: 'loc-opebi-popup',
		organisationId: TURFTRIIBE_ID,
		placeId: null,
		name: 'Pop-up Court, Opebi',
		sport: 'basketball',
		capacity: 10,
		basePrice: 15000,
		coordinates: null,
		status: 'active',
		scheduledUntil: null,
		createdAt: daysAgo(3),
	},
];

// Slots and bookings

type StoredSlot = {
	id: string;
	locationId: string;
	start: number;
	end: number;
	price: number;
	status: StoredSlotStatus;
	blockReason: string | null;
	bookingId: string | null;
};

type StoredBooking = Omit<SlotBooking, 'fee'> & {
	locationId: string;
	slotIds: string[];
	cancelled: boolean;
};

let slots: StoredSlot[] = [];
let bookings: StoredBooking[] = [];
let referenceSeq = 31540;

const timeOf = (hhmm: string) => {
	const [h, m] = hhmm.split(':').map(Number);
	return h * 60 + m;
};

const dayKey = (time: number) => format(time, 'yyyy-MM-dd');

const createSchedule = (locationId: string, input: ScheduleInput) => {
	const existingByDay = new Map<string, StoredSlot[]>();
	for (const slot of slots.filter((s) => s.locationId === locationId)) {
		const key = dayKey(slot.start);
		existingByDay.set(key, [...(existingByDay.get(key) ?? []), slot]);
	}

	const open = timeOf(input.openTime);
	const close = timeOf(input.closeTime);
	const evening = input.peak?.eveningFrom ? timeOf(input.peak.eveningFrom) : null;
	let created = 0;
	let skipped = 0;
	const fresh: StoredSlot[] = [];

	for (let day = new Date(`${input.from}T00:00:00`); dayKey(day.getTime()) <= input.to; day = addDays(day, 1)) {
		const weekday = day.getDay();
		if (!input.days.includes(weekday)) continue;
		const existing = existingByDay.get(dayKey(day.getTime())) ?? [];
		for (let minute = open; minute + input.intervalMinutes <= close; minute += input.intervalMinutes) {
			const start = day.getTime() + minute * MINUTE;
			const end = start + input.intervalMinutes * MINUTE;
			if (existing.some((slot) => slot.start < end && slot.end > start)) {
				skipped++;
				continue;
			}
			const weekend = weekday === 0 || weekday === 6;
			const peak = input.peak && ((input.peak.weekends && weekend) || (evening !== null && minute >= evening));
			fresh.push({
				id: id('slot'),
				locationId,
				start,
				end,
				price: peak ? input.peak!.price : input.price,
				status: 'open',
				blockReason: null,
				bookingId: null,
			});
			created++;
		}
	}

	slots = [...slots, ...fresh];
	const last = slots.filter((s) => s.locationId === locationId).reduce((max, s) => Math.max(max, s.end), 0);
	locations = locations.map((l) =>
		l.id === locationId ? { ...l, scheduledUntil: last ? new Date(last).toISOString() : null } : l
	);
	return { created, skipped };
};

const book = (
	slotIds: string[],
	bookedBy: StoredBooking['bookedBy'],
	source: StoredBooking['source'],
	amount: number,
	extra: Partial<Pick<StoredBooking, 'game' | 'recurring' | 'note' | 'createdAt'>> = {}
) => {
	const booking: StoredBooking = {
		id: id('booking'),
		reference: `TT-VEN-${referenceSeq++}`,
		bookedBy,
		source,
		amount,
		game: null,
		recurring: null,
		note: null,
		createdAt: new Date().toISOString(),
		...extra,
		locationId: slots.find((s) => s.id === slotIds[0])!.locationId,
		slotIds,
		cancelled: false,
	};
	bookings = [...bookings, booking];
	const ids = new Set(slotIds);
	slots = slots.map((slot) => (ids.has(slot.id) ? { ...slot, status: 'booked', bookingId: booking.id } : slot));
	return booking;
};

// Seed: 3 weeks back to 4 weeks ahead, open 07:00–22:00, peak after 17:00 and weekends.
(() => {
	const from = format(addDays(new Date(), -21), 'yyyy-MM-dd');
	const to = format(addDays(new Date(), 28), 'yyyy-MM-dd');
	const everyDay = [0, 1, 2, 3, 4, 5, 6];
	const prices: Record<string, [number, number]> = {
		'loc-ikoyi-pitch-a': [40000, 50000],
		'loc-ikoyi-padel-1': [25000, 30000],
		'loc-ikeja-main': [30000, 38000],
	};
	for (const [locationId, [price, peak]] of Object.entries(prices))
		createSchedule(locationId, {
			from,
			to,
			days: everyDay,
			openTime: '07:00',
			closeTime: '22:00',
			intervalMinutes: 60,
			price,
			peak: { price: peak, eveningFrom: '17:00', weekends: true },
		});

	const community = (name: string, contactName: string, phone: string) => ({
		type: 'community' as const,
		id: `community-${name.toLowerCase().replace(/\W+/g, '-')}`,
		name,
		contactName,
		phone,
		email: `${contactName.split(' ')[0].toLowerCase()}@example.com`,
	});

	const slotsAt = (locationId: string, day: Date, hour: number, hours: number) => {
		const start = startOfDay(day).getTime() + hour * HOUR;
		const found = slots.filter(
			(s) => s.locationId === locationId && s.start >= start && s.end <= start + hours * HOUR && s.status === 'open'
		);
		return found.length === hours ? found : null;
	};

	const weekly = (
		locationId: string,
		weekday: number,
		hour: number,
		hours: number,
		bookedBy: StoredBooking['bookedBy'],
		gameTitle: string
	) => {
		const first = addDays(startOfDay(new Date()), -21);
		const offset = (weekday - first.getDay() + 7) % 7;
		const groupId = id('recurring');
		for (let week = 0; week < 8; week++) {
			const day = addDays(first, offset + week * 7);
			const found = slotsAt(locationId, day, hour, hours);
			if (!found) continue;
			book(
				found.map((s) => s.id),
				bookedBy,
				'online',
				found.reduce((sum, s) => sum + s.price, 0),
				{
					game: { id: id('game'), title: gameTitle },
					recurring: { groupId, index: week + 1, total: 8 },
					createdAt: new Date(first.getTime() - DAY).toISOString(),
				}
			);
		}
	};

	weekly('loc-ikoyi-pitch-a', 4, 19, 2, community('Lekki Ballers', 'Tolu Adeyemi', '0803 214 5567'), 'Thursday 5-a-side');
	weekly('loc-ikoyi-pitch-a', 0, 8, 2, community('Ikoyi Sunday League', 'Chidi Okafor', '0812 330 9821'), 'Sunday league');
	weekly('loc-ikoyi-padel-1', 2, 18, 1, community('Padel Social Ikoyi', 'Amaka Eze', '0706 554 1209'), 'Padel social');
	weekly('loc-ikeja-main', 3, 19, 2, community('Ikeja Footy Club', 'Seun Bakare', '0905 118 7743'), 'Midweek 7s');

	// One-off bookings: players online, walk-ins by phone.
	const rand = seeded(7);
	const players = [
		['Kunle Ajayi', '0802 907 3316'],
		['Zainab Bello', '0816 445 2290'],
		['Emeka Obi', '0703 289 6614'],
		['Funmi Lawal', '0809 731 5058'],
	];
	for (const slot of [...slots]) {
		if (slot.status !== 'open') continue;
		const hour = new Date(slot.start).getHours();
		const chance = hour >= 17 ? 0.35 : hour < 9 ? 0.12 : 0.08;
		if (rand() > chance) continue;
		const [name, phone] = players[Math.floor(rand() * players.length)];
		const walkIn = rand() < 0.3;
		book(
			[slot.id],
			walkIn
				? { type: 'walk_in', id: null, name, contactName: name, phone, email: null }
				: { type: 'player', id: `user-${name.split(' ')[0].toLowerCase()}`, name, contactName: name, phone, email: null },
			walkIn ? 'manual' : 'online',
			slot.price,
			{ note: walkIn ? 'Phoned in; pays at the gate.' : null, createdAt: new Date(slot.start - 2 * DAY).toISOString() }
		);
	}

	// A maintenance day at Ikeja, and an early cancellation.
	const maintenance = dayKey(addDays(new Date(), 10).getTime());
	slots = slots.map((s) =>
		s.locationId === 'loc-ikeja-main' && dayKey(s.start) === maintenance && s.status === 'open'
			? { ...s, status: 'blocked', blockReason: 'Turf maintenance' }
			: s
	);
})();

// Views

const fee = (booking: StoredBooking) => {
	if (booking.source !== 'online' || booking.cancelled) return 0;
	const org = organisations.find((o) => o.id === locationOf(booking.locationId)?.organisationId);
	if (!org || org.platformOwned) return 0;
	return Math.round((booking.amount * (org.feeRate ?? settings.defaultFeeRate)) / 100);
};

const locationOf = (locationId: string) => locations.find((l) => l.id === locationId);

const slotStatus = (slot: StoredSlot, now = Date.now()): SlotStatus => {
	if (slot.status !== 'booked') return slot.status;
	if (now >= slot.end) return 'completed';
	if (now >= slot.start) return 'in_progress';
	return 'booked';
};

const toSlotBooking = (booking: StoredBooking): SlotBooking => {
	return {
		id: booking.id,
		reference: booking.reference,
		bookedBy: booking.bookedBy,
		source: booking.source,
		amount: booking.amount,
		fee: fee(booking),
		game: booking.game,
		recurring: booking.recurring,
		note: booking.note,
		createdAt: booking.createdAt,
	};
};

const toSlot = (slot: StoredSlot): Slot => {
	const booking = slot.bookingId ? bookings.find((b) => b.id === slot.bookingId) : null;
	return {
		id: slot.id,
		locationId: slot.locationId,
		start: new Date(slot.start).toISOString(),
		end: new Date(slot.end).toISOString(),
		price: slot.price,
		status: slotStatus(slot),
		blockReason: slot.blockReason,
		booking: booking ? toSlotBooking(booking) : null,
	};
};

const bookingSpan = (booking: StoredBooking) => {
	const own = slots.filter((s) => booking.slotIds.includes(s.id));
	return {
		start: Math.min(...own.map((s) => s.start)),
		end: Math.max(...own.map((s) => s.end)),
	};
};

const bookingStatus = (booking: StoredBooking, now = Date.now()): VenueBookingStatus => {
	if (booking.cancelled) return 'cancelled';
	const { start, end } = bookingSpan(booking);
	if (now >= end) return 'completed';
	if (now >= start) return 'in_progress';
	return 'upcoming';
};

const toVenueBooking = (booking: StoredBooking): VenueBooking => {
	const location = locationOf(booking.locationId)!;
	const org = organisations.find((o) => o.id === location.organisationId)!;
	const place = places.find((p) => p.id === location.placeId);
	const { start, end } = bookingSpan(booking);
	const base = toSlotBooking(booking);
	return {
		...base,
		organisation: { id: org.id, name: org.name, platformOwned: org.platformOwned },
		location: { id: location.id, name: location.name, placeName: place?.name ?? null, sport: location.sport },
		start: new Date(start).toISOString(),
		end: new Date(end).toISOString(),
		slotsCount: booking.slotIds.length,
		status: bookingStatus(booking),
		venueShare: booking.source === 'online' && !booking.cancelled ? booking.amount - base.fee : 0,
	};
};

const searchable = (location: VenueLocation) => !!locationCoordinates(location, places);

const toOrganisation = (org: StoredOrg): VenueOrganisation => {
	const own = locations.filter((l) => l.organisationId === org.id);
	const ownIds = new Set(own.map((l) => l.id));
	const theirs = bookings.filter((b) => ownIds.has(b.locationId) && !b.cancelled);
	const online = theirs.filter((b) => b.source === 'online');
	return {
		...org,
		stats: {
			places: places.filter((p) => p.organisationId === org.id).length,
			locations: own.length,
			searchableLocations: own.filter(searchable).length,
			upcomingBookings: theirs.filter((b) => bookingStatus(b) === 'upcoming').length,
			gmv: online.reduce((sum, b) => sum + b.amount, 0),
			fees: online.reduce((sum, b) => sum + fee(b), 0),
		},
	};
};

const overview = (): VenueOverview => {
	const now = Date.now();
	const thisMonth = bookings.filter((b) => !b.cancelled && isSameMonth(bookingSpan(b).start, now));
	const online = thisMonth.filter((b) => b.source === 'online');
	const ownOrgIds = new Set(organisations.filter((o) => o.platformOwned).map((o) => o.id));
	const peak = slots.filter((s) => {
		const hour = new Date(s.start).getHours();
		return s.start >= now - 28 * DAY && s.end <= now && hour >= 17 && hour < 22 && (s.status === 'open' || s.status === 'booked');
	});
	return {
		venues: organisations.filter((o) => o.status === 'active').length,
		locations: locations.filter((l) => l.status === 'active').length,
		searchableLocations: locations.filter((l) => l.status === 'active' && searchable(l)).length,
		bookingsThisMonth: thisMonth.length,
		gmvThisMonth: online.reduce((sum, b) => sum + b.amount, 0),
		feesThisMonth: online.reduce((sum, b) => sum + fee(b), 0),
		ownVenueRevenueThisMonth: online
			.filter((b) => ownOrgIds.has(locationOf(b.locationId)?.organisationId ?? ''))
			.reduce((sum, b) => sum + b.amount, 0),
		peakUtilisation: peak.length ? peak.filter((s) => s.status === 'booked').length / peak.length : 0,
	};
};

const page = <T,>(rows: T[], params: Record<string, string>) => {
	const limit = Number(params.limit) || 20;
	const current = Number(params.page) || 1;
	const totalPages = Math.max(1, Math.ceil(rows.length / limit));
	return {
		data: rows.slice((current - 1) * limit, current * limit),
		pagination: {
			total: rows.length,
			totalPages,
			currentPage: current,
			perPage: limit,
			nextPage: current < totalPages ? current + 1 : null,
			prevPage: current > 1 ? current - 1 : null,
		},
	};
};

const has = (value: string | null | undefined, query: string | undefined) =>
	!query || (value ?? '').toLowerCase().includes(query.toLowerCase());

const dayStart = (date: string) => new Date(`${date}T00:00:00`).getTime();
const dayEnd = (date: string) => new Date(`${date}T23:59:59.999`).getTime();

// Clusters and areas

let clusters: Cluster[] = [
	{ id: 'cluster-lekki-ikoyi', name: 'Lekki / Ikoyi', centre: { lat: 6.445, lng: 3.455 }, radiusKm: 8, active: true },
	{ id: 'cluster-ikeja-opebi', name: 'Ikeja / Opebi', centre: { lat: 6.599, lng: 3.357 }, radiusKm: 6, active: true },
];

let areas: Area[] = [
	{ id: 'area-lekki', name: 'Lekki', centre: { lat: 6.4474, lng: 3.4723 } },
	{ id: 'area-ikoyi', name: 'Ikoyi', centre: { lat: 6.4541, lng: 3.4347 } },
	{ id: 'area-vi', name: 'Victoria Island', centre: { lat: 6.4281, lng: 3.4219 } },
	{ id: 'area-ikeja', name: 'Ikeja', centre: { lat: 6.6018, lng: 3.3515 } },
	{ id: 'area-opebi', name: 'Opebi', centre: { lat: 6.5966, lng: 3.36 } },
	{ id: 'area-yaba', name: 'Yaba', centre: { lat: 6.5095, lng: 3.3711 } },
];

if (VENUES_DEMO_EMPTY) {
	organisations = [];
	places = [];
	locations = [];
	slots = [];
	bookings = [];
	clusters = [];
	areas = [];
}

// Handlers

type Result = { data: unknown } | { error: FetchBaseQueryError };

const notFound = (): Result => ({ error: { status: 404, data: { message: 'Not found in demo data.' } } });
const bad = (message: string, status = 400): Result => ({ error: { status, data: { message } } });

const isFuture = (slot: StoredSlot) => slot.start > Date.now();

const slotAction = (input: SlotAction): Result => {
	const ids = new Set(input.ids);
	let updated = 0;
	let skipped = 0;

	if (input.action === 'cancel') {
		const bookingIds = new Set(
			slots.filter((s) => ids.has(s.id) && s.bookingId && s.status === 'booked').map((s) => s.bookingId!)
		);
		for (const bookingId of bookingIds) {
			const booking = bookings.find((b) => b.id === bookingId)!;
			if (bookingStatus(booking) !== 'upcoming') {
				skipped++;
				continue;
			}
			bookings = bookings.map((b) =>
				b.id === bookingId ? { ...b, cancelled: true, note: input.note?.trim() || b.note } : b
			);
			slots = slots.map((s) =>
				s.bookingId === bookingId
					? input.reopen
						? { ...s, status: 'open', bookingId: null }
						: { ...s, status: 'cancelled' }
					: s
			);
			updated++;
		}
		return { data: { updated, skipped } };
	}

	slots = slots.map((slot) => {
		if (!ids.has(slot.id)) return slot;
		const editable =
			isFuture(slot) &&
			(input.action === 'reopen' ? slot.status === 'blocked' || slot.status === 'cancelled' : slot.status === 'open');
		if (!editable) {
			skipped++;
			return slot;
		}
		updated++;
		if (input.action === 'reprice') return { ...slot, price: input.price };
		if (input.action === 'block') return { ...slot, status: 'blocked', blockReason: input.reason || null };
		return { ...slot, status: 'open', blockReason: null, bookingId: null };
	});
	return { data: { updated, skipped } };
};

const manualBooking = (input: ManualBookingInput): Result => {
	const chosen = slots.filter((s) => input.slotIds.includes(s.id)).sort((a, b) => a.start - b.start);
	if (chosen.length !== input.slotIds.length || chosen.length === 0) return bad('Some of those slots no longer exist.');
	if (new Set(chosen.map((s) => s.locationId)).size > 1) return bad('A booking covers one pitch or court.');
	if (chosen.some((s, i) => i > 0 && chosen[i - 1].end !== s.start)) return bad('Pick slots that follow each other.');
	if (chosen.some((s) => s.status !== 'open' || !isFuture(s))) return bad('Only open, upcoming slots can be booked.', 409);

	const weeks = Math.max(1, Math.min(52, Math.floor(input.weeks)));
	const groupId = weeks > 1 ? id('recurring') : null;
	const skippedWeeks: string[] = [];
	const made: string[][] = [];

	for (let week = 0; week < weeks; week++) {
		const shift = week * 7 * DAY;
		const matching = chosen.map((s) =>
			slots.find((o) => o.locationId === s.locationId && o.start === s.start + shift && o.end === s.end + shift)
		);
		if (matching.some((s) => !s || s.status !== 'open')) {
			skippedWeeks.push(format(chosen[0].start + shift, 'yyyy-MM-dd'));
			continue;
		}
		made.push(matching.map((s) => s!.id));
	}

	made.forEach((slotIds, index) =>
		book(slotIds, input.bookedBy, 'manual', input.amount, {
			note: input.note,
			recurring: groupId ? { groupId, index: index + 1, total: made.length } : null,
		})
	);
	return { data: { created: made.length, skippedWeeks } };
};

const handle = (method: string, path: string, params: Record<string, string>, body: unknown): Result => {
	const [, resource, itemId, action] = path.split('/').filter(Boolean); // ['venues', resource, id?, action?]

	if (resource === 'overview' && method === 'GET') return { data: overview() };

	if (resource === 'settings') {
		if (method === 'GET') return { data: settings };
		if (method === 'PUT') {
			const input = body as VenueSettings;
			if (!(input.defaultFeeRate >= 0 && input.defaultFeeRate <= 100)) return bad('The fee must be 0–100%.');
			settings = { ...input };
			return { data: settings };
		}
	}

	if (resource === 'organisations') {
		if (method === 'GET' && !itemId) {
			const rows = organisations
				.map(toOrganisation)
				.sort((a, b) => Number(b.platformOwned) - Number(a.platformOwned) || a.createdAt.localeCompare(b.createdAt));
			return { data: { data: rows } };
		}
		const input = body as VenueOrganisationInput;
		const ownersFor = (email: string | undefined, current: StoredOrg['owners']) => {
			const clean = email?.trim().toLowerCase();
			if (!clean || current.some((o) => o.email === clean)) return current;
			return [...current, { id: id('user'), name: clean.split('@')[0], email: clean }];
		};
		if (method === 'POST' && !itemId) {
			if (input.platformOwned && organisations.some((o) => o.platformOwned))
				return bad('TurfTriibe already has a venue organisation.', 409);
			const { ownerEmail, platformOwned, ...rest } = input;
			const org: StoredOrg = {
				...rest,
				id: id('org'),
				type: 'venue',
				platformOwned: !!platformOwned,
				owners: ownersFor(ownerEmail, []),
				createdAt: new Date().toISOString(),
			};
			organisations = [...organisations, org];
			return { data: toOrganisation(org) };
		}
		const existing = organisations.find((o) => o.id === itemId);
		if (!existing) return notFound();
		if (method === 'GET') return { data: toOrganisation(existing) };
		if (method === 'PUT') {
			// platformOwned is fixed at creation.
			const { ownerEmail, ...rest } = input;
			const org: StoredOrg = {
				...existing,
				...rest,
				platformOwned: existing.platformOwned,
				owners: ownersFor(ownerEmail, existing.owners),
			};
			organisations = organisations.map((o) => (o.id === org.id ? org : o));
			return { data: toOrganisation(org) };
		}
	}

	if (resource === 'places') {
		if (method === 'GET' && !itemId) {
			const rows = places.filter((p) => !params.organisationId || p.organisationId === params.organisationId);
			return { data: { data: rows } };
		}
		const input = body as PlaceInput;
		if (method === 'POST' && !itemId) {
			const place: Place = { ...input, id: id('place'), createdAt: new Date().toISOString() };
			places = [...places, place];
			return { data: place };
		}
		if (method === 'PUT' && itemId) {
			const existing = places.find((p) => p.id === itemId);
			if (!existing) return notFound();
			const place = { ...existing, ...input };
			places = places.map((p) => (p.id === itemId ? place : p));
			return { data: place };
		}
	}

	if (resource === 'locations') {
		if (method === 'GET' && !itemId) {
			const rows = locations.filter((l) => !params.organisationId || l.organisationId === params.organisationId);
			return { data: { data: rows } };
		}
		if (method === 'POST' && !itemId) {
			const location: VenueLocation = {
				...(body as LocationInput),
				id: id('loc'),
				scheduledUntil: null,
				createdAt: new Date().toISOString(),
			};
			locations = [...locations, location];
			return { data: location };
		}
		const existing = locations.find((l) => l.id === itemId);
		if (!existing) return notFound();
		if (method === 'PUT' && !action) {
			const location = { ...existing, ...(body as LocationInput) };
			locations = locations.map((l) => (l.id === itemId ? location : l));
			return { data: location };
		}
		if (method === 'POST' && action === 'schedule') {
			const input = body as ScheduleInput;
			if (timeOf(input.closeTime) - timeOf(input.openTime) < input.intervalMinutes)
				return bad('Closing time must leave room for at least one slot.');
			return { data: createSchedule(existing.id, input) };
		}
	}

	if (resource === 'slots') {
		if (method === 'GET' && !itemId) {
			const wanted = params.locationIds ? new Set(params.locationIds.split(',')) : null;
			const orgLocations = new Set(
				locations.filter((l) => !params.organisationId || l.organisationId === params.organisationId).map((l) => l.id)
			);
			const from = dayStart(params.from);
			const to = dayEnd(params.to);
			const rows = slots
				.filter(
					(s) =>
						orgLocations.has(s.locationId) && (!wanted || wanted.has(s.locationId)) && s.start >= from && s.start <= to
				)
				.sort((a, b) => a.start - b.start)
				.map(toSlot);
			return { data: { data: rows } };
		}
		if (method === 'PATCH' && !itemId) return slotAction(body as SlotAction);
		if (method === 'POST' && itemId === 'block-days') {
			const input = body as BlockDaysInput;
			const dates = new Set(input.dates);
			const locs = new Set(input.locationIds);
			const ids = slots
				.filter((s) => locs.has(s.locationId) && dates.has(dayKey(s.start)) && s.status === 'open')
				.map((s) => s.id);
			const result = slotAction({ action: 'block', ids, reason: input.reason });
			return result;
		}
	}

	if (resource === 'bookings') {
		if (method === 'GET' && !itemId) {
			const from = params.from ? dayStart(params.from) : -Infinity;
			const to = params.to ? dayEnd(params.to) : Infinity;
			const rows = bookings
				.map(toVenueBooking)
				.filter((b) => {
					const at = new Date(b.start).getTime();
					return (
						(!params.organisationId || b.organisation.id === params.organisationId) &&
						(!params.status || b.status === params.status) &&
						(!params.source || b.source === params.source) &&
						at >= from &&
						at <= to &&
						(has(b.reference, params.q) || has(b.bookedBy.name, params.q) || has(b.location.name, params.q))
					);
				})
				.sort((a, b) => b.start.localeCompare(a.start));
			const live = rows.filter((b) => b.status !== 'cancelled');
			const online = live.filter((b) => b.source === 'online');
			return {
				data: {
					...page(rows, params),
					summary: {
						count: live.length,
						gmv: online.reduce((sum, b) => sum + b.amount, 0),
						fees: online.reduce((sum, b) => sum + b.fee, 0),
						manualValue: live.filter((b) => b.source === 'manual').reduce((sum, b) => sum + b.amount, 0),
					},
				},
			};
		}
		if (method === 'POST' && !itemId) return manualBooking(body as ManualBookingInput);
	}

	if (resource === 'clusters') {
		if (method === 'GET' && !itemId) return { data: { data: clusters } };
		if (method === 'POST' && !itemId) {
			const cluster = { ...(body as ClusterInput), id: id('cluster') };
			clusters = [...clusters, cluster];
			return { data: cluster };
		}
		if (method === 'PUT' && itemId) {
			if (!clusters.some((c) => c.id === itemId)) return notFound();
			const cluster = { ...(body as ClusterInput), id: itemId };
			clusters = clusters.map((c) => (c.id === itemId ? cluster : c));
			return { data: cluster };
		}
	}

	if (resource === 'areas') {
		if (method === 'GET' && !itemId) {
			// Nearest-first from Lagos Island, like the player app's fallback list.
			const origin = { lat: 6.4541, lng: 3.3947 };
			return {
				data: { data: [...areas].sort((a, b) => haversineKm(origin, a.centre) - haversineKm(origin, b.centre)) },
			};
		}
		if (method === 'POST' && !itemId) {
			const area = { ...(body as AreaInput), id: id('area') };
			areas = [...areas, area];
			return { data: area };
		}
		if (method === 'PUT' && itemId) {
			if (!areas.some((a) => a.id === itemId)) return notFound();
			const area = { ...(body as AreaInput), id: itemId };
			areas = areas.map((a) => (a.id === itemId ? area : a));
			return { data: area };
		}
	}

	return notFound();
};

const isVenuesPath = (url: string) => url === '/venues' || url.startsWith('/venues/');

export const isVenuesDemoRequest = (args: string | FetchArgs) =>
	VENUES_DEMO && isVenuesPath(typeof args === 'string' ? args : args.url);

export const venuesDemoQuery = async (args: string | FetchArgs): Promise<Result> => {
	const { url, method = 'GET', params = {}, body } = typeof args === 'string' ? { url: args } : args;
	await new Promise((resolve) => setTimeout(resolve, 250));
	const result = handle(
		method.toUpperCase(),
		url.split('?')[0],
		Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
		body
	);
	return 'data' in result ? { data: structuredClone(result.data) } : result;
};
