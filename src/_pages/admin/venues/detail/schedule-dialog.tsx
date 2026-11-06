import { useState } from 'react';
import { toast } from 'sonner';
import { addDays, addMonths, differenceInCalendarDays, format, isAfter } from 'date-fns';
import { useGenerateScheduleMutation } from '@/features/venues/venuesApi';
import type { ScheduleInput, VenueLocation } from '@/features/venues/types';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import LoadingButton from '@/components/ui/loading-button';
import { cancelButtonClass, count, errorMessage, inputClass, naira, shortDate } from '../../shared';
import { Field } from '../shared';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const INTERVALS = [30, 45, 60, 90, 120];
const ymd = (date: Date) => format(date, 'yyyy-MM-dd');
const minutes = (hhmm: string) => {
	const [h, m] = hhmm.split(':').map(Number);
	return h * 60 + m;
};

// Slots the inputs would make, before the backend skips overlaps.
const estimate = (input: ScheduleInput) => {
	const perDay = Math.max(0, Math.floor((minutes(input.closeTime) - minutes(input.openTime)) / input.intervalMinutes));
	const from = new Date(`${input.from}T00:00:00`);
	const span = differenceInCalendarDays(new Date(`${input.to}T00:00:00`), from) + 1;
	let days = 0;
	for (let i = 0; i < span; i++) if (input.days.includes(addDays(from, i).getDay())) days++;
	return { perDay, total: perDay * days };
};

const ScheduleDialog = ({ location, onClose }: { location: VenueLocation; onClose: () => void }) => {
	// Carry on from the current schedule, or start today.
	const startFrom =
		location.scheduledUntil && isAfter(new Date(location.scheduledUntil), new Date())
			? new Date(location.scheduledUntil)
			: new Date();
	const [from, setFrom] = useState(ymd(startFrom));
	const [to, setTo] = useState(ymd(addMonths(startFrom, 6)));
	const [days, setDays] = useState([0, 1, 2, 3, 4, 5, 6]);
	const [openTime, setOpenTime] = useState('07:00');
	const [closeTime, setCloseTime] = useState('22:00');
	const [interval, setSlotLength] = useState(60);
	const [price, setPrice] = useState(String(location.basePrice));
	const [peakOn, setPeakOn] = useState(true);
	const [peakPrice, setPeakPrice] = useState(String(Math.round((location.basePrice * 1.25) / 500) * 500));
	const [eveningFrom, setEveningFrom] = useState('17:00');
	const [weekends, setWeekends] = useState(true);
	const [generate, { isLoading }] = useGenerateScheduleMutation();

	const setIntervalAndPrice = (next: number) => {
		setSlotLength(next);
		setPrice(String(Math.round((location.basePrice * next) / 60)));
		setPeakPrice(String(Math.round((location.basePrice * 1.25 * next) / 60 / 500) * 500));
	};

	const input: ScheduleInput = {
		from,
		to,
		days,
		openTime,
		closeTime,
		intervalMinutes: interval,
		price: Number(price),
		peak: peakOn ? { price: Number(peakPrice), eveningFrom: eveningFrom || null, weekends } : null,
	};
	const { perDay, total } = from && to && from <= to ? estimate(input) : { perDay: 0, total: 0 };
	const spanDays = from && to ? differenceInCalendarDays(new Date(to), new Date(from)) : 0;

	const error = !from || !to || from > to
		? 'Pick a date range that ends after it starts.'
		: spanDays > 366
			? 'Generate at most a year at a time.'
			: days.length === 0
				? 'Pick at least one day of the week.'
				: perDay === 0
					? 'Closing time must leave room for at least one slot.'
					: !(Number(price) > 0)
						? 'Add a slot price.'
						: peakOn && !(Number(peakPrice) > 0)
							? 'Add a peak price, or turn peak pricing off.'
							: peakOn && !eveningFrom && !weekends
								? 'Peak pricing needs an evening start time or weekends.'
								: null;

	const save = async () => {
		try {
			const result = await generate({ locationId: location.id, body: input }).unwrap();
			toast.success(
				`${count(result.created)} slots added to ${location.name}.${
					result.skipped ? ` ${count(result.skipped)} skipped because slots already existed.` : ''
				}`
			);
			onClose();
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t generate the schedule.'));
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl p-6'>
				<DialogTitle className='text-lg font-semibold text-primary-black'>Generate schedule · {location.name}</DialogTitle>
				<DialogDescription className='text-sm text-neutral-500'>
					Creates open slots for players and communities to book.{' '}
					{location.scheduledUntil
						? `Slots already run to ${shortDate(location.scheduledUntil)}; existing slots are never changed or doubled.`
						: 'Existing slots are never changed or doubled.'}
				</DialogDescription>

				<div className='flex flex-col gap-4'>
					<div className='grid grid-cols-2 gap-3'>
						<Field label='From'>
							<input type='date' value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
						</Field>
						<Field label='To'>
							<input type='date' value={to} min={from} onChange={(e) => setTo(e.target.value)} className={inputClass} />
						</Field>
					</div>

					<fieldset className='flex flex-col gap-2'>
						<legend className='text-sm font-medium text-neutral-700'>Days open</legend>
						<div className='flex flex-wrap gap-1.5'>
							{WEEKDAYS.map((label, day) => {
								const on = days.includes(day);
								return (
									<button
										key={label}
										type='button'
										aria-pressed={on}
										onClick={() => setDays(on ? days.filter((d) => d !== day) : [...days, day])}
										className={cn(
											'h-9 w-12 rounded-full border text-xs font-semibold transition-colors',
											on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:border-ink'
										)}>
										{label}
									</button>
								);
							})}
						</div>
					</fieldset>

					<div className='grid grid-cols-3 gap-3'>
						<Field label='Opens'>
							<input type='time' step={900} value={openTime} onChange={(e) => setOpenTime(e.target.value)} className={inputClass} />
						</Field>
						<Field label='Closes'>
							<input type='time' step={900} value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={inputClass} />
						</Field>
						<Field label='Slot length'>
							<select value={interval} onChange={(e) => setIntervalAndPrice(Number(e.target.value))} className={inputClass}>
								{INTERVALS.map((value) => (
									<option key={value} value={value}>
										{value} min
									</option>
								))}
							</select>
						</Field>
					</div>

					<Field label='Price per slot (₦)' hint={`Base price is ${naira(location.basePrice)} an hour.`}>
						<input type='number' min={0} step={500} value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
					</Field>

					<div className='flex flex-col gap-3 rounded-2xl bg-[#F7F7F7] p-4'>
						<label className='flex items-center gap-2 text-sm font-medium text-neutral-700'>
							<Switch checked={peakOn} onCheckedChange={setPeakOn} />
							Peak pricing
							<span className='font-normal text-subtle'>· evenings and weekends</span>
						</label>
						{peakOn && (
							<>
								<div className='grid grid-cols-2 gap-3'>
									<Field label='Peak price per slot (₦)'>
										<input
											type='number'
											min={0}
											step={500}
											value={peakPrice}
											onChange={(e) => setPeakPrice(e.target.value)}
											className={inputClass}
										/>
									</Field>
									<Field label='Evenings from' hint='Clear for weekends only.'>
										<input
											type='time'
											step={900}
											value={eveningFrom}
											onChange={(e) => setEveningFrom(e.target.value)}
											className={inputClass}
										/>
									</Field>
								</div>
								<label className='flex items-center gap-2 text-sm font-medium text-neutral-700'>
									<Switch checked={weekends} onCheckedChange={setWeekends} />
									All day Saturday and Sunday
								</label>
							</>
						)}
					</div>

					{!error && (
						<p className='rounded-2xl bg-brand-soft px-4 py-3 text-sm text-ink'>
							Up to <span className='font-semibold'>{count(total)} slots</span> ({perDay} a day). You can reprice or
							block any of them on the calendar afterwards.
						</p>
					)}
				</div>

				{error && <p className='text-xs text-danger'>{error}</p>}
				<div className='mt-2 flex gap-3'>
					<button type='button' onClick={onClose} className={cancelButtonClass}>
						Cancel
					</button>
					<LoadingButton variant='secondary' loading={isLoading} disabled={!!error} onClick={save} className='flex-1'>
						Generate slots
					</LoadingButton>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default ScheduleDialog;
