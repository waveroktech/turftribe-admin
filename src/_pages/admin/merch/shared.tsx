import type {
	MerchCategory,
	OrderStatus,
	PlacementKey,
	Product,
	ProductStatus,
	ProductVariant,
	Vendor,
} from '@/features/merch/types';
import { MERCH_DEMO } from '@/features/merch/demo';
import { naira } from '../shared';

export const CATEGORY_OPTIONS: { value: MerchCategory; label: string }[] = [
	{ value: 'jerseys', label: 'Jerseys' },
	{ value: 'shorts', label: 'Shorts' },
	{ value: 'socks', label: 'Socks' },
	{ value: 'training_tops', label: 'Training tops' },
	{ value: 'accessories', label: 'Accessories' },
];

export const categoryLabel = (category: MerchCategory) =>
	CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category;

export const PRODUCT_STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
	{ value: 'draft', label: 'Draft' },
	{ value: 'live', label: 'Live' },
	{ value: 'hidden', label: 'Hidden' },
	{ value: 'sold_out', label: 'Sold out' },
	{ value: 'archived', label: 'Archived' },
];

export const PRODUCT_STATUS_TONE: Record<ProductStatus, 'success' | 'danger' | 'warning' | 'neutral'> = {
	live: 'success',
	draft: 'warning',
	hidden: 'neutral',
	sold_out: 'danger',
	archived: 'neutral',
};

export const productStatusLabel = (status: ProductStatus) =>
	PRODUCT_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

export const PLACEMENTS: { key: PlacementKey; label: string; info: string }[] = [
	{
		key: 'game_confirmation',
		label: 'Game confirmation',
		info: 'Right after a player pays for a game: 1–2 featured items, “Kit up for <game day>”.',
	},
	{
		key: 'game_details',
		label: 'Game details',
		info: 'Before the game starts: a “Gear for this game” strip, matched by sport tag.',
	},
	{ key: 'player_home', label: 'Player home', info: 'Always, below upcoming games: the featured carousel.' },
	{
		key: 'venue_booking',
		label: 'Venue booking confirmation',
		info: 'After a community books a slot: featured items for that sport.',
	},
];

export const placementLabel = (key: PlacementKey) => PLACEMENTS.find((p) => p.key === key)?.label ?? key;

export const ORDER_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
	{ value: 'awaiting_confirmation', label: 'Awaiting confirmation' },
	{ value: 'confirmed', label: 'Confirmed' },
	{ value: 'dispatched', label: 'Dispatched' },
	{ value: 'delivered', label: 'Delivered' },
	{ value: 'cancelled', label: 'Cancelled' },
];

export const ORDER_STATUS_TONE: Record<OrderStatus, 'success' | 'danger' | 'warning' | 'neutral'> = {
	awaiting_confirmation: 'warning',
	confirmed: 'neutral',
	dispatched: 'neutral',
	delivered: 'success',
	cancelled: 'danger',
};

export const orderStatusLabel = (status: OrderStatus) =>
	ORDER_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

// Awaiting confirmation → Confirmed → Dispatched → Delivered, or Cancelled
// (refunded) before dispatch. Admins move orders on the vendor's behalf in v1.
export const NEXT_ORDER_STATUS: Record<OrderStatus, OrderStatus | null> = {
	awaiting_confirmation: 'confirmed',
	confirmed: 'dispatched',
	dispatched: 'delivered',
	delivered: null,
	cancelled: null,
};

export const canCancelOrder = (status: OrderStatus) => status === 'awaiting_confirmation' || status === 'confirmed';

export const totalStock = (variants: ProductVariant[]) => variants.reduce((sum, v) => sum + v.quantity, 0);

export const priceRange = (variants: ProductVariant[]) => {
	if (variants.length === 0) return '—';
	const prices = variants.map((v) => v.price);
	const min = Math.min(...prices);
	const max = Math.max(...prices);
	return min === max ? naira(min) : `${naira(min)} – ${naira(max)}`;
};

export const isLowStock = (variant: Pick<ProductVariant, 'quantity' | 'lowStockThreshold'>) =>
	variant.lowStockThreshold !== null && variant.quantity > 0 && variant.quantity < variant.lowStockThreshold;

export const lowStockCount = (product: Product) => product.variants.filter(isLowStock).length;

export const effectiveCommission = (product: Product, vendors: Vendor[]) =>
	product.commissionRate ?? vendors.find((vendor) => vendor.id === product.vendor.id)?.commissionRate ?? null;

export const percent = (value: number) => `${Number.isInteger(value) ? value : value.toFixed(1)}%`;

// CSV

const escapeCell = (value: unknown) => {
	const text = value === null || value === undefined ? '' : String(value);
	return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (header: string[], rows: unknown[][]) =>
	[header, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');

export const downloadCsv = (filename: string, csv: string) => {
	const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
};

// A small RFC 4180 parser: quoted cells, escaped quotes, CRLF.
export const parseCsv = (text: string): string[][] => {
	const rows: string[][] = [];
	let row: string[] = [];
	let cell = '';
	let quoted = false;
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (quoted) {
			if (char === '"' && text[i + 1] === '"') {
				cell += '"';
				i++;
			} else if (char === '"') quoted = false;
			else cell += char;
		} else if (char === '"') quoted = true;
		else if (char === ',') {
			row.push(cell);
			cell = '';
		} else if (char === '\n' || char === '\r') {
			if (char === '\r' && text[i + 1] === '\n') i++;
			row.push(cell);
			rows.push(row);
			row = [];
			cell = '';
		} else cell += char;
	}
	if (cell !== '' || row.length) {
		row.push(cell);
		rows.push(row);
	}
	return rows.filter((r) => r.some((c) => c.trim() !== ''));
};

export const today = () => new Date().toISOString().slice(0, 10);

export const primaryButtonClass =
	'inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-50';

export const secondaryButtonClass =
	'inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink transition-colors hover:border-ink disabled:opacity-50';

// Shown while /merch/* is served from src/features/merch/demo.ts.
export const DemoBanner = () =>
	MERCH_DEMO ? (
		<p className='rounded-2xl bg-warning/15 px-4 py-3 text-xs text-[#8A5A00]'>
			<span className='font-semibold'>Demo data.</span> Smileys’ stock and orders here are samples served by the app,
			not the backend. Changes last until you reload the page.
		</p>
	) : null;
