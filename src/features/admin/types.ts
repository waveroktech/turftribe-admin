// Platform backoffice. Shapes follow docs/admin-backend-contract.md; every
// endpoint lives under /admin and is restricted to user.role admin/superadmin.

export type AdminPagination = {
	total: number;
	totalPages: number;
	currentPage: number;
	perPage: number;
	nextPage: number | null;
	prevPage: number | null;
};

export type AdminPage<T> = {
	data: T[];
	pagination: AdminPagination;
};

export type AdminListParams = {
	page?: number;
	limit?: number;
	search?: string;
};

// Dashboard

export type AdminTrendPoint = {
	/** First day of the month, ISO date. */
	period: string;
	processed: number;
	revenue: number;
	newUsers: number;
};

export type AdminTopCommunity = {
	id: string;
	name: string;
	category: string;
	processed: number;
	revenue: number;
};

export type AdminOverview = {
	totalUsers: number;
	newUsersThisMonth: number;
	totalCommunities: number;
	activeCommunities: number;
	/** Gross amount paid by players through the platform, in naira. */
	totalProcessed: number;
	/** Platform fees kept by TurfTribe, in naira. */
	totalRevenue: number;
	totalTransactions: number;
	totalPaidOut: number;
	/** Last 12 months, oldest first. */
	trend: AdminTrendPoint[];
	topCommunities: AdminTopCommunity[];
};

// Communities

export type CommunityStatus = 'active' | 'inactive';

// Checkout (PaymentServiceV2.splitCommission) charges `platformFee` as a flat
// naira amount per booking. The commission row's feeType/maxCap/
// affectsManualBooking fields are stored but never read, so they're left out.
export type CommunityCommission = {
	/** Naira TurfTribe keeps from each booking (per head). */
	platformFee: number;
};

export type AdminCommunity = {
	id: string;
	name: string;
	category: string;
	visibility: 'public' | 'private' | 'hybrid';
	status: CommunityStatus;
	membersCount: number;
	manager: { id: string; name: string; email: string } | null;
	/** null only for legacy communities with no commission row; their bookings fail at checkout. */
	commission: CommunityCommission | null;
	processed: number;
	createdAt: string;
};

export type AdminCommunitiesParams = AdminListParams & {
	status?: CommunityStatus;
	category?: string;
};

// Users (CRM)

export type AdminUserType = 'member' | 'manager' | 'staff';

export type AdminUser = {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string | null;
	profileImageUrl: string | null;
	currentUserType: AdminUserType;
	role: string | null;
	locked: boolean;
	communitiesCount: number;
	totalSpent: number;
	createdAt: string;
	lastActiveAt: string | null;
};

export type AdminUserDetail = AdminUser & {
	country: string | null;
	gender: string | null;
	sports: string[];
	communities: { id: string; name: string; role: 'member' | 'manager' | 'staff'; joinedAt: string | null }[];
	recentPayments: AdminPayment[];
};

export type AdminUsersParams = AdminListParams & {
	userType?: AdminUserType;
};

// Payments

export type PaymentType = 'booking' | 'membership' | 'subscription';

export type PaymentStatus = 'success' | 'pending' | 'failed' | 'refunded';

export type AdminPayment = {
	id: string;
	reference: string;
	type: PaymentType;
	status: PaymentStatus;
	channel: string | null;
	/** What the player paid, in naira. */
	amount: number;
	platformFee: number;
	ownerFee: number;
	user: { id: string; name: string; email: string } | null;
	community: { id: string; name: string } | null;
	match: { id: string; title: string; date: string } | null;
	createdAt: string;
};

export type AdminPaymentsParams = AdminListParams & {
	type?: PaymentType;
	status?: PaymentStatus;
	communityId?: string;
	from?: string;
	to?: string;
};

export type AdminPaymentsSummary = {
	count: number;
	amount: number;
	platformFee: number;
};

export type AdminPaymentsPage = AdminPage<AdminPayment> & {
	summary: AdminPaymentsSummary;
};

// Sports

export type SportFormat = {
	name: string;
	/** null for individual formats (a 5K run, tennis singles is 1). */
	playersPerSide: number | null;
	durationMinutes: number | null;
};

export type SportStat = {
	key: string;
	label: string;
	short: string;
	unit?: string | null;
	/** Shown on player cards and leaderboards; at most three per sport. */
	headline: boolean;
};

export type SportPosition = {
	name: string;
	code: string;
};

export type AdminSport = {
	id: string;
	/** Stable slug stored on communities as `category`, e.g. 'football'. */
	key: string;
	name: string;
	isActive: boolean;
	formats: SportFormat[];
	stats: SportStat[];
	positions: SportPosition[];
	communitiesCount: number;
};

export type SportInput = Omit<AdminSport, 'id' | 'communitiesCount'>;
