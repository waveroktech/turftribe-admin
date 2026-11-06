// Merchandise v1. Shapes follow the "Merchandise" section of
// docs/admin-backend-contract.md. Every product, variant and order carries a
// vendor, and the backend scopes each list by the caller: platform admins see
// every vendor, and a vendor user (v1.5) will see only their own.

import type { AdminListParams, AdminPage } from '@/features/admin/types';

// Vendors

export type VendorStatus = 'active' | 'inactive';

export type Vendor = {
	id: string;
	name: string;
	contactEmail: string;
	/** Default share TurfTribe keeps from each sale, as a percentage (e.g. 15). */
	commissionRate: number;
	/** Paystack subaccount the vendor's share settles to. null blocks checkout. */
	paystackSubaccountCode: string | null;
	status: VendorStatus;
	productsCount: number;
	/** Paid orders, all time, in naira. */
	gmv: number;
	/** TurfTribe's share of `gmv`, in naira. */
	commission: number;
	createdAt: string;
};

export type VendorInput = Pick<
	Vendor,
	'name' | 'contactEmail' | 'commissionRate' | 'paystackSubaccountCode' | 'status'
>;

// Catalogue

/** What an admin sets. `sold_out` is derived when every variant hits 0. */
export type ProductStatus = 'draft' | 'live' | 'hidden' | 'sold_out' | 'archived';

export type EditableProductStatus = Extract<ProductStatus, 'draft' | 'live' | 'hidden'>;

export type MerchCategory = 'jerseys' | 'shorts' | 'socks' | 'training_tops' | 'accessories';

/** The promo slots in the player app a product may appear in. */
export type PlacementKey = 'game_confirmation' | 'game_details' | 'player_home' | 'venue_booking';

export type ProductVariant = {
	/** Absent on a variant that hasn't been saved yet. */
	id?: string;
	size: string;
	colour: string;
	/** The vendor's own code, so orders map to their stock. */
	sku: string;
	/** Selling price shown to the player, in naira. */
	price: number;
	/** Stock the vendor allocates to TurfTribe. Decrements on paid orders. */
	quantity: number;
	/** Held by unpaid checkouts; read-only. */
	reserved?: number;
	/** Notify admins when quantity drops below this. null = no alert. */
	lowStockThreshold: number | null;
};

export type Product = {
	id: string;
	vendor: { id: string; name: string };
	name: string;
	description: string;
	category: MerchCategory;
	/** 1–5 image URLs; the first is the cover. */
	images: string[];
	/** Sport keys (see /sports); drive which games the product is promoted on. */
	sportTags: string[];
	status: ProductStatus;
	placements: PlacementKey[];
	deliveryPromise: string;
	/** Per-product override of the vendor's commission rate. null = vendor default. */
	commissionRate: number | null;
	variants: ProductVariant[];
	/** Units sold, all time. */
	sold: number;
	createdAt: string;
	updatedAt: string;
};

export type ProductInput = Omit<Product, 'id' | 'vendor' | 'status' | 'sold' | 'createdAt' | 'updatedAt'> & {
	vendorId: string;
	status: EditableProductStatus;
};

export type ProductsParams = AdminListParams & {
	vendorId?: string;
	status?: ProductStatus;
	category?: MerchCategory;
};

// Bulk stock and price table: one row per variant across products.
export type VariantRow = Required<Pick<ProductVariant, 'id'>> &
	Omit<ProductVariant, 'id'> & {
		product: { id: string; name: string; status: ProductStatus };
		vendor: { id: string; name: string };
	};

export type VariantUpdate = { id: string; price?: number; quantity?: number };

export type VariantsParams = { vendorId?: string; q?: string };

// Audit log: who changed what on a product or its variants, and when.
export type AuditEntry = {
	id: string;
	actor: { id: string; name: string; vendorId: string | null };
	/** e.g. 'price', 'quantity', 'status', 'created', 'duplicated', 'archived'. */
	field: string;
	/** The variant's SKU for variant-level changes. */
	sku: string | null;
	from: string | number | null;
	to: string | number | null;
	createdAt: string;
};

// Placements

export type Placement = {
	key: PlacementKey;
	/** Off hides the slot in the player app for every product. */
	enabled: boolean;
};

// Orders

export type OrderStatus = 'awaiting_confirmation' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';

export type OrderItem = {
	productId: string;
	variantId: string;
	name: string;
	sku: string;
	size: string;
	colour: string;
	quantity: number;
	unitPrice: number;
};

export type MerchOrder = {
	id: string;
	/** Paystack reference. */
	reference: string;
	vendor: { id: string; name: string };
	buyer: { id: string; name: string; email: string; phone: string };
	items: OrderItem[];
	subtotal: number;
	deliveryFee: number;
	total: number;
	/** TurfTribe's split. */
	commission: number;
	/** Settles to the vendor's Paystack subaccount. */
	vendorShare: number;
	status: OrderStatus;
	deliveryAddress: string;
	/** Unconfirmed orders are cancelled and refunded automatically after this. */
	confirmBy: string;
	history: { status: OrderStatus; at: string; by: string | null; note: string | null }[];
	createdAt: string;
};

export type OrdersParams = AdminListParams & {
	vendorId?: string;
	status?: OrderStatus;
	from?: string;
	to?: string;
};

export type OrdersSummary = {
	/** Paid orders matching the filters (cancelled ones excluded from amounts). */
	count: number;
	gmv: number;
	commission: number;
};

export type OrdersPage = AdminPage<MerchOrder> & { summary: OrdersSummary };
