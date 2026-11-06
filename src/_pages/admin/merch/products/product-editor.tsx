import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowUpToLine, ImageOff, Plus, Trash2 } from 'lucide-react';
import { useGetAdminSportsQuery } from '@/features/admin/adminApi';
import {
	useCreateProductMutation,
	useGetProductAuditQuery,
	useUpdateProductMutation,
} from '@/features/merch/merchApi';
import type {
	EditableProductStatus,
	MerchCategory,
	Product,
	ProductInput,
	ProductVariant,
	Vendor,
} from '@/features/merch/types';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

import LoadingButton from '@/components/ui/loading-button';
import {
	AdminQueryState,
	EmptyRows,
	RowsSkeleton,
	SheetCloseButton,
	cancelButtonClass,
	dateTime,
	errorMessage,
	naira,
} from '../../shared';
import { CATEGORY_OPTIONS, PLACEMENTS, percent } from '../shared';

export const MAX_IMAGES = 5;
const DEFAULT_DELIVERY = '2–4 working days, Lagos only';

const cellInput =
	'h-10 w-full min-w-0 rounded-lg border border-[#E7EAEE] bg-white px-3 text-sm text-primary-black outline-none focus:border-primary-black';
const fieldInput = cn(cellInput, 'mt-1.5 h-12 rounded-xl px-4');
const labelClass = 'block text-sm font-medium text-neutral-700';

const EDITABLE_STATUSES: { value: EditableProductStatus; label: string; info: string }[] = [
	{ value: 'draft', label: 'Draft', info: 'Not shown to players.' },
	{ value: 'live', label: 'Live', info: 'In the shop and eligible for placements.' },
	{ value: 'hidden', label: 'Hidden', info: 'Taken down for now; keeps its data.' },
];

const BLANK_VARIANT: ProductVariant = {
	size: '',
	colour: '',
	sku: '',
	price: 0,
	quantity: 0,
	lowStockThreshold: null,
};

const toInput = (product: Product): ProductInput => ({
	vendorId: product.vendor.id,
	name: product.name,
	description: product.description,
	category: product.category,
	images: product.images,
	sportTags: product.sportTags,
	// Sold out is derived from stock and archived has its own action, so the
	// editor reopens either as the closest editable state.
	status: product.status === 'live' || product.status === 'sold_out' ? 'live' : product.status === 'draft' ? 'draft' : 'hidden',
	placements: product.placements,
	deliveryPromise: product.deliveryPromise,
	commissionRate: product.commissionRate,
	variants: product.variants,
});

const blankInput = (vendors: Vendor[]): ProductInput => ({
	vendorId: vendors.length === 1 ? vendors[0].id : '',
	name: '',
	description: '',
	category: 'jerseys',
	images: [],
	sportTags: [],
	status: 'draft',
	placements: [],
	deliveryPromise: DEFAULT_DELIVERY,
	commissionRate: null,
	variants: [{ ...BLANK_VARIANT }],
});

const isUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());

const validate = (draft: ProductInput) => {
	if (!draft.vendorId) return 'Pick the vendor that sells this product.';
	if (!draft.name.trim()) return 'Give the product a name.';
	if (!draft.description.trim()) return 'Add a short description (fabric and fit).';
	if (draft.images.length === 0) return 'Add at least one image; the first is the cover.';
	if (draft.images.length > MAX_IMAGES) return `Use at most ${MAX_IMAGES} images.`;
	if (!draft.deliveryPromise.trim()) return 'Add a delivery promise, e.g. “2–4 working days, Lagos only”.';
	if (draft.commissionRate !== null && (draft.commissionRate < 0 || draft.commissionRate > 100))
		return 'Commission override must be between 0% and 100%.';
	if (draft.variants.length === 0) return 'Add at least one size/colour variant.';
	if (draft.variants.some((v) => !v.size.trim() || !v.colour.trim())) return 'Every variant needs a size and a colour.';
	if (draft.variants.some((v) => !v.sku.trim())) return 'Every variant needs the vendor’s SKU.';
	const skus = draft.variants.map((v) => v.sku.trim().toUpperCase());
	if (new Set(skus).size !== skus.length) return 'Two variants share a SKU.';
	if (draft.variants.some((v) => !(v.price > 0))) return 'Every variant needs a price above ₦0.';
	if (draft.variants.some((v) => !Number.isInteger(v.quantity) || v.quantity < 0))
		return 'Quantities must be whole numbers, 0 or more.';
	return null;
};

const Section = ({
	title,
	hint,
	action,
	children,
}: {
	title: string;
	hint?: string;
	action?: React.ReactNode;
	children: React.ReactNode;
}) => (
	<section className='flex flex-col gap-2'>
		<div className='flex items-end justify-between gap-3'>
			<div>
				<h3 className='text-sm font-bold text-ink'>{title}</h3>
				{hint && <p className='text-xs text-subtle'>{hint}</p>}
			</div>
			{action}
		</div>
		{children}
	</section>
);

const SmallButton = ({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) => (
	<button
		type='button'
		onClick={onClick}
		disabled={disabled}
		className='inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-ink/90 disabled:opacity-40'>
		{children}
	</button>
);

const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
	<button
		type='button'
		aria-pressed={active}
		onClick={onClick}
		className={cn(
			'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
			active ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:border-ink'
		)}>
		{children}
	</button>
);

const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

const Thumb = ({ src, alt }: { src: string; alt: string }) => {
	const [broken, setBroken] = useState(false);
	return broken ? (
		<span className='grid h-full w-full place-items-center bg-black/[0.04] text-subtle'>
			<ImageOff className='h-5 w-5' />
		</span>
	) : (
		// eslint-disable-next-line @next/next/no-img-element -- vendor images live on arbitrary hosts
		<img src={src} alt={alt} onError={() => setBroken(true)} className='h-full w-full object-cover' />
	);
};

const History = ({ productId }: { productId: string }) => {
	const { data: entries = [], error, isLoading, refetch } = useGetProductAuditQuery(productId);

	if (error) return <AdminQueryState error={error} endpoint={`GET /merch/products/${productId}/audit`} onRetry={refetch} />;
	if (isLoading) return <RowsSkeleton rows={4} />;
	if (entries.length === 0) return <EmptyRows title='No changes yet' info='Price, stock and status changes show up here.' />;

	const show = (field: string, value: string | number | null) =>
		value === null ? '—' : field === 'price' && typeof value === 'number' ? naira(value) : String(value);

	return (
		<ol className='flex flex-col divide-y divide-line/70 overflow-hidden rounded-[20px] bg-surface-raised ring-1 ring-black/[0.06]'>
			{entries.map((entry) => (
				<li key={entry.id} className='flex items-start justify-between gap-3 px-4 py-3 text-sm'>
					<div className='min-w-0'>
						<p className='text-ink'>
							<span className='font-semibold capitalize'>{entry.actor.name}</span>{' '}
							{entry.from === null && entry.to === null ? (
								<span className='text-subtle'>{entry.field} the product</span>
							) : (
								<>
									<span className='text-subtle'>changed</span> {entry.field}
									{entry.sku && <span className='font-mono text-xs text-subtle'> ({entry.sku})</span>}{' '}
									<span className='text-subtle'>from</span> {show(entry.field, entry.from)}{' '}
									<span className='text-subtle'>to</span> <span className='font-semibold'>{show(entry.field, entry.to)}</span>
								</>
							)}
						</p>
						{entry.actor.vendorId && <p className='text-xs text-subtle'>Vendor user</p>}
					</div>
					<time className='shrink-0 text-xs text-subtle'>{dateTime(entry.createdAt)}</time>
				</li>
			))}
		</ol>
	);
};

const ProductEditor = ({
	product,
	vendors,
	onClose,
}: {
	/** null creates a new product. */
	product: Product | null;
	vendors: Vendor[];
	onClose: () => void;
}) => {
	const editing = !!product;
	const [draft, setDraft] = useState<ProductInput>(() => (product ? toInput(product) : blankInput(vendors)));
	const [tab, setTab] = useState<'details' | 'history'>('details');
	const [imageUrl, setImageUrl] = useState('');
	const [overrideOn, setOverrideOn] = useState(product?.commissionRate != null);

	const { data: sports = [] } = useGetAdminSportsQuery();
	const [createProduct, { isLoading: creating }] = useCreateProductMutation();
	const [updateProduct, { isLoading: updating }] = useUpdateProductMutation();

	const vendor = vendors.find((v) => v.id === draft.vendorId);
	const error = validate(draft);

	const set = <K extends keyof ProductInput>(field: K, value: ProductInput[K]) =>
		setDraft((current) => ({ ...current, [field]: value }));

	const updateVariant = (index: number, patch: Partial<ProductVariant>) =>
		setDraft((current) => ({
			...current,
			variants: current.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
		}));

	const addImage = () => {
		const url = imageUrl.trim();
		if (!isUrl(url) || draft.images.length >= MAX_IMAGES || draft.images.includes(url)) return;
		set('images', [...draft.images, url]);
		setImageUrl('');
	};

	const save = async () => {
		const body: ProductInput = {
			...draft,
			name: draft.name.trim(),
			description: draft.description.trim(),
			deliveryPromise: draft.deliveryPromise.trim(),
			commissionRate: overrideOn ? draft.commissionRate : null,
			variants: draft.variants.map((v) => ({
				...v,
				size: v.size.trim(),
				colour: v.colour.trim(),
				sku: v.sku.trim().toUpperCase(),
			})),
		};
		try {
			if (product) await updateProduct({ id: product.id, body }).unwrap();
			else await createProduct(body).unwrap();
			toast.success(`${body.name} ${editing ? 'updated' : 'added'}.`);
			onClose();
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t save the product.'));
		}
	};

	return (
		<Sheet open onOpenChange={(open) => !open && onClose()}>
			<SheetContent className='flex w-full flex-col gap-0 overflow-hidden bg-[#F7F7F7] p-0 sm:max-w-3xl'>
				<SheetCloseButton />
				<div className='flex-1 overflow-y-auto p-6'>
					<SheetTitle className='pr-10 text-lg font-bold text-ink'>
						{editing ? `Edit ${product.name}` : 'Add a product'}
					</SheetTitle>
					<SheetDescription className='text-sm text-subtle'>
						Listed in the shop and promo placements under the vendor’s name. The vendor fulfils every order.
					</SheetDescription>

					{editing && (
						<div className='mt-4 inline-flex rounded-full bg-white p-1 ring-1 ring-black/[0.06]'>
							{(['details', 'history'] as const).map((value) => (
								<button
									key={value}
									type='button'
									onClick={() => setTab(value)}
									className={cn(
										'rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors',
										tab === value ? 'bg-ink text-white' : 'text-subtle hover:text-ink'
									)}>
									{value}
								</button>
							))}
						</div>
					)}

					{tab === 'history' && product ? (
						<div className='mt-6'>
							<History productId={product.id} />
						</div>
					) : (
						<div className='mt-6 flex flex-col gap-7'>
							<section className='grid gap-3 sm:grid-cols-2'>
								<label className={labelClass}>
									Vendor
									<Select value={draft.vendorId} onValueChange={(value) => set('vendorId', value)}>
										<SelectTrigger className='mt-1.5 h-12 rounded-xl border-[#E7EAEE] bg-white px-4 text-sm'>
											<SelectValue placeholder='Pick a vendor' />
										</SelectTrigger>
										<SelectContent>
											{vendors.map((v) => (
												<SelectItem key={v.id} value={v.id}>
													{v.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</label>
								<label className={labelClass}>
									Category
									<Select value={draft.category} onValueChange={(value) => set('category', value as MerchCategory)}>
										<SelectTrigger className='mt-1.5 h-12 rounded-xl border-[#E7EAEE] bg-white px-4 text-sm'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{CATEGORY_OPTIONS.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</label>
								<label className={cn(labelClass, 'sm:col-span-2')}>
									Name
									<input
										value={draft.name}
										onChange={(e) => set('name', e.target.value)}
										placeholder='e.g. Smileys Pro Training Jersey'
										className={fieldInput}
									/>
								</label>
								<label className={cn(labelClass, 'sm:col-span-2')}>
									Description
									<textarea
										value={draft.description}
										onChange={(e) => set('description', e.target.value)}
										rows={3}
										maxLength={500}
										placeholder='Fabric and fit, e.g. Lightweight, quick-dry polyester. Regular fit.'
										className={cn(fieldInput, 'h-auto py-3')}
									/>
								</label>
								<label className={cn(labelClass, 'sm:col-span-2')}>
									Delivery promise
									<input
										value={draft.deliveryPromise}
										onChange={(e) => set('deliveryPromise', e.target.value)}
										placeholder={DEFAULT_DELIVERY}
										className={fieldInput}
									/>
								</label>
							</section>

							<Section
								title='Images'
								hint={`1–${MAX_IMAGES} image URLs. The first is the cover.`}>
								<div className='flex gap-2'>
									<input
										value={imageUrl}
										onChange={(e) => setImageUrl(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												addImage();
											}
										}}
										placeholder='https://…'
										aria-label='Image URL'
										disabled={draft.images.length >= MAX_IMAGES}
										className={cn(cellInput, 'h-11 rounded-xl px-4 disabled:bg-[#F6F6F6]')}
									/>
									<SmallButton
										onClick={addImage}
										disabled={!isUrl(imageUrl) || draft.images.length >= MAX_IMAGES}>
										<Plus className='h-3.5 w-3.5' />
										Add
									</SmallButton>
								</div>
								{draft.images.length > 0 && (
									<ul className='grid grid-cols-3 gap-2 sm:grid-cols-5'>
										{draft.images.map((src, index) => (
											<li
												key={src}
												className='group relative aspect-square overflow-hidden rounded-xl bg-white ring-1 ring-black/[0.06]'>
												<Thumb src={src} alt={`${draft.name || 'Product'} image ${index + 1}`} />
												{index === 0 && (
													<span className='absolute left-1.5 top-1.5 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-white'>
														Cover
													</span>
												)}
												<div className='absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100'>
													{index > 0 && (
														<button
															type='button'
															aria-label='Make cover'
															title='Make cover'
															onClick={() => set('images', [src, ...draft.images.filter((i) => i !== src)])}
															className='grid h-7 w-7 place-items-center rounded-full bg-white text-ink shadow'>
															<ArrowUpToLine className='h-3.5 w-3.5' />
														</button>
													)}
													<button
														type='button'
														aria-label='Remove image'
														title='Remove'
														onClick={() => set('images', draft.images.filter((i) => i !== src))}
														className='grid h-7 w-7 place-items-center rounded-full bg-white text-danger shadow'>
														<Trash2 className='h-3.5 w-3.5' />
													</button>
												</div>
											</li>
										))}
									</ul>
								)}
							</Section>

							<Section
								title='Variants'
								hint='One row per size and colour. Stock lives here, as the quantity the vendor allocates to TurfTribe.'
								action={
									<SmallButton
										onClick={() => {
											// Start from the last row so adding sizes of one colour is quick.
											const last = draft.variants[draft.variants.length - 1];
											set('variants', [
												...draft.variants,
												last ? { ...last, id: undefined, size: '', sku: '', reserved: undefined } : { ...BLANK_VARIANT },
											]);
										}}>
										<Plus className='h-3.5 w-3.5' />
										Variant
									</SmallButton>
								}>
								{draft.variants.length ? (
									<div className='flex flex-col gap-2'>
										<div className='hidden grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_2.5rem] gap-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-subtle sm:grid'>
											<span>Size</span>
											<span>Colour</span>
											<span>SKU</span>
											<span>Price (₦)</span>
											<span>Qty</span>
											<span title='Alert admins below this quantity'>Alert at</span>
										</div>
										{draft.variants.map((variant, index) => (
											<div
												key={variant.id ?? `new-${index}`}
												className='grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-2 rounded-xl bg-white/60 p-2 ring-1 ring-black/[0.04] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.4fr)_minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_2.5rem] sm:bg-transparent sm:p-0 sm:ring-0'>
												<input
													aria-label='Size'
													value={variant.size}
													onChange={(e) => updateVariant(index, { size: e.target.value })}
													placeholder='M'
													className={cellInput}
												/>
												<input
													aria-label='Colour'
													value={variant.colour}
													onChange={(e) => updateVariant(index, { colour: e.target.value })}
													placeholder='Black'
													className={cellInput}
												/>
												<button
													type='button'
													aria-label={`Remove variant ${variant.sku || index + 1}`}
													onClick={() => set('variants', draft.variants.filter((_, i) => i !== index))}
													className='grid h-10 w-10 place-items-center rounded-lg text-subtle transition-colors hover:bg-danger/10 hover:text-danger sm:order-last'>
													<Trash2 className='h-4 w-4' />
												</button>
												<input
													aria-label='SKU'
													value={variant.sku}
													onChange={(e) => updateVariant(index, { sku: e.target.value.toUpperCase() })}
													placeholder='SMY-JRS-BLK-M'
													className={cn(cellInput, 'col-span-2 font-mono uppercase sm:col-span-1')}
												/>
												<input
													aria-label='Price in naira'
													type='number'
													min={0}
													step={100}
													value={variant.price || ''}
													onChange={(e) => updateVariant(index, { price: Math.max(0, Number(e.target.value)) })}
													placeholder='Price'
													className={cn(cellInput, 'col-start-1 sm:col-start-auto')}
												/>
												<input
													aria-label='Quantity available'
													type='number'
													min={0}
													step={1}
													value={variant.quantity}
													onChange={(e) =>
														updateVariant(index, { quantity: Math.max(0, Math.floor(Number(e.target.value))) })
													}
													className={cellInput}
												/>
												<input
													aria-label='Low-stock alert threshold'
													type='number'
													min={0}
													step={1}
													value={variant.lowStockThreshold ?? ''}
													onChange={(e) =>
														updateVariant(index, {
															lowStockThreshold:
																e.target.value === '' ? null : Math.max(0, Math.floor(Number(e.target.value))),
														})
													}
													placeholder='—'
													className={cellInput}
												/>
											</div>
										))}
										{draft.variants.some((v) => v.reserved) && (
											<p className='text-xs text-subtle'>
												{draft.variants.reduce((sum, v) => sum + (v.reserved ?? 0), 0)} unit(s) are held by checkouts in
												progress.
											</p>
										)}
									</div>
								) : (
									<p className='rounded-xl border border-dashed border-[#E7EAEE] px-4 py-3 text-xs text-subtle'>
										No variants yet.
									</p>
								)}
							</Section>

							<Section title='Sports' hint='Optional. Matches the product to games for the “Gear for this game” strip.'>
								<div className='flex flex-wrap gap-2'>
									{sports.length === 0 && <p className='text-xs text-subtle'>No sports loaded.</p>}
									{sports.map((sport) => (
										<Chip
											key={sport.key}
											active={draft.sportTags.includes(sport.key)}
											onClick={() => set('sportTags', toggle(draft.sportTags, sport.key))}>
											{sport.name}
										</Chip>
									))}
								</div>
							</Section>

							<Section
								title='Featured in'
								hint='Optional. The promo slots this product may appear in. Turning a slot off for everyone is under Placements.'>
								<div className='flex flex-wrap gap-2'>
									{PLACEMENTS.map((placement) => (
										<Chip
											key={placement.key}
											active={draft.placements.includes(placement.key)}
											onClick={() => set('placements', toggle(draft.placements, placement.key))}>
											{placement.label}
										</Chip>
									))}
								</div>
							</Section>

							<Section title='Status'>
								<div className='grid gap-2 sm:grid-cols-3'>
									{EDITABLE_STATUSES.map((option) => (
										<button
											key={option.value}
											type='button'
											aria-pressed={draft.status === option.value}
											onClick={() => set('status', option.value)}
											className={cn(
												'rounded-2xl border p-3 text-left transition-colors',
												draft.status === option.value ? 'border-ink bg-white' : 'border-line bg-white/50 hover:border-ink/40'
											)}>
											<p className='text-sm font-semibold text-ink'>{option.label}</p>
											<p className='text-xs text-subtle'>{option.info}</p>
										</button>
									))}
								</div>
								<p className='text-xs text-subtle'>
									A live product shows as sold out, and leaves the shop, once every variant reaches 0.
								</p>
							</Section>

							<Section
								title='Commission'
								hint={
									vendor
										? `${vendor.name}’s default is ${percent(vendor.commissionRate)} of each sale.`
										: 'Defaults to the vendor’s rate.'
								}>
								<label className='flex items-center gap-2 text-sm text-ink'>
									<input
										type='checkbox'
										checked={overrideOn}
										onChange={(e) => {
											setOverrideOn(e.target.checked);
											if (e.target.checked && draft.commissionRate === null)
												set('commissionRate', vendor?.commissionRate ?? 0);
										}}
										className='h-4 w-4 accent-[hsl(var(--ink))]'
									/>
									Use a different rate for this product
								</label>
								{overrideOn && (
									<div className='flex items-center gap-2'>
										<input
											type='number'
											aria-label='Commission override percent'
											min={0}
											max={100}
											step={0.5}
											value={draft.commissionRate ?? ''}
											onChange={(e) =>
												set('commissionRate', e.target.value === '' ? null : Number(e.target.value))
											}
											className={cn(cellInput, 'h-11 w-28 rounded-xl px-4')}
										/>
										<span className='text-sm text-subtle'>% of each sale</span>
									</div>
								)}
							</Section>
						</div>
					)}
				</div>

				{tab === 'details' && (
					<footer className='flex flex-col gap-2 border-t border-line bg-white p-4'>
						{error && <p className='text-xs text-danger'>{error}</p>}
						<div className='flex gap-3'>
							<button type='button' onClick={onClose} className={cancelButtonClass}>
								Cancel
							</button>
							<LoadingButton
								variant='secondary'
								loading={creating || updating}
								disabled={!!error}
								onClick={save}
								className='flex-1'>
								{editing ? 'Save changes' : 'Add product'}
							</LoadingButton>
						</div>
					</footer>
				)}
			</SheetContent>
		</Sheet>
	);
};

export default ProductEditor;
