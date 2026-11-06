'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarCheck, HandCoins, Repeat, Store, Wallet } from 'lucide-react';
import { useGetVenueBookingsQuery, useGetVenueOrganisationsQuery } from '@/features/venues/venuesApi';
import type { VenueBooking, VenueBookingStatus } from '@/features/venues/types';
import { useDebounce } from '@/hooks/useDebounce';

import NavWrapper from '@/shared/nav-wrapper';
import AppSearch from '@/components/ui/app-search';
import Pagination from '@/components/pagination';
import RecordTable, { Column } from '../../../manager/payment-collection/record-table';
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
	naira,
} from '../../shared';
import {
	BOOKER_LABEL,
	BOOKING_STATUS_OPTIONS,
	BOOKING_STATUS_TONE,
	DemoBanner,
	bookingStatusLabel,
	timeRange,
} from '../shared';

type Source = 'online' | 'manual';
const SOURCE_OPTIONS: { value: Source; label: string }[] = [
	{ value: 'online', label: 'Paid online' },
	{ value: 'manual', label: 'Manual' },
];

const dateInputClass = 'h-11 rounded-full border border-line bg-white px-4 text-sm';

const AdminVenueBookings = () => {
	const [search, setSearch] = useState('');
	const [organisationId, setOrganisationId] = useState<string>(ALL);
	const [status, setStatus] = useState<VenueBookingStatus | typeof ALL>(ALL);
	const [source, setSource] = useState<Source | typeof ALL>(ALL);
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const [page, setPage] = useState(1);
	const q = useDebounce(search, 300);

	const { data: orgs = [] } = useGetVenueOrganisationsQuery();
	const { data, error, isLoading, isFetching, refetch } = useGetVenueBookingsQuery({
		q,
		organisationId: organisationId === ALL ? undefined : organisationId,
		status: status === ALL ? undefined : status,
		source: source === ALL ? undefined : source,
		from: from || undefined,
		to: to || undefined,
		page,
		limit: PAGE_SIZE,
	});

	const filter =
		<T,>(set: (value: T) => void) =>
		(value: T) => {
			set(value);
			setPage(1);
		};

	const rows = data?.data ?? [];
	const summary = data?.summary;
	const filtered = !!(q || organisationId !== ALL || status !== ALL || source !== ALL || from || to);

	const columns: Column<VenueBooking>[] = [
		{
			key: 'booker',
			header: 'Booked by',
			cell: (b) => (
				<div className='min-w-0'>
					<p className='max-w-[14rem] truncate font-semibold'>{b.bookedBy.name}</p>
					<p className='text-xs text-subtle'>
						{BOOKER_LABEL[b.bookedBy.type]} · <span className='font-mono'>{b.reference}</span>
					</p>
				</div>
			),
		},
		{
			key: 'where',
			header: 'Where',
			cell: (b) => (
				<div className='min-w-0'>
					<p className='max-w-[14rem] truncate'>{b.location.name}</p>
					<p className='text-xs text-subtle'>{b.location.placeName ?? b.organisation.name}</p>
				</div>
			),
		},
		{
			key: 'when',
			header: 'When',
			cell: (b) => (
				<div>
					<p>{format(new Date(b.start), 'EEE d MMM')}</p>
					<p className='flex items-center gap-1 text-xs text-subtle'>
						{timeRange(b.start, b.end)}
						{b.recurring && (
							<span title={`Weekly, ${b.recurring.index} of ${b.recurring.total}`} className='inline-flex items-center gap-0.5'>
								<Repeat className='h-3 w-3' />
								{b.recurring.index}/{b.recurring.total}
							</span>
						)}
					</p>
				</div>
			),
		},
		{ key: 'game', header: 'Game', cell: (b) => b.game?.title ?? <span className='text-subtle'>—</span> },
		{
			key: 'amount',
			header: 'Amount',
			align: 'right',
			cell: (b) => (
				<span title={b.source === 'manual' ? 'Paid at the venue' : 'Paid online'}>
					{naira(b.amount)}
					{b.source === 'manual' && <span className='text-subtle'>*</span>}
				</span>
			),
		},
		{
			key: 'fee',
			header: 'Fee',
			align: 'right',
			cell: (b) =>
				b.source === 'manual' ? (
					<span className='text-subtle'>—</span>
				) : b.organisation.platformOwned ? (
					<span className='text-xs text-subtle'>Own venue</span>
				) : (
					naira(b.fee)
				),
		},
		{ key: 'status', header: 'Status', cell: (b) => <Pill tone={BOOKING_STATUS_TONE[b.status]}>{bookingStatusLabel(b.status)}</Pill> },
	];

	return (
		<NavWrapper title='Venue bookings'>
			<div className='mt-2 flex flex-col gap-4 pb-10 md:mt-4'>
				<DemoBanner />

				{summary && (
					<div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4 md:gap-4'>
						<KpiCard highlight title='Booking GMV' icon={<Wallet />} value={naira(summary.gmv)} caption='Paid online, excluding cancelled' />
						<KpiCard title='TurfTriibe fees' icon={<HandCoins />} value={naira(summary.fees)} caption='On partner venues’ online bookings' />
						<KpiCard title='Bookings' icon={<CalendarCheck />} value={count(summary.count)} caption='Matching the filters, excluding cancelled' />
						<KpiCard title='Manual bookings' icon={<Store />} value={naira(summary.manualValue)} caption='Walk-ins and phone, paid at the venue' />
					</div>
				)}

				<Toolbar>
					<AppSearch value={search} onChange={filter(setSearch)} placeholder='Search reference, booker or location' />
					{orgs.length > 1 && (
						<FilterSelect
							label='Venues'
							value={organisationId}
							onChange={filter(setOrganisationId)}
							options={orgs.map((org) => ({ value: org.id, label: org.name }))}
						/>
					)}
					<FilterSelect label='Statuses' value={status} onChange={filter(setStatus)} options={BOOKING_STATUS_OPTIONS} />
					<FilterSelect label='Sources' value={source} onChange={filter(setSource)} options={SOURCE_OPTIONS} />
					<input type='date' aria-label='From' value={from} onChange={(e) => filter(setFrom)(e.target.value)} className={dateInputClass} />
					<input type='date' aria-label='To' value={to} min={from} onChange={(e) => filter(setTo)(e.target.value)} className={dateInputClass} />
					{data && (
						<p className='ml-auto text-xs text-subtle'>
							{count(data.pagination.total)} booking{data.pagination.total === 1 ? '' : 's'}
						</p>
					)}
				</Toolbar>

				{error ? (
					<AdminQueryState error={error} endpoint='GET /venues/bookings' onRetry={refetch} />
				) : isLoading ? (
					<RowsSkeleton />
				) : rows.length === 0 ? (
					<EmptyRows
						title='No bookings found'
						info={filtered ? 'Try a different search or filter.' : 'Bookings appear here once slots are booked.'}
					/>
				) : (
					<div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
						<RecordTable
							rows={rows}
							columns={columns}
							rowKey={(b) => b.id}
							mobile={(b) => ({
								title: b.bookedBy.name,
								meta: `${b.location.name} · ${format(new Date(b.start), 'EEE d MMM')} ${timeRange(b.start, b.end)}`,
								value: naira(b.amount),
								extra: (
									<div className='flex items-center justify-between text-xs text-subtle'>
										<span>
											{BOOKER_LABEL[b.bookedBy.type]} · {b.source === 'manual' ? 'Manual' : `Fee ${naira(b.fee)}`}
										</span>
										<Pill tone={BOOKING_STATUS_TONE[b.status]}>{bookingStatusLabel(b.status)}</Pill>
									</div>
								),
							})}
						/>
						{data && data.pagination.total > PAGE_SIZE && (
							<Pagination totalItems={data.pagination.total} itemsPerPage={PAGE_SIZE} currentPage={page} onPageChange={setPage} />
						)}
					</div>
				)}
			</div>
		</NavWrapper>
	);
};

export default AdminVenueBookings;
