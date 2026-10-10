'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useGetAdminSportsQuery } from '@/features/admin/adminApi';
import { AdminSport } from '@/features/admin/types';
import { getSport } from '@/lib/sports';
import { cn } from '@/lib/utils';

import NavWrapper from '@/shared/nav-wrapper';
import SportEditor from './sport-editor';
import { AdminQueryState, EmptyRows, Pill, RowsSkeleton, count } from '../shared';

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

const SportCard = ({ sport, onEdit }: { sport: AdminSport; onEdit: () => void }) => {
	const Icon = getSport(sport.key).icon;
	const headline = sport.stats.filter((stat) => stat.headline);

	return (
		<button
			onClick={onEdit}
			className={cn(
				'flex min-w-0 flex-col gap-4 rounded-3xl border border-black/[0.06] bg-surface-raised p-5 text-left shadow-card transition-shadow hover:shadow-card-hover',
				!sport.isActive && 'opacity-70'
			)}>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex items-center gap-3'>
					<span className='grid h-10 w-10 place-items-center rounded-2xl bg-brand-soft text-ink'>
						<Icon className='h-5 w-5' />
					</span>
					<div>
						<p className='font-bold text-ink'>{sport.name}</p>
						<p className='font-mono text-xs text-subtle'>{sport.key}</p>
					</div>
				</div>
				<Pill tone={sport.isActive ? 'success' : 'neutral'}>{sport.isActive ? 'Active' : 'Hidden'}</Pill>
			</div>

			<div className='flex flex-wrap gap-1.5'>
				{sport.formats.slice(0, 4).map((format) => (
					<span key={format.name} className='rounded-full bg-black/[0.05] px-2.5 py-0.5 text-xs font-medium text-ink'>
						{format.name}
					</span>
				))}
				{sport.formats.length > 4 && (
					<span className='px-1 text-xs text-subtle'>+{sport.formats.length - 4} more</span>
				)}
				{sport.formats.length === 0 && <span className='text-xs text-subtle'>No game formats</span>}
			</div>

			<dl className='grid grid-cols-3 gap-2 border-t border-line/60 pt-3 text-xs'>
				<div>
					<dt className='text-subtle'>Stats</dt>
					<dd className='mt-0.5 truncate font-semibold text-ink' title={headline.map((stat) => stat.label).join(', ')}>
						{sport.stats.length ? headline.map((stat) => stat.short).join(' · ') || plural(sport.stats.length, 'stat') : '—'}
					</dd>
				</div>
				<div>
					<dt className='text-subtle'>Positions</dt>
					<dd className='mt-0.5 font-semibold text-ink'>{sport.positions.length || '—'}</dd>
				</div>
				<div>
					<dt className='text-subtle'>Communities</dt>
					<dd className='mt-0.5 font-semibold text-ink'>{count(sport.communitiesCount)}</dd>
				</div>
			</dl>
		</button>
	);
};

const AdminSports = () => {
	const { data: sports = [], error, isLoading, refetch } = useGetAdminSportsQuery();
	// undefined = closed, null = adding a new sport.
	const [editing, setEditing] = useState<AdminSport | null | undefined>(undefined);

	return (
		<NavWrapper title='Sports'>
			<div className='mt-2 flex flex-col gap-4 pb-10 md:mt-4'>
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<p className='text-sm text-subtle'>Sports, the games played in each, and the stats and positions they track.</p>
					{!error && (
						<button
							onClick={() => setEditing(null)}
							className='inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-ink/90'>
							<Plus className='h-4 w-4' />
							Add sport
						</button>
					)}
				</div>

				{error ? (
					<AdminQueryState error={error} endpoint='GET /admin/sports' onRetry={refetch} />
				) : isLoading ? (
					<RowsSkeleton rows={4} />
				) : sports.length === 0 ? (
					<EmptyRows title='No sports yet' info='Add one to start, or pick a template like Football or Running.' />
				) : (
					<div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3 md:gap-4'>
						{sports.map((sport) => (
							<SportCard key={sport.id} sport={sport} onEdit={() => setEditing(sport)} />
						))}
					</div>
				)}
			</div>

			{editing !== undefined && <SportEditor sport={editing} sports={sports} onClose={() => setEditing(undefined)} />}
		</NavWrapper>
	);
};

export default AdminSports;
