import { useEffect, useRef } from 'react';
import {
	addDays,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	isSameMonth,
	isToday,
	startOfMonth,
	startOfWeek,
} from 'date-fns';
import type { Slot, VenueLocation } from '@/features/venues/types';
import { cn } from '@/lib/utils';
import { naira } from '../../shared';
import { SLOT_STATUS } from '../shared';

export const WEEK_STARTS_ON = 1 as const;

const minutesOfDay = (iso: string) => {
	const date = new Date(iso);
	return date.getHours() * 60 + date.getMinutes();
};

const compactNaira = (value: number) => (value >= 1000 ? `₦${Math.round(value / 100) / 10}k` : naira(value));

/** Open or blocked, and not started: the slots a drag can select. */
export const isSelectable = (slot: Slot) =>
	(slot.status === 'open' || slot.status === 'blocked') && new Date(slot.start) > new Date();

/*
 * Drag across slots to select them (shift/⌘-click adds one); a plain click
 * opens the slot. Selection only takes open and blocked upcoming slots.
 */
const useDragSelect = ({
	selection,
	onSelectionChange,
	onOpen,
}: {
	selection: Set<string>;
	onSelectionChange: (ids: Set<string>) => void;
	onOpen: (slot: Slot) => void;
}) => {
	const drag = useRef<{ start: Slot; ids: Set<string>; base: Set<string>; moved: boolean; additive: boolean } | null>(null);
	const latest = useRef({ onSelectionChange, onOpen });
	latest.current = { onSelectionChange, onOpen };

	useEffect(() => {
		const up = () => {
			const current = drag.current;
			drag.current = null;
			if (!current) return;
			const { onSelectionChange: change, onOpen: open } = latest.current;
			if (current.moved) change(new Set([...current.base, ...current.ids]));
			else if (current.additive) {
				const next = new Set(current.base);
				if (next.has(current.start.id)) next.delete(current.start.id);
				else next.add(current.start.id);
				change(next);
			} else open(current.start);
		};
		window.addEventListener('mouseup', up);
		return () => window.removeEventListener('mouseup', up);
	}, []);

	return {
		onMouseDown: (slot: Slot, event: React.MouseEvent) => {
			if (event.button !== 0) return;
			event.preventDefault();
			const additive = event.shiftKey || event.metaKey || event.ctrlKey;
			if (!isSelectable(slot)) {
				// Booked and past slots only open.
				if (!additive) onOpen(slot);
				return;
			}
			drag.current = { start: slot, ids: new Set([slot.id]), base: additive ? new Set(selection) : new Set(), moved: false, additive };
		},
		onMouseEnter: (slot: Slot) => {
			const current = drag.current;
			if (!current || !isSelectable(slot) || current.ids.has(slot.id)) return;
			current.ids.add(slot.id);
			current.moved = true;
			onSelectionChange(new Set([...current.base, ...current.ids]));
		},
	};
};

type GridProps = {
	days: Date[];
	locations: VenueLocation[];
	slots: Slot[];
	selection: Set<string>;
	onSelectionChange: (ids: Set<string>) => void;
	onOpen: (slot: Slot) => void;
};

/** Day view (one day, a column per location) and week view (each day split into location columns). */
export const TimeGrid = ({ days, locations, slots, selection, onSelectionChange, onOpen }: GridProps) => {
	const handlers = useDragSelect({ selection, onSelectionChange, onOpen });
	const week = days.length > 1;
	const hourPx = week ? 44 : 60;

	const startHour = slots.length ? Math.floor(Math.min(...slots.map((s) => minutesOfDay(s.start))) / 60) : 7;
	const endHour = slots.length
		? Math.ceil(Math.max(...slots.map((s) => minutesOfDay(s.end) || 24 * 60)) / 60)
		: 22;
	const hours = Array.from({ length: Math.max(1, endHour - startHour) }, (_, i) => startHour + i);
	const height = hours.length * hourPx;

	const columns = days.flatMap((day) => locations.map((location) => ({ day, location })));
	const byColumn = new Map<string, Slot[]>();
	for (const slot of slots) {
		const key = `${format(new Date(slot.start), 'yyyy-MM-dd')}|${slot.locationId}`;
		byColumn.set(key, [...(byColumn.get(key) ?? []), slot]);
	}

	const now = new Date();
	const nowTop = ((now.getHours() * 60 + now.getMinutes() - startHour * 60) / 60) * hourPx;
	const colMin = week ? (locations.length > 2 ? 56 : 84) : 160;

	return (
		<div className='overflow-x-auto rounded-[20px] bg-surface-raised ring-1 ring-black/[0.06]'>
			<div className='select-none' style={{ minWidth: 56 + columns.length * colMin }}>
				{/* Header */}
				<div className='sticky top-0 z-[2] flex border-b border-line bg-surface-raised'>
					<div className='w-14 shrink-0' />
					{days.map((day) => (
						<div key={day.toISOString()} className='flex flex-1 flex-col border-l border-line/70'>
							{week && (
								<p
									className={cn(
										'px-2 pt-2 text-center text-xs font-semibold',
										isToday(day) ? 'text-ink' : 'text-subtle'
									)}>
									<span className={cn(isToday(day) && 'rounded-full bg-brand px-2 py-0.5')}>{format(day, 'EEE d')}</span>
								</p>
							)}
							<div className='flex'>
								{locations.map((location) => (
									<p
										key={location.id}
										title={location.name}
										className={cn(
											'flex-1 truncate px-2 text-center font-semibold text-ink',
											week ? 'pb-2 pt-1 text-[10px] text-subtle' : 'py-3 text-sm'
										)}>
										{location.name}
									</p>
								))}
							</div>
						</div>
					))}
				</div>

				{/* Body */}
				<div className='relative flex' style={{ height }}>
					<div className='relative w-14 shrink-0'>
						{hours.map((hour, i) => (
							<span
								key={hour}
								className='absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-subtle'
								style={{ top: i * hourPx }}>
								{i === 0 ? '' : `${String(hour).padStart(2, '0')}:00`}
							</span>
						))}
					</div>

					{columns.map(({ day, location }, index) => {
						const daySlots = byColumn.get(`${format(day, 'yyyy-MM-dd')}|${location.id}`) ?? [];
						const firstOfDay = index % locations.length === 0;
						return (
							<div
								key={`${day.toISOString()}|${location.id}`}
								className={cn('relative flex-1', firstOfDay ? 'border-l border-line/70' : 'border-l border-line/30')}>
								{hours.map((hour, i) => (
									<div key={hour} className='absolute inset-x-0 border-t border-line/40' style={{ top: i * hourPx }} />
								))}
								{isToday(day) && nowTop > 0 && nowTop < height && (
									<div className='pointer-events-none absolute inset-x-0 z-[1] h-0.5 bg-danger' style={{ top: nowTop }} />
								)}
								{daySlots.map((slot) => {
									const top = ((minutesOfDay(slot.start) - startHour * 60) / 60) * hourPx;
									const end = minutesOfDay(slot.end) || 24 * 60;
									const slotHeight = ((end - minutesOfDay(slot.start)) / 60) * hourPx;
									const past = new Date(slot.end) <= now;
									const selected = selection.has(slot.id);
									const style = SLOT_STATUS[slot.status];
									const label =
										slot.status === 'open'
											? week
												? compactNaira(slot.price)
												: naira(slot.price)
											: slot.booking && slot.status !== 'cancelled'
												? slot.booking.bookedBy.name
												: style.label;
									return (
										<button
											key={slot.id}
											type='button'
											title={`${format(new Date(slot.start), 'HH:mm')}–${format(new Date(slot.end), 'HH:mm')} · ${style.label}${
												slot.status === 'open' ? ` · ${naira(slot.price)}` : ''
											}${slot.booking ? ` · ${slot.booking.bookedBy.name}` : ''}${slot.blockReason ? ` · ${slot.blockReason}` : ''}`}
											onMouseDown={(e) => handlers.onMouseDown(slot, e)}
											onMouseEnter={() => handlers.onMouseEnter(slot)}
											onKeyDown={(e) => {
												if (e.key === 'Enter' || e.key === ' ') {
													e.preventDefault();
													onOpen(slot);
												}
											}}
											className={cn(
												'absolute inset-x-0.5 overflow-hidden rounded-md border px-1.5 text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink',
												style.className,
												past && slot.status === 'open' && 'opacity-40',
												selected && 'ring-2 ring-[#2D9CDB] ring-offset-1'
											)}
											style={{ top: top + 1, height: Math.max(14, slotHeight - 2) }}>
											{slotHeight >= 30 && (
												<span className='block truncate text-[10px] tabular-nums opacity-70'>
													{format(new Date(slot.start), 'HH:mm')}
												</span>
											)}
											<span className={cn('block truncate font-semibold', week ? 'text-[10px]' : 'text-xs')}>{label}</span>
										</button>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

/** How full each day is: booked ÷ (booked + open), blocked slots left out. */
export const MonthGrid = ({
	month,
	slots,
	onPickDay,
}: {
	month: Date;
	slots: Slot[];
	onPickDay: (day: Date) => void;
}) => {
	const days = eachDayOfInterval({
		start: startOfWeek(startOfMonth(month), { weekStartsOn: WEEK_STARTS_ON }),
		end: endOfWeek(endOfMonth(month), { weekStartsOn: WEEK_STARTS_ON }),
	});
	const byDay = new Map<string, { booked: number; open: number; blocked: number }>();
	for (const slot of slots) {
		const key = format(new Date(slot.start), 'yyyy-MM-dd');
		const entry = byDay.get(key) ?? { booked: 0, open: 0, blocked: 0 };
		if (slot.status === 'booked' || slot.status === 'in_progress' || slot.status === 'completed') entry.booked++;
		else if (slot.status === 'open') entry.open++;
		else if (slot.status === 'blocked') entry.blocked++;
		byDay.set(key, entry);
	}

	return (
		<div className='overflow-hidden rounded-[20px] bg-surface-raised ring-1 ring-black/[0.06]'>
			<div className='grid grid-cols-7 border-b border-line bg-surface/60'>
				{days.slice(0, 7).map((day) => (
					<p key={day.toISOString()} className='px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-subtle'>
						{format(day, 'EEE')}
					</p>
				))}
			</div>
			<div className='grid grid-cols-7'>
				{days.map((day) => {
					const entry = byDay.get(format(day, 'yyyy-MM-dd'));
					const total = entry ? entry.booked + entry.open : 0;
					const fill = total ? entry!.booked / total : 0;
					const inMonth = isSameMonth(day, month);
					return (
						<button
							key={day.toISOString()}
							type='button'
							onClick={() => onPickDay(day)}
							className={cn(
								'flex min-h-[5.5rem] flex-col gap-1.5 border-b border-l border-line/50 p-2 text-left transition-colors hover:bg-brand-soft/50',
								!inMonth && 'bg-black/[0.02] text-subtle'
							)}>
							<span
								className={cn(
									'text-xs font-semibold tabular-nums',
									isToday(day) && 'self-start rounded-full bg-brand px-1.5 text-ink'
								)}>
								{format(day, 'd')}
							</span>
							{entry && (total > 0 || entry.blocked > 0) && (
								<>
									<span className='h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]'>
										<span className='block h-full rounded-full bg-ink' style={{ width: `${Math.round(fill * 100)}%` }} />
									</span>
									<span className='text-[11px] text-subtle'>
										{total ? `${Math.round(fill * 100)}% · ${entry.booked}/${total}` : 'All blocked'}
										{entry.blocked > 0 && total > 0 && ` · ${entry.blocked} blocked`}
									</span>
								</>
							)}
						</button>
					);
				})}
			</div>
		</div>
	);
};

export const weekDays = (anchor: Date) => {
	const start = startOfWeek(anchor, { weekStartsOn: WEEK_STARTS_ON });
	return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};
