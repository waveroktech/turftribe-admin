'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Archive, Copy, Eye, EyeOff, ImageOff, Megaphone, Pencil, Plus } from 'lucide-react';
import {
	useDuplicateProductMutation,
	useGetProductsQuery,
	useGetVendorsQuery,
	useUpdateProductStatusMutation,
} from '@/features/merch/merchApi';
import type { MerchCategory, Product, ProductStatus } from '@/features/merch/types';
import { useDebounce } from '@/hooks/useDebounce';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

import Link from 'next/link';
import NavWrapper from '@/shared/nav-wrapper';
import AppSearch from '@/components/ui/app-search';
import LoadingButton from '@/components/ui/loading-button';
import Pagination from '@/components/pagination';
import RecordTable, { Column } from '../../../manager/payment-collection/record-table';
import ProductEditor from './product-editor';
import PlacementsDialog from './placements-dialog';
import {
	ALL,
	AdminQueryState,
	EmptyRows,
	FilterSelect,
	PAGE_SIZE,
	Pill,
	RowsSkeleton,
	Toolbar,
	cancelButtonClass,
	count,
	errorMessage,
} from '../../shared';
import {
	DemoBanner,
	CATEGORY_OPTIONS,
	PRODUCT_STATUS_OPTIONS,
	PRODUCT_STATUS_TONE,
	categoryLabel,
	effectiveCommission,
	lowStockCount,
	percent,
	priceRange,
	primaryButtonClass,
	productStatusLabel,
	secondaryButtonClass,
	totalStock,
} from '../shared';

const Cover = ({ product }: { product: Product }) => {
	const [broken, setBroken] = useState(false);
	const src = product.images[0];
	return (
		<span className='grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-soft text-ink'>
			{src && !broken ? (
				// eslint-disable-next-line @next/next/no-img-element -- vendor images live on arbitrary hosts
				<img src={src} alt='' onError={() => setBroken(true)} className='h-full w-full object-cover' />
			) : (
				<ImageOff className='h-4 w-4' />
			)}
		</span>
	);
};

const IconButton = ({
	label,
	onClick,
	children,
	danger,
	disabled,
}: {
	label: string;
	onClick: () => void;
	children: React.ReactNode;
	danger?: boolean;
	disabled?: boolean;
}) => (
	<button
		type='button'
		onClick={onClick}
		disabled={disabled}
		aria-label={label}
		title={label}
		className={
			danger
				? 'grid h-8 w-8 place-items-center rounded-lg text-subtle transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40'
				: 'grid h-8 w-8 place-items-center rounded-lg text-subtle transition-colors hover:bg-black/[0.05] hover:text-ink disabled:opacity-40'
		}>
		{children}
	</button>
);

const ArchiveConfirm = ({ product, onClose }: { product: Product; onClose: () => void }) => {
	const [updateStatus, { isLoading }] = useUpdateProductStatusMutation();

	const confirm = async () => {
		try {
			await updateStatus({ id: product.id, status: 'archived' }).unwrap();
			toast.success(`${product.name} archived.`);
			onClose();
		} catch (error) {
			toast.error(errorMessage(error, 'Couldn’t archive the product.'));
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='max-w-md rounded-3xl p-6'>
				<DialogTitle className='text-lg font-semibold text-primary-black'>Archive {product.name}?</DialogTitle>
				<DialogDescription className='text-sm text-neutral-500'>
					It leaves the shop and every placement. Past orders and its change history are kept, and you can find it
					under the Archived filter.
				</DialogDescription>
				<div className='mt-2 flex gap-3'>
					<button type='button' onClick={onClose} className={cancelButtonClass}>
						Cancel
					</button>
					<LoadingButton variant='destructive' loading={isLoading} onClick={confirm} className='flex-1'>
						Archive
					</LoadingButton>
				</div>
			</DialogContent>
		</Dialog>
	);
};

const AdminMerchProducts = () => {
	const [search, setSearch] = useState('');
	const [vendorId, setVendorId] = useState<string>(ALL);
	const [status, setStatus] = useState<ProductStatus | typeof ALL>(ALL);
	const [category, setCategory] = useState<MerchCategory | typeof ALL>(ALL);
	const [page, setPage] = useState(1);
	// undefined = closed, null = adding a new product.
	const [editing, setEditing] = useState<Product | null | undefined>(undefined);
	const [archiving, setArchiving] = useState<Product | null>(null);
	const [placementsOpen, setPlacementsOpen] = useState(false);

	const debouncedSearch = useDebounce(search.trim(), 400);
	const { data: vendors = [], isLoading: vendorsLoading } = useGetVendorsQuery();
	const { data, error, isLoading, isFetching, refetch } = useGetProductsQuery({
		page,
		limit: PAGE_SIZE,
		q: debouncedSearch,
		vendorId: vendorId === ALL ? undefined : vendorId,
		status: status === ALL ? undefined : status,
		category: category === ALL ? undefined : category,
	});
	const [duplicate, { isLoading: duplicating }] = useDuplicateProductMutation();
	const [updateStatus, { isLoading: togglingStatus }] = useUpdateProductStatusMutation();

	const rows = data?.data ?? [];
	const filtered = !!debouncedSearch || vendorId !== ALL || status !== ALL || category !== ALL;
	const noVendors = !vendorsLoading && vendors.length === 0;

	const filter =
		<T,>(set: (value: T) => void) =>
		(value: T) => {
			set(value);
			setPage(1);
		};

	const duplicateProduct = async (product: Product) => {
		try {
			const copy = await duplicate(product.id).unwrap();
			toast.success(`Copied ${product.name} as a draft.`);
			setEditing(copy);
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t duplicate the product.'));
		}
	};

	const toggleHidden = async (product: Product) => {
		const next = product.status === 'hidden' ? 'live' : 'hidden';
		try {
			await updateStatus({ id: product.id, status: next }).unwrap();
			toast.success(`${product.name} is now ${next}.`);
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t change the product’s status.'));
		}
	};

	const actions = (product: Product) => {
		const archived = product.status === 'archived';
		const hidden = product.status === 'hidden';
		return (
			<div className='flex items-center justify-end gap-0.5'>
				<IconButton label='Edit' onClick={() => setEditing(product)}>
					<Pencil className='h-4 w-4' />
				</IconButton>
				<IconButton label='Duplicate' onClick={() => duplicateProduct(product)} disabled={duplicating}>
					<Copy className='h-4 w-4' />
				</IconButton>
				{!archived && product.status !== 'draft' && (
					<IconButton
						label={hidden ? 'Show in shop' : 'Hide from shop'}
						onClick={() => toggleHidden(product)}
						disabled={togglingStatus}>
						{hidden ? <Eye className='h-4 w-4' /> : <EyeOff className='h-4 w-4' />}
					</IconButton>
				)}
				{!archived && (
					<IconButton label='Archive' danger onClick={() => setArchiving(product)}>
						<Archive className='h-4 w-4' />
					</IconButton>
				)}
			</div>
		);
	};

	const stockCell = (product: Product) => {
		const low = lowStockCount(product);
		return (
			<span className='inline-flex items-center gap-1.5'>
				{count(totalStock(product.variants))}
				{low > 0 && (
					<span title={`${low} variant(s) below their alert level`} className='text-[#8A5A00]'>
						<AlertTriangle className='h-3.5 w-3.5' />
					</span>
				)}
			</span>
		);
	};

	const columns: Column<Product>[] = [
		{
			key: 'product',
			header: 'Product',
			cell: (product) => (
				<button onClick={() => setEditing(product)} className='flex items-center gap-3 text-left'>
					<Cover product={product} />
					<div className='min-w-0'>
						<p className='max-w-[16rem] truncate font-semibold hover:underline'>{product.name}</p>
						<p className='text-xs text-subtle'>
							{categoryLabel(product.category)} · {product.variants.length} variant
							{product.variants.length === 1 ? '' : 's'}
						</p>
					</div>
				</button>
			),
		},
		{ key: 'vendor', header: 'Vendor', cell: (product) => product.vendor.name },
		{ key: 'price', header: 'Price', align: 'right', cell: (product) => priceRange(product.variants) },
		{ key: 'stock', header: 'In stock', align: 'right', cell: stockCell },
		{ key: 'sold', header: 'Sold', align: 'right', cell: (product) => count(product.sold) },
		{
			key: 'commission',
			header: 'Commission',
			align: 'right',
			cell: (product) => {
				const rate = effectiveCommission(product, vendors);
				return (
					<span title={product.commissionRate !== null ? 'Product override' : 'Vendor default'}>
						{rate === null ? '—' : percent(rate)}
						{product.commissionRate !== null && <span className='text-subtle'>*</span>}
					</span>
				);
			},
		},
		{
			key: 'status',
			header: 'Status',
			cell: (product) => <Pill tone={PRODUCT_STATUS_TONE[product.status]}>{productStatusLabel(product.status)}</Pill>,
		},
		{ key: 'actions', header: '', align: 'right', cell: actions },
	];

	return (
		<NavWrapper title='Products'>
			<div className='mt-2 flex flex-col gap-4 pb-10 md:mt-4'>
				<DemoBanner />
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<p className='text-sm text-subtle'>
						Partner activewear sold in TurfTribe. The vendor fulfils; TurfTribe keeps a commission on each sale.
					</p>
					<div className='flex gap-2'>
						<button onClick={() => setPlacementsOpen(true)} className={secondaryButtonClass}>
							<Megaphone className='h-4 w-4' />
							Placements
						</button>
						<button onClick={() => setEditing(null)} disabled={noVendors} className={primaryButtonClass}>
							<Plus className='h-4 w-4' />
							Add product
						</button>
					</div>
				</div>

				{noVendors && (
					<p className='rounded-2xl bg-warning/15 px-4 py-3 text-xs text-[#8A5A00]'>
						Every product belongs to a vendor.{' '}
						<Link href='/admin/merch/vendors' className='font-semibold underline'>
							Add a vendor
						</Link>{' '}
						before listing products.
					</p>
				)}

				<Toolbar>
					<AppSearch value={search} onChange={filter(setSearch)} placeholder='Search by name or SKU' />
					{vendors.length > 1 && (
						<FilterSelect
							label='Vendors'
							value={vendorId}
							onChange={filter(setVendorId)}
							options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.name }))}
						/>
					)}
					<FilterSelect label='Statuses' value={status} onChange={filter(setStatus)} options={PRODUCT_STATUS_OPTIONS} />
					<FilterSelect label='Categories' value={category} onChange={filter(setCategory)} options={CATEGORY_OPTIONS} />
					{data && (
						<p className='ml-auto text-xs text-subtle'>
							{count(data.pagination.total)} product{data.pagination.total === 1 ? '' : 's'}
						</p>
					)}
				</Toolbar>

				{error ? (
					<AdminQueryState error={error} endpoint='GET /merch/products' onRetry={refetch} />
				) : isLoading ? (
					<RowsSkeleton />
				) : rows.length === 0 ? (
					<EmptyRows
						title='No products found'
						info={
							filtered
								? 'Try a different search or filter.'
								: 'Add the partner’s best sellers to start. Aim for 6–10 at launch.'
						}
					/>
				) : (
					<div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
						<RecordTable
							rows={rows}
							columns={columns}
							rowKey={(product) => product.id}
							mobile={(product) => ({
								title: product.name,
								meta: `${product.vendor.name} · ${categoryLabel(product.category)} · ${count(
									totalStock(product.variants)
								)} in stock`,
								value: <Pill tone={PRODUCT_STATUS_TONE[product.status]}>{productStatusLabel(product.status)}</Pill>,
								extra: (
									<div className='flex items-center justify-between text-xs text-subtle'>
										<span>{priceRange(product.variants)}</span>
										{actions(product)}
									</div>
								),
							})}
						/>
						{data && data.pagination.total > PAGE_SIZE && (
							<Pagination
								totalItems={data.pagination.total}
								itemsPerPage={PAGE_SIZE}
								currentPage={page}
								onPageChange={setPage}
							/>
						)}
					</div>
				)}
			</div>

			{editing !== undefined && <ProductEditor product={editing} vendors={vendors} onClose={() => setEditing(undefined)} />}
			{archiving && <ArchiveConfirm product={archiving} onClose={() => setArchiving(null)} />}
			{placementsOpen && <PlacementsDialog onClose={() => setPlacementsOpen(false)} />}
		</NavWrapper>
	);
};

export default AdminMerchProducts;
