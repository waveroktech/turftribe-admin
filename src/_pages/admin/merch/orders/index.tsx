'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Download, Package, ShoppingCart, Wallet } from 'lucide-react';
import { useGetOrdersQuery, useGetVendorsQuery, useLazyGetOrdersQuery } from '@/features/merch/merchApi';
import type { MerchOrder, OrderStatus, OrdersParams } from '@/features/merch/types';
import { useDebounce } from '@/hooks/useDebounce';

import NavWrapper from '@/shared/nav-wrapper';
import AppSearch from '@/components/ui/app-search';
import Pagination from '@/components/pagination';
import RecordTable, { Column } from '../../../manager/payment-collection/record-table';
import OrderSheet, { ConfirmWindow } from './order-sheet';
import { EXPORT_LIMIT, downloadOrdersCsv, exportParams } from './export';
import {
	ALL,
	AdminQueryState,
	EmptyRows,
	FilterSelect,
	KpiCard,
	PAGE_SIZE,
	Pill,
	RowsSkeleton,
	Toolbar,
	count,
	dateTime,
	errorMessage,
	naira,
} from '../../shared';
import { DemoBanner, ORDER_STATUS_OPTIONS, ORDER_STATUS_TONE, orderStatusLabel, secondaryButtonClass, today } from '../shared';

const dateInputClass =
	'h-11 rounded-full border border-line bg-white px-4 text-sm text-ink outline-none focus:border-ink';

const itemsSummary = (order: MerchOrder) => {
	const units = order.items.reduce((sum, item) => sum + item.quantity, 0);
	const first = order.items[0];
	if (!first) return '—';
	return order.items.length === 1
		? `${first.name} · ${first.size} · ${first.colour}${units > 1 ? ` × ${units}` : ''}`
		: `${first.name} + ${order.items.length - 1} more (${units} units)`;
};

const AdminMerchOrders = () => {
	const [search, setSearch] = useState('');
	const [vendorId, setVendorId] = useState<string>(ALL);
	const [status, setStatus] = useState<OrderStatus | typeof ALL>(ALL);
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [page, setPage] = useState(1);
	const [selected, setSelected] = useState<MerchOrder | null>(null);

	const debouncedSearch = useDebounce(search.trim(), 400);
	const params: OrdersParams = {
		q: debouncedSearch,
		vendorId: vendorId === ALL ? undefined : vendorId,
		status: status === ALL ? undefined : status,
		// Only send a range once both ends are set.
		...(from && to && { from, to }),
	};

	const { data: vendors = [] } = useGetVendorsQuery();
	const { data, error, isLoading, isFetching, refetch } = useGetOrdersQuery({ ...params, page, limit: PAGE_SIZE });
	const [fetchAll, { isFetching: exporting }] = useLazyGetOrdersQuery();

	const rows = data?.data ?? [];
	const filtered = !!debouncedSearch || vendorId !== ALL || status !== ALL || !!(from && to);
	const caption = filtered ? 'Matching these filters' : 'All time';

	const filter =
		<T,>(set: (value: T) => void) =>
		(value: T) => {
			set(value);
			setPage(1);
		};

	const exportCsv = async () => {
		try {
			const all = await fetchAll(exportParams(params)).unwrap();
			downloadOrdersCsv(`turftribe-merch-orders-${today()}.csv`, all.data);
			if (all.pagination.total > EXPORT_LIMIT)
				toast.warning(`Exported the latest ${EXPORT_LIMIT} of ${count(all.pagination.total)} orders. Narrow the dates for the rest.`);
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t export the orders.'));
		}
	};

	const columns: Column<MerchOrder>[] = [
		{
			key: 'reference',
			header: 'Order',
			cell: (order) => (
				<button onClick={() => setSelected(order)} className='text-left'>
					<p className='font-mono text-xs font-semibold hover:underline'>{order.reference}</p>
					<p className='text-xs text-subtle'>{dateTime(order.createdAt)}</p>
				</button>
			),
		},
		{
			key: 'buyer',
			header: 'Buyer',
			cell: (order) => (
				<div className='min-w-0'>
					<p className='max-w-[12rem] truncate capitalize'>{order.buyer.name}</p>
					<p className='max-w-[12rem] truncate text-xs text-subtle'>{order.buyer.phone}</p>
				</div>
			),
		},
		{
			key: 'items',
			header: 'Items',
			cell: (order) => (
				<div className='min-w-0'>
					<p className='max-w-[16rem] truncate'>{itemsSummary(order)}</p>
					<p className='text-xs text-subtle'>{order.vendor.name}</p>
				</div>
			),
		},
		{ key: 'total', header: 'Paid', align: 'right', cell: (order) => <span className='font-semibold'>{naira(order.total)}</span> },
		{ key: 'commission', header: 'Commission', align: 'right', cell: (order) => naira(order.commission) },
		{
			key: 'status',
			header: 'Status',
			cell: (order) => (
				<div className='flex flex-col items-start gap-0.5'>
					<Pill tone={ORDER_STATUS_TONE[order.status]}>{orderStatusLabel(order.status)}</Pill>
					<span className='text-[11px]'>
						<ConfirmWindow order={order} />
					</span>
				</div>
			),
		},
	];

	return (
		<NavWrapper title='Orders'>
			<div className='mt-2 flex flex-col gap-4 pb-10 md:mt-4'>
				<DemoBanner />
				<Toolbar>
					<AppSearch value={search} onChange={filter(setSearch)} placeholder='Search by reference, buyer or SKU' />
					{vendors.length > 1 && (
						<FilterSelect
							label='Vendors'
							value={vendorId}
							onChange={filter(setVendorId)}
							options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.name }))}
						/>
					)}
					<FilterSelect label='Statuses' value={status} onChange={filter(setStatus)} options={ORDER_STATUS_OPTIONS} />
					<div className='flex items-center gap-2'>
						<input
							type='date'
							aria-label='From date'
							value={from}
							max={to || undefined}
							onChange={(e) => filter(setFrom)(e.target.value)}
							className={dateInputClass}
						/>
						<span className='text-xs text-subtle'>to</span>
						<input
							type='date'
							aria-label='To date'
							value={to}
							min={from || undefined}
							onChange={(e) => filter(setTo)(e.target.value)}
							className={dateInputClass}
						/>
						{(from || to) && (
							<button
								onClick={() => {
									setFrom('');
									setTo('');
									setPage(1);
								}}
								className='text-xs font-medium text-subtle hover:text-ink'>
								Clear
							</button>
						)}
					</div>
					<button
						onClick={exportCsv}
						disabled={exporting || !data || data.pagination.total === 0}
						className={`${secondaryButtonClass} ml-auto`}>
						<Download className='h-4 w-4' />
						{exporting ? 'Exporting…' : 'Export CSV'}
					</button>
				</Toolbar>

				{error ? (
					<AdminQueryState error={error} endpoint='GET /merch/orders' onRetry={refetch} />
				) : (
					<>
						<div className='grid gap-3 sm:grid-cols-3 md:gap-4'>
							<KpiCard
								loading={isLoading}
								title='Paid orders'
								icon={<ShoppingCart />}
								value={count(data?.summary.count ?? 0)}
								caption={caption}
							/>
							<KpiCard
								loading={isLoading}
								title='Merch GMV'
								icon={<Package />}
								value={naira(data?.summary.gmv ?? 0)}
								caption={`${caption}, excluding cancelled`}
							/>
							<KpiCard
								highlight
								loading={isLoading}
								title='Commission'
								icon={<Wallet />}
								value={naira(data?.summary.commission ?? 0)}
								caption={caption}
							/>
						</div>

						{isLoading ? (
							<RowsSkeleton />
						) : rows.length === 0 ? (
							<EmptyRows
								title='No orders found'
								info={filtered ? 'Try a different search or filter.' : 'Orders appear here once players buy merch.'}
							/>
						) : (
							<div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
								<RecordTable
									rows={rows}
									columns={columns}
									rowKey={(order) => order.id}
									mobile={(order) => ({
										title: (
											<button onClick={() => setSelected(order)} className='text-left capitalize'>
												{order.buyer.name}
											</button>
										),
										meta: `${order.reference} · ${dateTime(order.createdAt)}`,
										value: naira(order.total),
										extra: (
											<div className='flex items-center justify-between gap-2 text-xs text-subtle'>
												<span className='truncate'>{itemsSummary(order)}</span>
												<Pill tone={ORDER_STATUS_TONE[order.status]}>{orderStatusLabel(order.status)}</Pill>
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
					</>
				)}
			</div>

			{selected && <OrderSheet order={selected} onClose={() => setSelected(null)} />}
		</NavWrapper>
	);
};

export default AdminMerchOrders;
