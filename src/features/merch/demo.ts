import type { FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type {
	AuditEntry,
	MerchOrder,
	OrderStatus,
	Placement,
	Product,
	ProductInput,
	ProductStatus,
	ProductVariant,
	VariantRow,
	VariantUpdate,
	Vendor,
	VendorInput,
} from './types';

/*
 * Demo merchandise data, served in place of the /merch/* endpoints until the
 * backend ships. On by default in development and off in production builds;
 * NEXT_PUBLIC_MERCH_DEMO=true|false overrides either way. The store lives in
 * memory, so edits last until the page reloads.
 */
export const MERCH_DEMO =
	process.env.NEXT_PUBLIC_MERCH_DEMO === 'true' ||
	(process.env.NEXT_PUBLIC_MERCH_DEMO !== 'false' && process.env.NODE_ENV === 'development');

const ACTOR = { id: 'demo-admin', name: 'Demo admin', vendorId: null };
const DAY = 24 * 60 * 60 * 1000;
const CONFIRM_WINDOW_HOURS = 24;

// Deterministic so the demo looks the same on every load.
const seeded = (seed: number) => () => {
	seed = (seed * 16807) % 2147483647;
	return (seed - 1) / 2147483646;
};

const image = (label: string, bg: string) =>
	`https://placehold.co/600x600/${bg}/ffffff/png?text=${encodeURIComponent(label)}`;

// Vendors

const SMILEYS_ID = 'vendor-smileys';

let vendors: Omit<Vendor, 'productsCount' | 'gmv' | 'commission'>[] = [
	{
		id: SMILEYS_ID,
		name: 'Smileys',
		contactEmail: 'orders@smileys.ng',
		commissionRate: 15,
		paystackSubaccountCode: 'ACCT_smileys8x2k',
		status: 'active',
		createdAt: new Date(Date.now() - 45 * DAY).toISOString(),
	},
];

// Catalogue

type StoredProduct = Omit<Product, 'status' | 'vendor' | 'sold'> & {
	vendorId: string;
	status: Exclude<ProductStatus, 'sold_out'>;
};

const variantsFor = (
	productId: string,
	skuStem: string,
	sizes: string[],
	colours: [string, string][],
	price: number,
	stock: number[][],
	lowStockThreshold: number | null = 3
): ProductVariant[] =>
	colours.flatMap(([colour, code], c) =>
		sizes.map((size, s) => ({
			id: `${productId}-${code}-${size}`.toLowerCase().replace(/\s+/g, ''),
			size,
			colour,
			sku: `SMY-${skuStem}-${code}-${size.replace(/\s+/g, '').toUpperCase()}`,
			price,
			quantity: stock[c]?.[s] ?? 0,
			reserved: 0,
			lowStockThreshold,
		}))
	);

const created = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY).toISOString();

const product = (
	p: Omit<StoredProduct, 'vendorId' | 'createdAt' | 'updatedAt' | 'commissionRate'> & {
		commissionRate?: number | null;
		daysAgo: number;
	}
): StoredProduct => {
	const { daysAgo, ...rest } = p;
	return {
		commissionRate: null,
		...rest,
		vendorId: SMILEYS_ID,
		createdAt: created(daysAgo),
		updatedAt: created(Math.max(0, daysAgo - 3)),
	};
};

const LAGOS = '2–4 working days, Lagos only';

let products: StoredProduct[] = [
	product({
		id: 'prod-jersey',
		name: 'Smileys Pro Training Jersey',
		description: 'Lightweight, quick-dry polyester mesh. Regular fit with a ribbed crew neck.',
		category: 'jerseys',
		images: [image('Pro Jersey', '111111'), image('Pro Jersey - back', '333333')],
		sportTags: ['football'],
		status: 'live',
		placements: ['game_confirmation', 'game_details', 'player_home'],
		deliveryPromise: LAGOS,
		variants: variantsFor('prod-jersey', 'JRS', ['S', 'M', 'L', 'XL'], [['Black', 'BLK'], ['White', 'WHT']], 18500, [
			[6, 14, 11, 2],
			[4, 9, 0, 3],
		]),
		daysAgo: 40,
	}),
	product({
		id: 'prod-shorts',
		name: 'Smileys Match Shorts',
		description: 'Stretch-woven shorts with an elastic drawcord waist. 7" inseam, athletic fit.',
		category: 'shorts',
		images: [image('Match Shorts', '1f2a44')],
		sportTags: ['football', 'basketball'],
		status: 'live',
		placements: ['game_details', 'player_home'],
		deliveryPromise: LAGOS,
		variants: variantsFor('prod-shorts', 'SHT', ['S', 'M', 'L', 'XL'], [['Black', 'BLK'], ['Navy', 'NVY']], 12000, [
			[8, 12, 10, 5],
			[3, 7, 6, 1],
		]),
		daysAgo: 38,
	}),
	product({
		id: 'prod-socks',
		name: 'Smileys Grip Socks',
		description: 'Anti-slip grip pads, cushioned sole and arch support. Mid-calf.',
		category: 'socks',
		images: [image('Grip Socks', '2e7d32')],
		sportTags: ['football', 'padel', 'basketball'],
		status: 'live',
		placements: ['game_confirmation', 'player_home'],
		deliveryPromise: LAGOS,
		variants: variantsFor('prod-socks', 'SCK', ['One size'], [['White', 'WHT'], ['Black', 'BLK']], 5500, [[30], [22]], 8),
		daysAgo: 38,
	}),
	product({
		id: 'prod-quarterzip',
		name: 'Smileys Quarter-Zip Training Top',
		description: 'Brushed-back fleece for cool evenings. Slim fit, thumb loops.',
		category: 'training_tops',
		images: [image('Quarter-Zip', '424242')],
		sportTags: ['football', 'running'],
		status: 'live',
		placements: ['player_home'],
		deliveryPromise: LAGOS,
		commissionRate: 12,
		variants: variantsFor('prod-quarterzip', 'QZT', ['S', 'M', 'L', 'XL'], [['Charcoal', 'CHR']], 26000, [[2, 5, 4, 1]]),
		daysAgo: 30,
	}),
	product({
		id: 'prod-padel-polo',
		name: 'Smileys Padel Polo',
		description: 'Breathable piqué knit with UV protection. Relaxed fit.',
		category: 'training_tops',
		images: [image('Padel Polo', '0277bd')],
		sportTags: ['padel', 'tennis'],
		status: 'live',
		placements: ['venue_booking', 'game_details'],
		deliveryPromise: LAGOS,
		variants: variantsFor('prod-padel-polo', 'PLO', ['S', 'M', 'L'], [['White', 'WHT'], ['Sky', 'SKY']], 16000, [
			[0, 0, 0],
			[0, 0, 0],
		]),
		daysAgo: 25,
	}),
	product({
		id: 'prod-tank',
		name: 'Smileys Gym Tank',
		description: 'Dropped armholes and a longline cut. Cotton-modal blend.',
		category: 'training_tops',
		images: [image('Gym Tank', '6a1b9a')],
		sportTags: ['gym'],
		status: 'hidden',
		placements: [],
		deliveryPromise: LAGOS,
		variants: variantsFor('prod-tank', 'TNK', ['M', 'L', 'XL'], [['Grey', 'GRY']], 11500, [[4, 6, 3]]),
		daysAgo: 20,
	}),
	product({
		id: 'prod-duffel',
		name: 'Smileys Kit Duffel',
		description: '40L water-resistant duffel with a ventilated boot pocket.',
		category: 'accessories',
		images: [image('Kit Duffel', '212121')],
		sportTags: ['football', 'gym', 'padel'],
		status: 'live',
		placements: ['player_home'],
		deliveryPromise: '3–5 working days, Lagos only',
		variants: variantsFor('prod-duffel', 'DFL', ['One size'], [['Black', 'BLK']], 22000, [[7]], 2),
		daysAgo: 18,
	}),
	product({
		id: 'prod-headband',
		name: 'Smileys Sweat Headband (2-pack)',
		description: 'Terry-lined stretch headbands.',
		category: 'accessories',
		images: [image('Headbands', 'ef6c00')],
		sportTags: ['padel', 'tennis', 'gym'],
		status: 'draft',
		placements: [],
		deliveryPromise: LAGOS,
		variants: variantsFor('prod-headband', 'HBD', ['One size'], [['Mixed', 'MIX']], 4000, [[40]], null),
		daysAgo: 2,
	}),
];

let placements: Placement[] = [
	{ key: 'game_confirmation', enabled: true },
	{ key: 'game_details', enabled: true },
	{ key: 'player_home', enabled: true },
	{ key: 'venue_booking', enabled: false },
];

let audit: (AuditEntry & { productId: string })[] = [];
let nextId = 1;
const id = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${nextId++}`;

const log = (productId: string, field: string, from: AuditEntry['from'], to: AuditEntry['to'], sku: string | null = null) =>
	audit.unshift({ id: id('audit'), productId, actor: ACTOR, field, sku, from, to, createdAt: new Date().toISOString() });

// A little history so the History tab isn't empty.
log('prod-jersey', 'price', 17000, 18500, 'SMY-JRS-BLK-M');
log('prod-jersey', 'quantity', 10, 14, 'SMY-JRS-BLK-M');
log('prod-tank', 'status', 'live', 'hidden');

// Orders

const BUYERS = [
	['Tolu Adeyemi', '0803 214 5567', '12 Admiralty Way, Lekki Phase 1, Lagos'],
	['Chidi Okafor', '0812 330 9821', '4 Ribadu Road, Ikoyi, Lagos'],
	['Amaka Eze', '0706 554 1209', '27 Adeola Odeku Street, Victoria Island, Lagos'],
	['Seun Bakare', '0905 118 7743', '9 Allen Avenue, Ikeja, Lagos'],
	['Ifeoma Nwosu', '0813 662 0475', '15 Bode Thomas Street, Surulere, Lagos'],
	['Kunle Ajayi', '0802 907 3316', '3 Fola Osibo Road, Lekki Phase 1, Lagos'],
	['Zainab Bello', '0816 445 2290', '21 Isaac John Street, GRA Ikeja, Lagos'],
	['Emeka Obi', '0703 289 6614', '8 Herbert Macaulay Way, Yaba, Lagos'],
	['Funmi Lawal', '0809 731 5058', '6 Chevron Drive, Lekki, Lagos'],
	['David Mensah', '0814 520 8837', '40 Awolowo Road, Ikoyi, Lagos'],
] as const;

const DELIVERY_FEE = 2500;

const buildOrders = (): MerchOrder[] => {
	const rand = seeded(42);
	const pick = <T,>(list: readonly T[]) => list[Math.floor(rand() * list.length)];
	const sellable = products.filter((p) => p.status !== 'draft');
	const result: MerchOrder[] = [];

	// Most recent first: a few awaiting confirmation, then older ones further along.
	for (let i = 0; i < 26; i++) {
		const hoursAgo = i < 3 ? 2 + i * 5 : i < 6 ? 30 + i * 10 : 24 * (3 + i * 2.2);
		const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
		const status: OrderStatus =
			i < 3
				? 'awaiting_confirmation'
				: i < 6
					? 'confirmed'
					: i < 9
						? 'dispatched'
						: i % 7 === 0
							? 'cancelled'
							: 'delivered';

		const lines = rand() < 0.3 ? 2 : 1;
		const items = Array.from({ length: lines }, () => {
			const prod = pick(sellable);
			const variant = pick(prod.variants);
			return {
				productId: prod.id,
				variantId: variant.id!,
				name: prod.name,
				sku: variant.sku,
				size: variant.size,
				colour: variant.colour,
				quantity: rand() < 0.2 ? 2 : 1,
				unitPrice: variant.price,
			};
		});
		const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
		const rate = products.find((p) => p.id === items[0].productId)?.commissionRate ?? 15;
		const commission = Math.round((subtotal * rate) / 100);
		const total = subtotal + DELIVERY_FEE;
		const [name, phone, address] = pick(BUYERS);

		const at = (offsetHours: number) => new Date(createdAt.getTime() + offsetHours * 60 * 60 * 1000).toISOString();
		const history: MerchOrder['history'] = [{ status: 'awaiting_confirmation', at: createdAt.toISOString(), by: null, note: null }];
		const steps: OrderStatus[] =
			status === 'cancelled' ? ['cancelled'] : (['confirmed', 'dispatched', 'delivered'] as OrderStatus[]).slice(
				0,
				['awaiting_confirmation', 'confirmed', 'dispatched', 'delivered'].indexOf(status)
			);
		steps.forEach((step, n) =>
			history.push({
				status: step,
				at: at(3 + n * 20),
				by: step === 'cancelled' ? 'System' : 'Demo admin',
				note:
					step === 'cancelled'
						? 'Not confirmed by Smileys in time. Refunded automatically.'
						: step === 'dispatched'
							? 'Rider: Gokada, ETA same day'
							: null,
			})
		);

		result.push({
			id: `order-${i + 1}`,
			reference: `TT-MRC-${(48210 - i * 37).toString()}`,
			vendor: { id: SMILEYS_ID, name: 'Smileys' },
			buyer: { id: `user-${i % BUYERS.length}`, name, email: `${name.split(' ')[0].toLowerCase()}@example.com`, phone },
			items,
			subtotal,
			deliveryFee: DELIVERY_FEE,
			total,
			commission,
			vendorShare: total - commission,
			status,
			deliveryAddress: address,
			confirmBy: at(CONFIRM_WINDOW_HOURS),
			history,
			createdAt: createdAt.toISOString(),
		});
	}
	return result;
};

let orders = buildOrders();

// Units waiting on confirmation are held against stock.
for (const order of orders.filter((o) => o.status === 'awaiting_confirmation'))
	for (const item of order.items) {
		const variant = products.flatMap((p) => p.variants).find((v) => v.id === item.variantId);
		if (variant) variant.reserved = (variant.reserved ?? 0) + item.quantity;
	}

// Views

const vendorRef = (vendorId: string) => {
	const vendor = vendors.find((v) => v.id === vendorId);
	return { id: vendorId, name: vendor?.name ?? 'Unknown vendor' };
};

const paid = (order: MerchOrder) => order.status !== 'cancelled';

const toProduct = (stored: StoredProduct): Product => {
	const { vendorId, ...rest } = stored;
	const soldOut = stored.status === 'live' && stored.variants.every((v) => v.quantity === 0);
	return {
		...rest,
		vendor: vendorRef(vendorId),
		status: soldOut ? 'sold_out' : stored.status,
		sold: orders
			.filter(paid)
			.flatMap((o) => o.items)
			.filter((item) => item.productId === stored.id)
			.reduce((sum, item) => sum + item.quantity, 0),
	};
};

const toVendor = (vendor: (typeof vendors)[number]): Vendor => {
	const theirs = orders.filter((o) => o.vendor.id === vendor.id && paid(o));
	return {
		...vendor,
		productsCount: products.filter((p) => p.vendorId === vendor.id && p.status !== 'archived').length,
		gmv: theirs.reduce((sum, o) => sum + o.total, 0),
		commission: theirs.reduce((sum, o) => sum + o.commission, 0),
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

const has = (value: string | undefined, query: string | undefined) =>
	!query || (value ?? '').toLowerCase().includes(query.toLowerCase());

// Handlers

type Result = { data: unknown } | { error: FetchBaseQueryError };

const notFound = (): Result => ({ error: { status: 404, data: { message: 'Not found in demo data.' } } });
const bad = (message: string): Result => ({ error: { status: 400, data: { message } } });

const NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
	awaiting_confirmation: ['confirmed', 'cancelled'],
	confirmed: ['dispatched', 'cancelled'],
	dispatched: ['delivered'],
};

const saveVariants = (productId: string, before: ProductVariant[], after: ProductVariant[]) =>
	after.map((variant) => {
		const old = before.find((v) => v.id && v.id === variant.id);
		if (!old) {
			log(productId, 'variant added', null, `${variant.size} / ${variant.colour}`, variant.sku);
			return { ...variant, id: id('var'), reserved: 0 };
		}
		if (old.price !== variant.price) log(productId, 'price', old.price, variant.price, variant.sku);
		if (old.quantity !== variant.quantity) log(productId, 'quantity', old.quantity, variant.quantity, variant.sku);
		return { ...variant, reserved: old.reserved ?? 0 };
	});

const handle = (method: string, path: string, params: Record<string, string>, body: unknown): Result => {
	const parts = path.split('/').filter(Boolean); // ['merch', resource, id?, action?]
	const [, resource, itemId, action] = parts;

	if (resource === 'vendors') {
		if (method === 'GET' && !itemId) return { data: { data: vendors.map(toVendor) } };
		const input = body as VendorInput;
		if (method === 'POST' && !itemId) {
			const vendor = { ...input, id: id('vendor'), createdAt: new Date().toISOString() };
			vendors = [...vendors, vendor];
			return { data: toVendor(vendor) };
		}
		if (method === 'PUT' && itemId) {
			const existing = vendors.find((v) => v.id === itemId);
			if (!existing) return notFound();
			const vendor = { ...existing, ...input };
			vendors = vendors.map((v) => (v.id === itemId ? vendor : v));
			return { data: toVendor(vendor) };
		}
	}

	if (resource === 'products') {
		if (method === 'GET' && !itemId) {
			const rows = products
				.map(toProduct)
				.filter(
					(p) =>
						(!params.vendorId || p.vendor.id === params.vendorId) &&
						(params.status ? p.status === params.status : p.status !== 'archived') &&
						(!params.category || p.category === params.category) &&
						(has(p.name, params.q) || p.variants.some((v) => has(v.sku, params.q)))
				)
				.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
			return { data: page(rows, params) };
		}
		if (method === 'POST' && !itemId) {
			const input = body as ProductInput;
			const now = new Date().toISOString();
			const pid = id('prod');
			const { vendorId, ...rest } = input;
			const stored: StoredProduct = {
				...rest,
				vendorId,
				id: pid,
				variants: saveVariants(pid, [], input.variants),
				createdAt: now,
				updatedAt: now,
			};
			audit = audit.filter((entry) => entry.productId !== pid);
			log(pid, 'created', null, null);
			products = [stored, ...products];
			return { data: toProduct(stored) };
		}

		const existing = products.find((p) => p.id === itemId);
		if (!existing) return notFound();

		if (method === 'PUT' && !action) {
			const input = body as ProductInput;
			if (existing.status !== input.status) log(existing.id, 'status', existing.status, input.status);
			const { vendorId, ...rest } = input;
			const stored: StoredProduct = {
				...existing,
				...rest,
				vendorId,
				variants: saveVariants(existing.id, existing.variants, input.variants),
				updatedAt: new Date().toISOString(),
			};
			products = products.map((p) => (p.id === existing.id ? stored : p));
			return { data: toProduct(stored) };
		}
		if (method === 'POST' && action === 'duplicate') {
			const now = new Date().toISOString();
			const pid = id('prod');
			const copy: StoredProduct = {
				...existing,
				id: pid,
				name: `${existing.name} (copy)`,
				status: 'draft',
				variants: existing.variants.map((v) => ({ ...v, id: id('var'), sku: `${v.sku}-COPY`, reserved: 0 })),
				createdAt: now,
				updatedAt: now,
			};
			log(pid, 'duplicated', null, null);
			products = [copy, ...products];
			return { data: toProduct(copy) };
		}
		if (method === 'PATCH' && action === 'status') {
			const { status } = body as { status: StoredProduct['status'] };
			log(existing.id, 'status', existing.status, status);
			products = products.map((p) => (p.id === existing.id ? { ...p, status, updatedAt: new Date().toISOString() } : p));
			return { data: null };
		}
		if (method === 'GET' && action === 'audit') {
			return { data: { data: audit.filter((entry) => entry.productId === existing.id) } };
		}
	}

	if (resource === 'variants') {
		if (method === 'GET') {
			const rows: VariantRow[] = products
				.filter((p) => p.status !== 'archived' && (!params.vendorId || p.vendorId === params.vendorId))
				.flatMap((p) => {
					const view = toProduct(p);
					return p.variants.map((v) => ({
						...v,
						id: v.id!,
						product: { id: p.id, name: p.name, status: view.status },
						vendor: vendorRef(p.vendorId),
					}));
				})
				.filter((row) => has(row.product.name, params.q) || has(row.sku, params.q));
			return { data: { data: rows } };
		}
		if (method === 'PATCH') {
			const { updates } = body as { updates: VariantUpdate[] };
			const known = new Set(products.flatMap((p) => p.variants.map((v) => v.id)));
			const missing = updates.find((u) => !known.has(u.id));
			if (missing) return bad(`No variant ${missing.id}.`);
			products = products.map((p) => ({
				...p,
				variants: p.variants.map((v) => {
					const update = updates.find((u) => u.id === v.id);
					if (!update) return v;
					const next = { ...v, ...update };
					if (update.price !== undefined && update.price !== v.price) log(p.id, 'price', v.price, update.price, v.sku);
					if (update.quantity !== undefined && update.quantity !== v.quantity)
						log(p.id, 'quantity', v.quantity, update.quantity, v.sku);
					return next;
				}),
			}));
			return { data: null };
		}
	}

	if (resource === 'placements') {
		if (method === 'GET') return { data: { data: placements } };
		if (method === 'PUT' && itemId) {
			const { enabled } = body as { enabled: boolean };
			placements = placements.map((p) => (p.key === itemId ? { ...p, enabled } : p));
			return { data: null };
		}
	}

	if (resource === 'orders') {
		if (method === 'GET' && !itemId) {
			const from = params.from ? new Date(`${params.from}T00:00:00+01:00`).getTime() : -Infinity;
			const to = params.to ? new Date(`${params.to}T23:59:59.999+01:00`).getTime() : Infinity;
			const rows = orders
				.filter((o) => {
					const at = new Date(o.createdAt).getTime();
					return (
						(!params.vendorId || o.vendor.id === params.vendorId) &&
						(!params.status || o.status === params.status) &&
						at >= from &&
						at <= to &&
						(has(o.reference, params.q) ||
							has(o.buyer.name, params.q) ||
							o.items.some((item) => has(item.sku, params.q)))
					);
				})
				.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
			const counted = rows.filter(paid);
			return {
				data: {
					...page(rows, params),
					summary: {
						count: counted.length,
						gmv: counted.reduce((sum, o) => sum + o.total, 0),
						commission: counted.reduce((sum, o) => sum + o.commission, 0),
					},
				},
			};
		}
		if (method === 'PATCH' && action === 'status') {
			const order = orders.find((o) => o.id === itemId);
			if (!order) return notFound();
			const { status, note } = body as { status: OrderStatus; note?: string };
			if (!NEXT[order.status]?.includes(status))
				return bad(`An order that is ${order.status.replace('_', ' ')} can't move to ${status.replace('_', ' ')}.`);

			// Confirming releases the hold into a sale; cancelling puts stock back.
			for (const item of order.items)
				products = products.map((p) => ({
					...p,
					variants: p.variants.map((v) => {
						if (v.id !== item.variantId) return v;
						if (status === 'cancelled' && order.status !== 'awaiting_confirmation')
							return { ...v, quantity: v.quantity + item.quantity };
						if (order.status === 'awaiting_confirmation')
							return {
								...v,
								reserved: Math.max(0, (v.reserved ?? 0) - item.quantity),
								quantity: status === 'confirmed' ? Math.max(0, v.quantity - item.quantity) : v.quantity,
							};
						return v;
					}),
				}));

			const updated: MerchOrder = {
				...order,
				status,
				history: [...order.history, { status, at: new Date().toISOString(), by: ACTOR.name, note: note ?? null }],
			};
			orders = orders.map((o) => (o.id === order.id ? updated : o));
			return { data: updated };
		}
	}

	return notFound();
};

const isMerchPath = (url: string) => url === '/merch' || url.startsWith('/merch/');

export const isMerchDemoRequest = (args: string | FetchArgs) =>
	MERCH_DEMO && isMerchPath(typeof args === 'string' ? args : args.url);

export const merchDemoQuery = async (args: string | FetchArgs): Promise<Result> => {
	const { url, method = 'GET', params = {}, body } = typeof args === 'string' ? { url: args } : args;
	// A short pause so loading states still show.
	await new Promise((resolve) => setTimeout(resolve, 250));
	const result = handle(
		method.toUpperCase(),
		url.split('?')[0],
		Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
		body
	);
	// Hand back copies so components never hold references into the store.
	return 'data' in result ? { data: structuredClone(result.data) } : result;
};
