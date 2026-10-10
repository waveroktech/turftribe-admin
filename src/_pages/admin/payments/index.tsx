'use client';

import { useState } from 'react';
import { ArrowDownToLine, Receipt, Wallet } from 'lucide-react';
import { useGetAdminPaymentsQuery } from '@/features/admin/adminApi';
import { AdminPayment, PaymentStatus, PaymentType } from '@/features/admin/types';
import { useDebounce } from '@/hooks/useDebounce';

import NavWrapper from '@/shared/nav-wrapper';
import AppSearch from '@/components/ui/app-search';
import Pagination from '@/components/pagination';
import RecordTable, { Column } from '../../manager/payment-collection/record-table';
import {
	ALL,
	AdminQueryState,
	EmptyRows,
	FilterSelect,
	KpiCard,
	PAGE_SIZE,
	PAYMENT_STATUS_TONE,
	Pill,
	RowsSkeleton,
	Toolbar,
	count,
	dateTime,
	naira,
} from '../shared';

const TYPE_OPTIONS: { value: PaymentType; label: string }[] = [
	{ value: 'booking', label: 'Game bookings' },
	{ value: 'membership', label: 'Memberships' },
	{ value: 'subscription', label: 'Subscriptions' },
];

const STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
	{ value: 'success', label: 'Successful' },
	{ value: 'pending', label: 'Pending' },
	{ value: 'failed', label: 'Failed' },
	{ value: 'refunded', label: 'Refunded' },
];

const dateInputClass =
	'h-11 rounded-full border border-line bg-white px-4 text-sm text-ink outline-none focus:border-ink';

const AdminPayments = () => {
	const [search, setSearch] = useState('');
	const [type, setType] = useState<PaymentType | typeof ALL>(ALL);
	const [status, setStatus] = useState<PaymentStatus | typeof ALL>(ALL);
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [page, setPage] = useState(1);

	const debouncedSearch = useDebounce(search.trim(), 400);
	const { data, error, isLoading, isFetching, refetch } = useGetAdminPaymentsQuery({
		page,
		limit: PAGE_SIZE,
		q: debouncedSearch,
		type: type === ALL ? undefined : type,
		status: status === ALL ? undefined : status,
		// Only send a range once both ends are set.
		...(from && to && { from, to }),
	});
	const rows = data?.data ?? [];
	const filtered = !!debouncedSearch || type !== ALL || status !== ALL || !!(from && to);

	// Any filter change starts back at page 1.
	const filter =
		<T,>(set: (value: T) => void) =>
		(value: T) => {
			set(value);
			setPage(1);
		};

	const columns: Column<AdminPayment>[] = [
		{
			key: 'reference',
			header: 'Reference',
			cell: (payment) => (
				<div>
					<p className='font-mono text-xs font-semibold'>{payment.reference}</p>
					<p className='text-xs text-subtle'>{dateTime(payment.createdAt)}</p>
				</div>
			),
		},
		{
			key: 'payer',
			header: 'Payer',
			cell: (payment) =>
				payment.user ? (
					<div className='min-w-0'>
						<p className='max-w-[12rem] truncate capitalize'>{payment.user.name}</p>
						<p className='max-w-[12rem] truncate text-xs text-subtle'>{payment.user.email}</p>
					</div>
				) : (
					<span className='text-subtle'>—</span>
				),
		},
		{
			key: 'for',
			header: 'For',
			cell: (payment) => (
				<div className='min-w-0'>
					<p className='max-w-[14rem] truncate capitalize'>{payment.community?.name ?? '—'}</p>
					<p className='max-w-[14rem] truncate text-xs capitalize text-subtle'>
						{payment.match?.title ?? payment.type}
					</p>
				</div>
			),
		},
		{
			key: 'channel',
			header: 'Channel',
			cell: (payment) => <span className='capitalize'>{payment.channel ?? '—'}</span>,
		},
		{
			key: 'amount',
			header: 'Amount',
			align: 'right',
			cell: (payment) => <span className='font-semibold'>{naira(payment.amount)}</span>,
		},
		{ key: 'fee', header: 'Platform fee', align: 'right', cell: (payment) => naira(payment.platformFee) },
		{ key: 'owner', header: 'To community', align: 'right', cell: (payment) => naira(payment.ownerFee) },
		{
			key: 'status',
			header: 'Status',
			cell: (payment) => <Pill tone={PAYMENT_STATUS_TONE[payment.status]}>{payment.status}</Pill>,
		},
	];

	return (
		<NavWrapper title='Payments'>
			<div className='mt-2 flex flex-col gap-4 pb-10 md:mt-4'>
				<Toolbar>
					<AppSearch
						value={search}
						onChange={filter(setSearch)}
						placeholder='Search by reference, name or email'
					/>
					<FilterSelect label='Types' value={type} onChange={filter(setType)} options={TYPE_OPTIONS} />
					<FilterSelect label='Statuses' value={status} onChange={filter(setStatus)} options={STATUS_OPTIONS} />
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
				</Toolbar>

				{error ? (
					<AdminQueryState error={error} endpoint='GET /admin/payments' onRetry={refetch} />
				) : (
					<>
						<div className='grid gap-3 sm:grid-cols-3 md:gap-4'>
							<KpiCard
								loading={isLoading}
								title='Payments'
								icon={<Receipt />}
								value={count(data?.summary.count ?? 0)}
								caption={filtered ? 'Matching these filters' : 'All time'}
							/>
							<KpiCard
								loading={isLoading}
								title='Amount processed'
								icon={<ArrowDownToLine />}
								value={naira(data?.summary.amount ?? 0)}
								caption={filtered ? 'Matching these filters' : 'All time'}
							/>
							<KpiCard
								highlight
								loading={isLoading}
								title='Platform fees'
								icon={<Wallet />}
								value={naira(data?.summary.platformFee ?? 0)}
								caption={filtered ? 'Matching these filters' : 'All time'}
							/>
						</div>

						{isLoading ? (
							<RowsSkeleton />
						) : rows.length === 0 ? (
							<EmptyRows
								title='No payments found'
								info={filtered ? 'Try a different search or filter.' : 'Payments appear here as players pay.'}
							/>
						) : (
							<div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
								<RecordTable
									rows={rows}
									columns={columns}
									rowKey={(payment) => payment.id}
									mobile={(payment) => ({
										title: payment.user?.name ?? payment.reference,
										meta: `${payment.community?.name ?? payment.type} · ${dateTime(payment.createdAt)}`,
										value: naira(payment.amount),
										extra: (
											<div className='flex items-center justify-between text-xs text-subtle'>
												<span>Fee {naira(payment.platformFee)}</span>
												<Pill tone={PAYMENT_STATUS_TONE[payment.status]}>{payment.status}</Pill>
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
		</NavWrapper>
	);
};

export default AdminPayments;
