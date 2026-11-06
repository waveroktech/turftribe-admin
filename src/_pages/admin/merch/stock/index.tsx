'use client';

import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, Upload } from 'lucide-react';
import { useGetVariantsQuery, useGetVendorsQuery, useUpdateVariantsMutation } from '@/features/merch/merchApi';
import type { VariantRow, VariantUpdate } from '@/features/merch/types';
import { cn } from '@/lib/utils';

import NavWrapper from '@/shared/nav-wrapper';
import AppSearch from '@/components/ui/app-search';
import LoadingButton from '@/components/ui/loading-button';
import RecordTable, { Column } from '../../../manager/payment-collection/record-table';
import { ALL, AdminQueryState, EmptyRows, FilterSelect, Pill, RowsSkeleton, Toolbar, count, errorMessage, naira } from '../../shared';
import {
	DemoBanner,
	PRODUCT_STATUS_TONE,
	downloadCsv,
	isLowStock,
	parseCsv,
	productStatusLabel,
	secondaryButtonClass,
	toCsv,
	today,
} from '../shared';

type Edit = { price?: number; quantity?: number };

const CSV_HEADER = ['vendor', 'product', 'sku', 'size', 'colour', 'price', 'quantity'];

const cellInput =
	'h-9 w-24 rounded-lg border border-[#E7EAEE] bg-white px-2.5 text-right text-sm tabular-nums text-primary-black outline-none focus:border-primary-black';

const matches = (row: VariantRow, query: string) => {
	const q = query.toLowerCase();
	return [row.product.name, row.sku, row.size, row.colour].some((value) => value.toLowerCase().includes(q));
};

type ImportReport = { applied: number; unmatched: string[]; invalid: number };

const AdminMerchStock = () => {
	const [search, setSearch] = useState('');
	const [vendorId, setVendorId] = useState<string>(ALL);
	const [edits, setEdits] = useState<Record<string, Edit>>({});
	const [report, setReport] = useState<ImportReport | null>(null);
	const fileInput = useRef<HTMLInputElement>(null);

	const { data: vendors = [] } = useGetVendorsQuery();
	const { data: variants = [], error, isLoading, refetch } = useGetVariantsQuery({
		vendorId: vendorId === ALL ? undefined : vendorId,
	});
	const [updateVariants, { isLoading: saving }] = useUpdateVariantsMutation();

	const rows = useMemo(
		() => (search.trim() ? variants.filter((row) => matches(row, search.trim())) : variants),
		[variants, search]
	);

	// Only keep fields that differ from what's saved, so a no-op edit isn't sent.
	const setEdit = (row: VariantRow, patch: Edit) =>
		setEdits((current) => {
			const next = { ...current[row.id], ...patch };
			if (next.price === row.price) delete next.price;
			if (next.quantity === row.quantity) delete next.quantity;
			const rest = { ...current };
			delete rest[row.id];
			return Object.keys(next).length ? { ...rest, [row.id]: next } : rest;
		});

	const updates: VariantUpdate[] = Object.entries(edits).map(([id, edit]) => ({ id, ...edit }));
	const invalid = updates.some(
		(u) => (u.price !== undefined && !(u.price > 0)) || (u.quantity !== undefined && (!Number.isInteger(u.quantity) || u.quantity < 0))
	);

	const save = async () => {
		try {
			await updateVariants(updates).unwrap();
			toast.success(`Saved ${updates.length} variant${updates.length === 1 ? '' : 's'}.`);
			setEdits({});
			setReport(null);
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t save the changes.'));
		}
	};

	const exportCsv = () => {
		const csv = toCsv(
			CSV_HEADER,
			variants.map((row) => [
				row.vendor.name,
				row.product.name,
				row.sku,
				row.size,
				row.colour,
				edits[row.id]?.price ?? row.price,
				edits[row.id]?.quantity ?? row.quantity,
			])
		);
		downloadCsv(`turftribe-merch-stock-${today()}.csv`, csv);
	};

	// Matches rows by SKU and stages the price/quantity changes for review;
	// nothing is saved until the admin presses Save.
	const importCsv = async (file: File) => {
		const [header, ...lines] = parseCsv(await file.text());
		const columns = (header ?? []).map((cell) => cell.trim().toLowerCase());
		const skuAt = columns.indexOf('sku');
		const priceAt = columns.indexOf('price');
		const quantityAt = columns.indexOf('quantity');
		if (skuAt === -1 || (priceAt === -1 && quantityAt === -1)) {
			toast.error('The CSV needs a “sku” column and a “price” or “quantity” column.');
			return;
		}

		const bySku = new Map(variants.map((row) => [row.sku.toUpperCase(), row]));
		const result: ImportReport = { applied: 0, unmatched: [], invalid: 0 };
		const staged: Record<string, Edit> = { ...edits };

		for (const line of lines) {
			const sku = line[skuAt]?.trim().toUpperCase();
			if (!sku) continue;
			const row = bySku.get(sku);
			if (!row) {
				result.unmatched.push(sku);
				continue;
			}
			const rawPrice = priceAt === -1 ? '' : line[priceAt]?.replace(/[₦,\s]/g, '') ?? '';
			const rawQuantity = quantityAt === -1 ? '' : line[quantityAt]?.trim() ?? '';
			const price = rawPrice === '' ? undefined : Number(rawPrice);
			const quantity = rawQuantity === '' ? undefined : Number(rawQuantity);
			if ((price !== undefined && !(price > 0)) || (quantity !== undefined && (!Number.isInteger(quantity) || quantity < 0))) {
				result.invalid++;
				continue;
			}
			const edit: Edit = { ...staged[row.id] };
			if (price !== undefined && price !== row.price) edit.price = price;
			if (quantity !== undefined && quantity !== row.quantity) edit.quantity = quantity;
			if (Object.keys(edit).length) {
				staged[row.id] = edit;
				result.applied++;
			}
		}

		setEdits(staged);
		setReport(result);
	};

	const priceCell = (row: VariantRow) => {
		const value = edits[row.id]?.price ?? row.price;
		return (
			<input
				type='number'
				min={0}
				step={100}
				aria-label={`Price for ${row.sku}`}
				value={value}
				onChange={(e) => setEdit(row, { price: Number(e.target.value) })}
				className={cn(cellInput, edits[row.id]?.price !== undefined && 'border-ink bg-brand-soft/40')}
			/>
		);
	};

	const quantityCell = (row: VariantRow) => {
		const value = edits[row.id]?.quantity ?? row.quantity;
		const low = isLowStock({ quantity: value, lowStockThreshold: row.lowStockThreshold });
		return (
			<div className='flex items-center justify-end gap-2'>
				{value === 0 && <Pill tone='danger'>Sold out</Pill>}
				{low && <Pill tone='warning'>Low</Pill>}
				<input
					type='number'
					min={0}
					step={1}
					aria-label={`Quantity for ${row.sku}`}
					value={value}
					onChange={(e) => setEdit(row, { quantity: Math.floor(Number(e.target.value)) })}
					className={cn(cellInput, 'w-20', edits[row.id]?.quantity !== undefined && 'border-ink bg-brand-soft/40')}
				/>
			</div>
		);
	};

	const columns: Column<VariantRow>[] = [
		{
			key: 'product',
			header: 'Product',
			cell: (row) => (
				<div className='min-w-0'>
					<p className='max-w-[16rem] truncate font-semibold'>{row.product.name}</p>
					<p className='text-xs text-subtle'>
						{row.size} · {row.colour}
						{vendors.length > 1 && ` · ${row.vendor.name}`}
					</p>
				</div>
			),
		},
		{ key: 'sku', header: 'SKU', cell: (row) => <span className='font-mono text-xs'>{row.sku}</span> },
		{
			key: 'status',
			header: 'Status',
			cell: (row) => <Pill tone={PRODUCT_STATUS_TONE[row.product.status]}>{productStatusLabel(row.product.status)}</Pill>,
		},
		{ key: 'reserved', header: 'Held', align: 'right', cell: (row) => count(row.reserved ?? 0) },
		{ key: 'price', header: 'Price (₦)', align: 'right', cell: priceCell },
		{ key: 'quantity', header: 'Quantity', align: 'right', cell: quantityCell },
	];

	return (
		<NavWrapper title='Stock & prices'>
			<div className={cn('mt-2 flex flex-col gap-4 md:mt-4', updates.length ? 'pb-28' : 'pb-10')}>
				<DemoBanner />
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<p className='max-w-2xl text-sm text-subtle'>
						Quantities are the stock each vendor allocates to TurfTribe, not their whole inventory. Edit inline, or
						export, update in a spreadsheet and import. Every change is recorded in the product’s history.
					</p>
					<div className='flex gap-2'>
						<button onClick={exportCsv} disabled={variants.length === 0} className={secondaryButtonClass}>
							<Download className='h-4 w-4' />
							Export CSV
						</button>
						<button onClick={() => fileInput.current?.click()} disabled={variants.length === 0} className={secondaryButtonClass}>
							<Upload className='h-4 w-4' />
							Import CSV
						</button>
						<input
							ref={fileInput}
							type='file'
							accept='.csv,text/csv'
							className='hidden'
							onChange={(e) => {
								const file = e.target.files?.[0];
								if (file) importCsv(file);
								e.target.value = '';
							}}
						/>
					</div>
				</div>

				{report && (
					<div className='flex flex-wrap items-start justify-between gap-2 rounded-2xl bg-surface-raised px-4 py-3 text-xs ring-1 ring-black/[0.06]'>
						<div className='flex flex-col gap-1'>
							<p className='font-semibold text-ink'>
								Import staged {report.applied} change{report.applied === 1 ? '' : 's'}. Review the highlighted cells,
								then save.
							</p>
							{report.unmatched.length > 0 && (
								<p className='text-danger'>
									No variant with SKU {report.unmatched.slice(0, 5).join(', ')}
									{report.unmatched.length > 5 && ` and ${report.unmatched.length - 5} more`}. Add them in the product
									editor first.
								</p>
							)}
							{report.invalid > 0 && (
								<p className='text-danger'>
									Skipped {report.invalid} row{report.invalid === 1 ? '' : 's'} with an invalid price or quantity.
								</p>
							)}
						</div>
						<button onClick={() => setReport(null)} className='text-subtle hover:text-ink'>
							Dismiss
						</button>
					</div>
				)}

				<Toolbar>
					<AppSearch value={search} onChange={setSearch} placeholder='Search by product, SKU, size or colour' />
					{vendors.length > 1 && (
						<FilterSelect
							label='Vendors'
							value={vendorId}
							onChange={setVendorId}
							options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.name }))}
						/>
					)}
					<p className='ml-auto text-xs text-subtle'>
						{count(rows.length)} variant{rows.length === 1 ? '' : 's'}
					</p>
				</Toolbar>

				{error ? (
					<AdminQueryState error={error} endpoint='GET /merch/variants' onRetry={refetch} />
				) : isLoading ? (
					<RowsSkeleton />
				) : rows.length === 0 ? (
					<EmptyRows
						title='No variants found'
						info={search ? 'Try a different search.' : 'Variants appear here once products are added.'}
					/>
				) : (
					<RecordTable
						rows={rows}
						columns={columns}
						rowKey={(row) => row.id}
						mobile={(row) => ({
							title: row.product.name,
							meta: `${row.size} · ${row.colour} · ${row.sku}`,
							value: naira(edits[row.id]?.price ?? row.price),
							extra: (
								<div className='flex items-center justify-between gap-2'>
									{priceCell(row)}
									{quantityCell(row)}
								</div>
							),
						})}
					/>
				)}
			</div>

			{updates.length > 0 && (
				<div className='sticky bottom-4 z-10 mx-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-card-hover'>
					<p className='text-sm'>
						{updates.length} unsaved change{updates.length === 1 ? '' : 's'}
						{invalid && <span className='ml-2 text-danger'>Fix the invalid price or quantity first.</span>}
					</p>
					<div className='flex gap-2'>
						<button
							onClick={() => {
								setEdits({});
								setReport(null);
							}}
							className='h-10 rounded-full px-4 text-sm font-medium text-white/70 hover:text-white'>
							Discard
						</button>
						<LoadingButton variant='primary' loading={saving} disabled={invalid} onClick={save} className='h-10 rounded-full px-5'>
							Save changes
						</LoadingButton>
					</div>
				</div>
			)}
		</NavWrapper>
	);
};

export default AdminMerchStock;
