'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useGetAdminUsersQuery } from '@/features/admin/adminApi';
import { AdminUser, AdminUserType } from '@/features/admin/types';
import { useDebounce } from '@/hooks/useDebounce';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import NavWrapper from '@/shared/nav-wrapper';
import AppSearch from '@/components/ui/app-search';
import Pagination from '@/components/pagination';
import RecordTable, { Column } from '../../manager/payment-collection/record-table';
import UserSheet, { initials } from './user-sheet';
import {
	ALL,
	AdminQueryState,
	EmptyRows,
	FilterSelect,
	PAGE_SIZE,
	Pill,
	RowsSkeleton,
	Toolbar,
	count,
	fullName,
	naira,
	shortDate,
} from '../shared';

const TYPE_OPTIONS: { value: AdminUserType; label: string }[] = [
	{ value: 'member', label: 'Players' },
	{ value: 'manager', label: 'Managers' },
	{ value: 'staff', label: 'Staff' },
];

const AdminUsers = () => {
	const [search, setSearch] = useState('');
	const [userType, setUserType] = useState<AdminUserType | typeof ALL>(ALL);
	const [page, setPage] = useState(1);
	const [selected, setSelected] = useState<AdminUser | null>(null);

	const debouncedSearch = useDebounce(search.trim(), 400);
	const { data, error, isLoading, isFetching, refetch } = useGetAdminUsersQuery({
		page,
		limit: PAGE_SIZE,
		search: debouncedSearch,
		userType: userType === ALL ? undefined : userType,
	});
	const rows = data?.data ?? [];

	const person = (user: AdminUser) => (
		<button onClick={() => setSelected(user)} className='flex items-center gap-3 text-left'>
			<Avatar className='h-9 w-9 shrink-0 rounded-xl'>
				{user.profileImageUrl && (
					<AvatarImage src={user.profileImageUrl} alt='' className='object-cover' />
				)}
				<AvatarFallback className='rounded-xl bg-brand-soft text-xs font-bold text-ink'>{initials(user)}</AvatarFallback>
			</Avatar>
			<div className='min-w-0'>
				<p className='max-w-[14rem] truncate font-semibold capitalize hover:underline'>
					{fullName(user.firstName, user.lastName)}
				</p>
				<p className='max-w-[14rem] truncate text-xs text-subtle'>{user.email}</p>
			</div>
		</button>
	);

	const columns: Column<AdminUser>[] = [
		{ key: 'user', header: 'User', cell: person },
		{ key: 'phone', header: 'Phone', cell: (user) => user.phoneNumber || <span className='text-subtle'>—</span> },
		{
			key: 'type',
			header: 'Type',
			cell: (user) => (
				<div className='flex gap-1.5'>
					<Pill tone='neutral'>{user.currentUserType}</Pill>
					{user.locked && <Pill tone='danger'>Locked</Pill>}
				</div>
			),
		},
		{ key: 'communities', header: 'Communities', align: 'right', cell: (user) => count(user.communitiesCount) },
		{ key: 'spent', header: 'Total spent', align: 'right', cell: (user) => naira(user.totalSpent) },
		{ key: 'joined', header: 'Joined', cell: (user) => shortDate(user.createdAt) },
		{ key: 'active', header: 'Last active', cell: (user) => shortDate(user.lastActiveAt) },
		{
			key: 'open',
			header: '',
			cell: (user) => (
				<button
					onClick={() => setSelected(user)}
					aria-label={`View ${fullName(user.firstName, user.lastName)}`}
					className='grid h-8 w-8 place-items-center rounded-full text-subtle transition-colors hover:bg-black/[0.05] hover:text-ink'>
					<ChevronRight className='h-4 w-4' />
				</button>
			),
		},
	];

	return (
		<NavWrapper title='Users'>
			<div className='mt-2 flex flex-col gap-4 pb-10 md:mt-4'>
				<Toolbar>
					<AppSearch
						value={search}
						onChange={(value) => {
							setSearch(value);
							setPage(1);
						}}
						placeholder='Search by name, email or phone'
					/>
					<FilterSelect
						label='Users'
						value={userType}
						onChange={(value) => {
							setUserType(value);
							setPage(1);
						}}
						options={TYPE_OPTIONS}
					/>
					{data && (
						<p className='ml-auto text-xs text-subtle'>
							{count(data.pagination.total)} user{data.pagination.total === 1 ? '' : 's'}
						</p>
					)}
				</Toolbar>

				{error ? (
					<AdminQueryState error={error} endpoint='GET /admin/users' onRetry={refetch} />
				) : isLoading ? (
					<RowsSkeleton />
				) : rows.length === 0 ? (
					<EmptyRows
						title='No users found'
						info={debouncedSearch || userType !== ALL ? 'Try a different search or filter.' : 'Users appear here once they sign up.'}
					/>
				) : (
					<div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
						<RecordTable
							rows={rows}
							columns={columns}
							rowKey={(user) => user.id}
							mobile={(user) => ({
								title: person(user),
								meta: `${user.currentUserType} · joined ${shortDate(user.createdAt)}`,
								value: naira(user.totalSpent),
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

			{selected && <UserSheet user={selected} onClose={() => setSelected(null)} />}
		</NavWrapper>
	);
};

export default AdminUsers;
