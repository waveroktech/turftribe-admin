'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Settings2 } from 'lucide-react';
import {
	useGetAdminCommunitiesQuery,
	useUpdateCommunityStatusMutation,
} from '@/features/admin/adminApi';
import { AdminCommunity, CommunityStatus } from '@/features/admin/types';
import { useDebounce } from '@/hooks/useDebounce';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { getSport } from '@/lib/sports';

import NavWrapper from '@/shared/nav-wrapper';
import AppSearch from '@/components/ui/app-search';
import LoadingButton from '@/components/ui/loading-button';
import Pagination from '@/components/pagination';
import RecordTable, { Column } from '../../manager/payment-collection/record-table';
import FeeDialog, { describeFee } from './fee-dialog';
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
	compactNaira,
	count,
	errorMessage,
	shortDate,
} from '../shared';

const STATUS_OPTIONS: { value: CommunityStatus; label: string }[] = [
	{ value: 'active', label: 'Active' },
	{ value: 'inactive', label: 'Inactive' },
];

const StatusConfirm = ({
	community,
	onClose,
}: {
	community: AdminCommunity;
	onClose: () => void;
}) => {
	const [updateStatus, { isLoading }] = useUpdateCommunityStatusMutation();
	const activating = community.status !== 'active';

	const confirm = async () => {
		try {
			await updateStatus({ id: community.id, status: activating ? 'active' : 'inactive' }).unwrap();
			toast.success(`${community.name} is now ${activating ? 'active' : 'inactive'}.`);
			onClose();
		} catch (error) {
			toast.error(errorMessage(error, 'Couldn’t change the community’s status.'));
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='max-w-md rounded-3xl p-6'>
				<DialogTitle className='text-lg font-semibold text-primary-black'>
					{activating ? 'Activate' : 'Deactivate'} <span className='capitalize'>{community.name}</span>?
				</DialogTitle>
				<DialogDescription className='text-sm text-neutral-500'>
					{activating
						? 'The community becomes visible again and its manager can create games and take payments.'
						: 'The community is hidden from discovery, new games and bookings are blocked. Existing data is kept, and you can reactivate it at any time.'}
				</DialogDescription>
				<div className='mt-2 flex gap-3'>
					<button type='button' onClick={onClose} className={cancelButtonClass}>
						Cancel
					</button>
					<LoadingButton
						variant={activating ? 'secondary' : 'destructive'}
						loading={isLoading}
						onClick={confirm}
						className='flex-1'>
						{activating ? 'Activate' : 'Deactivate'}
					</LoadingButton>
				</div>
			</DialogContent>
		</Dialog>
	);
};

const AdminCommunities = () => {
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState<CommunityStatus | typeof ALL>(ALL);
	const [page, setPage] = useState(1);
	const [feeFor, setFeeFor] = useState<AdminCommunity | null>(null);
	const [statusFor, setStatusFor] = useState<AdminCommunity | null>(null);

	const debouncedSearch = useDebounce(search.trim(), 400);
	const { data, error, isLoading, isFetching, refetch } = useGetAdminCommunitiesQuery({
		page,
		limit: PAGE_SIZE,
		search: debouncedSearch,
		status: status === ALL ? undefined : status,
	});
	const rows = data?.data ?? [];

	const statusSwitch = (community: AdminCommunity) => (
		<Switch
			checked={community.status === 'active'}
			onCheckedChange={() => setStatusFor(community)}
			aria-label={`${community.status === 'active' ? 'Deactivate' : 'Activate'} ${community.name}`}
		/>
	);

	const feeButton = (community: AdminCommunity) => (
		<button
			onClick={() => setFeeFor(community)}
			className='inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-ink'>
			<Settings2 className='h-3.5 w-3.5' />
			{describeFee(community.commission)}
		</button>
	);

	const columns: Column<AdminCommunity>[] = [
		{
			key: 'name',
			header: 'Community',
			cell: (community) => {
				const sport = getSport(community.category);
				return (
					<div className='flex items-center gap-3'>
						<span className='grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-ink'>
							<sport.icon className='h-4 w-4' />
						</span>
						<div className='min-w-0'>
							<p className='max-w-[14rem] truncate font-semibold capitalize'>{community.name}</p>
							<p className='text-xs capitalize text-subtle'>
								{sport.label} · {community.visibility}
							</p>
						</div>
					</div>
				);
			},
		},
		{
			key: 'manager',
			header: 'Manager',
			cell: (community) =>
				community.manager ? (
					<div className='min-w-0'>
						<p className='max-w-[12rem] truncate capitalize'>{community.manager.name}</p>
						<p className='max-w-[12rem] truncate text-xs text-subtle'>{community.manager.email}</p>
					</div>
				) : (
					<span className='text-subtle'>—</span>
				),
		},
		{ key: 'members', header: 'Members', align: 'right', cell: (community) => count(community.membersCount) },
		{
			key: 'processed',
			header: 'Processed',
			align: 'right',
			cell: (community) => compactNaira.format(community.processed),
		},
		{ key: 'fee', header: 'Platform fee', cell: feeButton },
		{ key: 'created', header: 'Created', cell: (community) => shortDate(community.createdAt) },
		{
			key: 'status',
			header: 'Active',
			cell: (community) => (
				<div className='flex items-center gap-2'>
					{statusSwitch(community)}
					<Pill tone={community.status === 'active' ? 'success' : 'neutral'}>{community.status}</Pill>
				</div>
			),
		},
	];

	return (
		<NavWrapper title='Communities'>
			<div className='mt-2 flex flex-col gap-4 pb-10 md:mt-4'>
				<Toolbar>
					<AppSearch
						value={search}
						onChange={(value) => {
							setSearch(value);
							setPage(1);
						}}
						placeholder='Search by community or manager'
					/>
					<FilterSelect
						label='Statuses'
						value={status}
						onChange={(value) => {
							setStatus(value);
							setPage(1);
						}}
						options={STATUS_OPTIONS}
					/>
					{data && (
						<p className='ml-auto text-xs text-subtle'>
							{count(data.pagination.total)} communit{data.pagination.total === 1 ? 'y' : 'ies'}
						</p>
					)}
				</Toolbar>

				{error ? (
					<AdminQueryState error={error} endpoint='GET /admin/communities' onRetry={refetch} />
				) : isLoading ? (
					<RowsSkeleton />
				) : rows.length === 0 ? (
					<EmptyRows
						title='No communities found'
						info={debouncedSearch || status !== ALL ? 'Try a different search or filter.' : 'Communities appear here once managers create them.'}
					/>
				) : (
					<div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
						<RecordTable
							rows={rows}
							columns={columns}
							rowKey={(community) => community.id}
							mobile={(community) => ({
								title: community.name,
								meta: `${getSport(community.category).label} · ${count(community.membersCount)} members`,
								value: statusSwitch(community),
								extra: feeButton(community),
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

			{feeFor && <FeeDialog community={feeFor} onClose={() => setFeeFor(null)} />}
			{statusFor && <StatusConfirm community={statusFor} onClose={() => setStatusFor(null)} />}
		</NavWrapper>
	);
};

export default AdminCommunities;
