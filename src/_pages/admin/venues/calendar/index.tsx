'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { addDays, addMonths, addWeeks, endOfMonth, format, startOfMonth } from 'date-fns';
import { Ban, CalendarOff, CalendarPlus, ChevronLeft, ChevronRight, Tag, Undo2, X } from 'lucide-react';
import {
	useGetLocationsQuery,
	useGetPlacesQuery,
	useGetSlotsQuery,
	useGetVenueOrganisationsQuery,
	useUpdateSlotsMutation,
} from '@/features/venues/venuesApi';
import type { Slot, VenueLocation } from '@/features/venues/types';
import { VENUES_HOME } from '@/lib/admin';
import { cn } from '@/lib/utils';

import NavWrapper from '@/shared/nav-wrapper';
import { ALL, AdminQueryState, EmptyRows, FilterSelect, RowsSkeleton, Toolbar, errorMessage } from '../../shared';
import { DemoBanner, SLOT_STATUS, SLOT_STATUS_ORDER, secondaryButtonClass } from '../shared';
import BookDialog, { bookableRun } from './book-dialog';
import { BlockDaysDialog, BlockDialog, RepriceDialog, resultMessage } from './bulk-dialogs';
import { MonthGrid, TimeGrid, weekDays } from './grids';
import SlotSheet from './slot-sheet';

type View = 'day' | 'week' | 'month';
const ymd = (date: Date) => format(date, 'yyyy-MM-dd');

const range = (view: View, anchor: Date) => {
	if (view === 'day') return { days: [anchor], from: ymd(anchor), to: ymd(anchor) };
	if (view === 'week') {
		const days = weekDays(anchor);
		return { days, from: ymd(days[0]), to: ymd(days[6]) };
	}
	return { days: [], from: ymd(startOfMonth(anchor)), to: ymd(endOfMonth(anchor)) };
};

const rangeLabel = (view: View, anchor: Date) => {
	if (view === 'day') return format(anchor, 'EEEE d MMMM yyyy');
	if (view === 'month') return format(anchor, 'MMMM yyyy');
	const days = weekDays(anchor);
	return `${format(days[0], 'd MMM')} – ${format(days[6], 'd MMM yyyy')}`;
};

const step = (view: View, anchor: Date, direction: 1 | -1) =>
	view === 'day' ? addDays(anchor, direction) : view === 'week' ? addWeeks(anchor, direction) : addMonths(anchor, direction);

const Legend = () => (
	<ul className='flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-subtle'>
		{SLOT_STATUS_ORDER.map((status) => (
			<li key={status} className='inline-flex items-center gap-1.5'>
				<span className={cn('h-2.5 w-2.5 rounded-sm', SLOT_STATUS[status].dot)} />
				{SLOT_STATUS[status].label}
			</li>
		))}
		<li className='hidden md:inline'>· Drag across slots to select several; shift-click adds one.</li>
	</ul>
);

type Dialog =
	| { kind: 'book'; slots: Slot[] }
	| { kind: 'reprice'; ids: string[] }
	| { kind: 'block'; ids: string[] }
	| { kind: 'blockDays' };

const AdminVenueCalendar = () => {
	const params = useSearchParams();
	const { data: orgs = [], error: orgsError, isLoading: orgsLoading, refetch: refetchOrgs } = useGetVenueOrganisationsQuery();
	const [venueId, setVenueId] = useState<string | null>(params.get('venue'));
	const activeVenue = venueId ?? orgs.find((org) => org.platformOwned)?.id ?? orgs[0]?.id ?? null;

	const { data: places = [] } = useGetPlacesQuery({ organisationId: activeVenue ?? undefined }, { skip: !activeVenue });
	const { data: locations = [], isLoading: locationsLoading } = useGetLocationsQuery(
		{ organisationId: activeVenue ?? undefined },
		{ skip: !activeVenue }
	);

	const [placeId, setPlaceId] = useState<string>(ALL);
	const [locationId, setLocationId] = useState<string>(params.get('location') ?? ALL);
	const [view, setView] = useState<View>('day');
	const [anchor, setAnchor] = useState(() => new Date());
	const [selection, setSelection] = useState<Set<string>>(new Set());
	const [openSlotId, setOpenSlotId] = useState<string | null>(null);
	const [dialog, setDialog] = useState<Dialog | null>(null);
	const [updateSlots, { isLoading: reopening }] = useUpdateSlotsMutation();

	const placeOrder = (location: VenueLocation) => {
		const index = places.findIndex((place) => place.id === location.placeId);
		return index === -1 ? places.length : index;
	};
	const visible = useMemo(
		() =>
			locations
				.filter(
					(location) =>
						location.status === 'active' &&
						(placeId === ALL || location.placeId === placeId) &&
						(locationId === ALL || location.id === locationId)
				)
				.sort((a, b) => placeOrder(a) - placeOrder(b) || a.name.localeCompare(b.name)),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[locations, places, placeId, locationId]
	);

	const { days, from, to } = range(view, anchor);
	const {
		data: slots = [],
		error,
		isLoading,
		isFetching,
		refetch,
	} = useGetSlotsQuery(
		{ organisationId: activeVenue ?? undefined, locationIds: visible.map((l) => l.id).join(','), from, to },
		{ skip: !activeVenue || visible.length === 0 }
	);

	// A new range or filter starts a fresh selection.
	useEffect(() => setSelection(new Set()), [activeVenue, placeId, locationId, view, from]);

	const chosen = slots.filter((slot) => selection.has(slot.id));
	const chosenOpen = chosen.filter((slot) => slot.status === 'open');
	const chosenBlocked = chosen.filter((slot) => slot.status === 'blocked');
	const run = bookableRun(chosen);
	const openSlot = openSlotId ? slots.find((slot) => slot.id === openSlotId) : undefined;
	const locationOf = (id: string) => locations.find((location) => location.id === id)!;

	const reopenChosen = async () => {
		try {
			const result = await updateSlots({ action: 'reopen', ids: chosenBlocked.map((s) => s.id) }).unwrap();
			toast.success(resultMessage(result, 'reopened'));
			setSelection(new Set());
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t reopen those slots.'));
		}
	};

	const closeBulk = (done: boolean) => {
		if (done) setSelection(new Set());
		setDialog(null);
	};

	const venueOptions = orgs.map((org) => ({ value: org.id, label: org.name }));

	return (
		<NavWrapper title='Calendar'>
			<div className={cn('mt-2 flex flex-col gap-4 md:mt-4', selection.size ? 'pb-28' : 'pb-10')}>
				<DemoBanner />

				{orgsError ? (
					<AdminQueryState error={orgsError} endpoint='GET /venues/organisations' onRetry={refetchOrgs} />
				) : orgsLoading || (activeVenue && locationsLoading) ? (
					<RowsSkeleton />
				) : !activeVenue ? (
					<EmptyRows title='No venues yet' info='Set up TurfTriibe as a venue owner on the Venues page first.' />
				) : (
					<>
						<Toolbar>
							{orgs.length > 1 && (
								<select
									aria-label='Venue'
									value={activeVenue}
									onChange={(e) => {
										setVenueId(e.target.value);
										setPlaceId(ALL);
										setLocationId(ALL);
									}}
									className='h-11 rounded-full border border-line bg-white px-4 text-sm'>
									{venueOptions.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							)}
							{places.length > 1 && (
								<FilterSelect
									label='Places'
									value={placeId}
									onChange={(value) => {
										setPlaceId(value);
										setLocationId(ALL);
									}}
									options={places.map((place) => ({ value: place.id, label: place.name }))}
								/>
							)}
							<FilterSelect
								label='Locations'
								value={locationId}
								onChange={setLocationId}
								options={locations
									.filter((l) => l.status === 'active' && (placeId === ALL || l.placeId === placeId))
									.map((l) => ({ value: l.id, label: l.name }))}
							/>
							<div className='inline-flex rounded-full border border-line bg-white p-1'>
								{(['day', 'week', 'month'] as View[]).map((value) => (
									<button
										key={value}
										aria-pressed={view === value}
										onClick={() => setView(value)}
										className={cn(
											'h-9 rounded-full px-4 text-sm font-semibold capitalize transition-colors',
											view === value ? 'bg-ink text-white' : 'text-ink hover:bg-black/[0.04]'
										)}>
										{value}
									</button>
								))}
							</div>
							<button onClick={() => setDialog({ kind: 'blockDays' })} disabled={!visible.length} className={secondaryButtonClass}>
								<CalendarOff className='h-4 w-4' />
								Block days
							</button>
						</Toolbar>

						<div className='flex flex-wrap items-center justify-between gap-3'>
							<div className='flex items-center gap-2'>
								<button
									aria-label='Previous'
									onClick={() => setAnchor(step(view, anchor, -1))}
									className='grid h-9 w-9 place-items-center rounded-full border border-line bg-white hover:border-ink'>
									<ChevronLeft className='h-4 w-4' />
								</button>
								<button
									onClick={() => setAnchor(new Date())}
									className='h-9 rounded-full border border-line bg-white px-4 text-sm font-semibold hover:border-ink'>
									Today
								</button>
								<button
									aria-label='Next'
									onClick={() => setAnchor(step(view, anchor, 1))}
									className='grid h-9 w-9 place-items-center rounded-full border border-line bg-white hover:border-ink'>
									<ChevronRight className='h-4 w-4' />
								</button>
								<p className='ml-1 text-base font-bold text-ink'>{rangeLabel(view, anchor)}</p>
							</div>
							<Legend />
						</div>

						{visible.length === 0 ? (
							<EmptyRows
								title='No active locations'
								info='Add a pitch or court to this venue, or change the filters.'
							/>
						) : error ? (
							<AdminQueryState error={error} endpoint='GET /venues/slots' onRetry={refetch} />
						) : isLoading ? (
							<RowsSkeleton rows={8} />
						) : slots.length === 0 && view !== 'month' ? (
							<div className='flex flex-col items-center gap-2 rounded-[20px] bg-surface-raised px-6 py-10 text-center ring-1 ring-black/[0.06]'>
								<p className='text-sm font-bold text-ink'>No slots in this range</p>
								<p className='text-xs text-subtle'>Generate a schedule for these locations to open them for booking.</p>
								<Link href={`${VENUES_HOME}/${activeVenue}`} className={cn(secondaryButtonClass, 'mt-2 h-9 text-xs')}>
									<CalendarPlus className='h-4 w-4' />
									Go to locations
								</Link>
							</div>
						) : (
							<div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
								{view === 'month' ? (
									<MonthGrid
										month={anchor}
										slots={slots}
										onPickDay={(day) => {
											setAnchor(day);
											setView('day');
										}}
									/>
								) : (
									<TimeGrid
										days={days}
										locations={visible}
										slots={slots}
										selection={selection}
										onSelectionChange={setSelection}
										onOpen={(slot) => setOpenSlotId(slot.id)}
									/>
								)}
							</div>
						)}
					</>
				)}
			</div>

			{selection.size > 0 && (
				<div className='fixed inset-x-0 bottom-4 z-30 flex justify-center px-4'>
					<div className='flex flex-wrap items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg'>
						<span className='px-1 font-semibold'>
							{selection.size} selected
							<span className='font-normal text-white/60'>
								{' '}
								· {chosenOpen.length} open{chosenBlocked.length ? ` · ${chosenBlocked.length} blocked` : ''}
							</span>
						</span>
						{run && (
							<button
								onClick={() => setDialog({ kind: 'book', slots: run })}
								className='inline-flex h-9 items-center gap-1.5 rounded-full bg-brand px-3 font-semibold text-ink'>
								<CalendarPlus className='h-4 w-4' />
								Book
							</button>
						)}
						{chosenOpen.length > 0 && (
							<>
								<button
									onClick={() => setDialog({ kind: 'reprice', ids: chosenOpen.map((s) => s.id) })}
									className='inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 font-semibold hover:bg-white/20'>
									<Tag className='h-4 w-4' />
									Reprice
								</button>
								<button
									onClick={() => setDialog({ kind: 'block', ids: chosenOpen.map((s) => s.id) })}
									className='inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 font-semibold hover:bg-white/20'>
									<Ban className='h-4 w-4' />
									Block
								</button>
							</>
						)}
						{chosenBlocked.length > 0 && (
							<button
								onClick={reopenChosen}
								disabled={reopening}
								className='inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 font-semibold hover:bg-white/20 disabled:opacity-50'>
								<Undo2 className='h-4 w-4' />
								Reopen
							</button>
						)}
						<button
							aria-label='Clear selection'
							onClick={() => setSelection(new Set())}
							className='grid h-9 w-9 place-items-center rounded-full hover:bg-white/10'>
							<X className='h-4 w-4' />
						</button>
					</div>
				</div>
			)}

			{openSlot && (
				<SlotSheet
					slot={openSlot}
					location={locationOf(openSlot.locationId)}
					selected={selection.has(openSlot.id)}
					onToggleSelect={() => {
						const next = new Set(selection);
						if (next.has(openSlot.id)) next.delete(openSlot.id);
						else next.add(openSlot.id);
						setSelection(next);
						setOpenSlotId(null);
					}}
					onBook={() => {
						setOpenSlotId(null);
						setDialog({ kind: 'book', slots: [openSlot] });
					}}
					onClose={() => setOpenSlotId(null)}
				/>
			)}
			{dialog?.kind === 'book' && (
				<BookDialog
					slots={dialog.slots}
					location={locationOf(dialog.slots[0].locationId)}
					onClose={() => {
						setSelection(new Set());
						setDialog(null);
					}}
				/>
			)}
			{dialog?.kind === 'reprice' && <RepriceDialog ids={dialog.ids} onClose={closeBulk} />}
			{dialog?.kind === 'block' && <BlockDialog ids={dialog.ids} onClose={closeBulk} />}
			{dialog?.kind === 'blockDays' && (
				<BlockDaysDialog locations={visible} defaultDate={anchor} onClose={() => setDialog(null)} />
			)}
		</NavWrapper>
	);
};

export default AdminVenueCalendar;
