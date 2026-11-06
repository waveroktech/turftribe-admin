// Venues v1. Shapes follow the "Venues" section of
// docs/admin-backend-contract.md. A venue is an organisation (type 'venue')
// that owns Places; each Place holds bookable Locations, and each Location has
// its own schedule of priced Slots. TurfTriibe itself is the first venue
// owner (`platformOwned`), run from the backoffice.

import type { AdminListParams, AdminPage } from '@/features/admin/types';

export type LatLng = { lat: number; lng: number };

export type VenueSport = 'football' | 'padel' | 'tennis' | 'basketball' | 'multi_use';

// Fees

/** TurfTriibe's cut of each online venue booking, as a percentage (e.g. 10). */
export type VenueSettings = {
	defaultFeeRate: number;
};

// Organisations

export type VenueOrgStatus = 'active' | 'inactive';

export type VenuePayout = {
	bankName: string;
	accountNumber: string;
	accountName: string;
	/** Paystack subaccount the venue's share settles to. null blocks online booking. */
	paystackSubaccountCode: string | null;
};

export type VenueOrganisation = {
	id: string;
	type: 'venue';
	/** Business name shown to players and communities. */
	name: string;
	/** TurfTriibe's own venues: every booking's full amount stays with TurfTriibe. */
	platformOwned: boolean;
	address: string;
	contact: { name: string; email: string; phone: string };
	sports: VenueSport[];
	payout: VenuePayout | null;
	/** Per-venue override of `VenueSettings.defaultFeeRate`. null = the default. */
	feeRate: number | null;
	status: VenueOrgStatus;
	/** Users who can switch into this organisation. Superadmins act for platform-owned venues. */
	owners: { id: string; name: string; email: string }[];
	stats: {
		places: number;
		locations: number;
		/** Locations with coordinates (their own or their place's), so discovery can find them. */
		searchableLocations: number;
		upcomingBookings: number;
		/** Online bookings, all time, in naira. */
		gmv: number;
		/** TurfTriibe's fee on `gmv`, in naira. */
		fees: number;
	};
	createdAt: string;
};

export type VenueOrganisationInput = Pick<
	VenueOrganisation,
	'name' | 'address' | 'contact' | 'sports' | 'payout' | 'feeRate' | 'status'
> & {
	/** Adds this user as an owner, inviting them if they have no account yet. */
	ownerEmail?: string;
	/** Only the seed for TurfTriibe's own organisation sets this. */
	platformOwned?: boolean;
};

// Places and Locations

export type Place = {
	id: string;
	organisationId: string;
	name: string;
	/** Free text, shown to players; no address hierarchy. */
	address: string;
	coordinates: LatLng | null;
	photos: string[];
	amenities: string[];
	createdAt: string;
};

export type PlaceInput = Omit<Place, 'id' | 'createdAt'>;

export type LocationStatus = 'active' | 'inactive';

export type VenueLocation = {
	id: string;
	organisationId: string;
	/** null for a standalone Location. */
	placeId: string | null;
	name: string;
	sport: VenueSport;
	/** Max people on the pitch or court at once. */
	capacity: number;
	/** Naira per hour; the schedule generator's default. */
	basePrice: number;
	/** Overrides the place's coordinates. Searchable only if this or the place has some. */
	coordinates: LatLng | null;
	status: LocationStatus;
	/** Last slot generated so far, ISO; null before any schedule exists. */
	scheduledUntil: string | null;
	createdAt: string;
};

export type LocationInput = Omit<VenueLocation, 'id' | 'scheduledUntil' | 'createdAt'>;

// Schedule and slots

export type ScheduleInput = {
	/** yyyy-MM-dd, inclusive, Africa/Lagos. */
	from: string;
	to: string;
	/** 0 = Sunday … 6 = Saturday. */
	days: number[];
	/** HH:mm. The last slot ends at or before `closeTime`. */
	openTime: string;
	closeTime: string;
	intervalMinutes: number;
	/** Naira per slot. */
	price: number;
	/** Optional higher price for evenings and/or weekends. */
	peak: { price: number; eveningFrom: string | null; weekends: boolean } | null;
};

/** Existing slots that overlap are kept, so generating twice never doubles up. */
export type ScheduleResult = { created: number; skipped: number };

/** What's stored. `in_progress` and `completed` are derived from the clock for booked slots. */
export type StoredSlotStatus = 'open' | 'booked' | 'blocked' | 'cancelled';

export type SlotStatus = StoredSlotStatus | 'in_progress' | 'completed';

export type BookerType = 'community' | 'player' | 'walk_in';

export type SlotBooking = {
	id: string;
	reference: string;
	bookedBy: {
		type: BookerType;
		/** Community or user id; null for a walk-in. */
		id: string | null;
		name: string;
		contactName: string;
		phone: string;
		email: string | null;
	};
	source: 'online' | 'manual';
	/** For the whole booking (all its slots), in naira. Manual bookings are paid to the venue directly. */
	amount: number;
	fee: number;
	game: { id: string; title: string } | null;
	/** Set on weekly repeats: this is booking `index` of `total`. */
	recurring: { groupId: string; index: number; total: number } | null;
	note: string | null;
	createdAt: string;
};

export type Slot = {
	id: string;
	locationId: string;
	start: string;
	end: string;
	price: number;
	status: SlotStatus;
	blockReason: string | null;
	booking: SlotBooking | null;
};

export type SlotsParams = {
	organisationId?: string;
	locationIds?: string;
	/** yyyy-MM-dd, inclusive. */
	from: string;
	to: string;
};

export type SlotAction =
	| { action: 'reprice'; ids: string[]; price: number }
	| { action: 'block'; ids: string[]; reason: string }
	/** Puts blocked slots, and cancelled ones kept off sale, back on sale. */
	| { action: 'reopen'; ids: string[] }
	/** Cancels the booking on these slots and refunds online payments. `reopen` puts the slots back on sale. */
	| { action: 'cancel'; ids: string[]; reopen: boolean; note?: string };

export type BlockDaysInput = { locationIds: string[]; dates: string[]; reason: string };

export type SlotActionResult = { updated: number; skipped: number };

export type ManualBookingInput = {
	/** Consecutive open slots on one Location. */
	slotIds: string[];
	bookedBy: { type: BookerType; id: string | null; name: string; contactName: string; phone: string; email: string | null };
	amount: number;
	note: string | null;
	/** Repeat at the same time for this many weeks in total (1 = no repeat). */
	weeks: number;
};

export type ManualBookingResult = { created: number; skippedWeeks: string[] };

// Bookings

export type VenueBookingStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

export type VenueBooking = SlotBooking & {
	organisation: { id: string; name: string; platformOwned: boolean };
	location: { id: string; name: string; placeName: string | null; sport: VenueSport };
	start: string;
	end: string;
	slotsCount: number;
	status: VenueBookingStatus;
	/** What settles to the venue (online bookings). */
	venueShare: number;
};

export type VenueBookingsParams = AdminListParams & {
	organisationId?: string;
	status?: VenueBookingStatus;
	source?: 'online' | 'manual';
	from?: string;
	to?: string;
};

export type VenueBookingsSummary = {
	count: number;
	/** Online, not cancelled. */
	gmv: number;
	fees: number;
	/** Value of manual bookings, paid at the venue. */
	manualValue: number;
};

export type VenueBookingsPage = AdminPage<VenueBooking> & { summary: VenueBookingsSummary };

export type VenueOverview = {
	venues: number;
	locations: number;
	searchableLocations: number;
	bookingsThisMonth: number;
	gmvThisMonth: number;
	feesThisMonth: number;
	/** Online bookings at TurfTriibe's own venues this month: all of it is revenue. */
	ownVenueRevenueThisMonth: number;
	/** Booked ÷ open-or-booked slots, 17:00–22:00, last 28 days, 0–1. */
	peakUtilisation: number;
};

// Discovery

/** Launch area. Discovery is limited to active clusters. */
export type Cluster = {
	id: string;
	name: string;
	centre: LatLng;
	radiusKm: number;
	active: boolean;
};

export type ClusterInput = Omit<Cluster, 'id'>;

/** Fallback for users who don't share their location: a named centre point. */
export type Area = {
	id: string;
	name: string;
	centre: LatLng;
};

export type AreaInput = Omit<Area, 'id'>;
