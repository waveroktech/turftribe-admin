export type PaymentCollectionParams = {
	id?: string;
	paymentReference?: string;
	from?: string;
	to?: string;
	status?: string;
};

export type Booking = {
	_id: string;
	email: string;
	firstName: string;
	lastName: string;
	amount: string;
	paymentReference: string;
	displayName: string;
	paymentType: string;
	bookingCode: string;
	paymentDate: string;
	transactionStatus: string;
	gameId?: string;
	removedAt?: string | null;
};

export type BookingsData = {
	data: Booking[];
	pagination: Pagination;
};

export type CommisionHistory = {
	amount: number;
	paymentReference: string;
	bookingId: string;
	bookingCode: string;
	firstName: string;
	lastName: string;
	processor: string;
	status: string;
	narration: string;
	paymentDate: string;
	transactionId: string;
	accountNumber: string;
	payoutRecipientName: string;
	channel: string;
	amountReceived: number;
	amountPaid: number;
	commission: number;
};

export type CommisionHistoryData = {
	data: {
		data: CommisionHistory[];
		extraData: Pagination;
	};
};

export type PayoutHistory = {
	matchDate: string;
	payoutStatus: string;
	payoutReference: string;
	matchStatus: string;
	payoutAmount: number;
	payoutDate: string | null;
	matchId: string;
	communityId: string;
	gameId: string;
	canRequest?: boolean;
};

export type PayoutBreakdownItem = {
	_id: string;
	firstName?: string;
	lastName?: string;
	displayName?: string;
	paymentType?: string;
	actualAmount?: number;
	amountPaid?: number;
	platformFee?: number;
	ownerFee?: number;
};

export type PayoutHistoryData = {
	status: string;
	data: PayoutHistory[];
	message: string;
	code: string;
	pagination: any;
};

// Raw attendee fields the ledger asks /communities/:id/bookings for (via select).
export type LedgerBookingRecord = {
	_id: string;
	firstName?: string;
	lastName?: string;
	displayName?: string;
	email?: string;
	paymentReference?: string;
	passCode?: string;
	paymentType?: string;
	actualAmount?: number;
	amountPaid?: number;
	platformFee?: number;
	ownerFee?: number;
	matchId?: string;
	removedFromMatchId?: string;
	createdAt: string;
	removedAt?: string | null;
	matchInfo?: { gameId?: string };
};

export type LedgerBooking = {
	id: string;
	name: string;
	username: string;
	email: string;
	reference: string;
	bookingCode: string;
	paymentType: string;
	isManual: boolean;
	// Game fee before the platform commission.
	amount: number;
	// What the player paid through TurfTribe (0 for manual, paid offline).
	totalPaid: number;
	commission: number;
	matchId: string;
	gameId: string;
	bookingDate: string;
	matchDate: string | null;
	removedAt: string | null;
};

export type PayoutState = 'ready' | 'processing' | 'paid' | 'upcoming';

export type LedgerGame = PayoutHistory & {
	state: PayoutState;
};

// GET /communities/:id/bookings/summary
export type BookingsSummary = {
	bookings: number;
	onlineBookings: number;
	manualBookings: number;
	// Game fees before commission.
	amount: number;
	// Paid through TurfTribe (manual bookings excluded).
	collected: number;
	commission: number;
	ownerFee: number;
	games: number;
};

// GET /v2/payments/game-payouts/summary
export type GamePayoutsSummary = Record<PayoutState | 'total', { games: number; amount: number }>;
