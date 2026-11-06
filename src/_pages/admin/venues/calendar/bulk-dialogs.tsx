import { useState } from 'react';
import { toast } from 'sonner';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { useBlockDaysMutation, useUpdateSlotsMutation } from '@/features/venues/venuesApi';
import type { SlotActionResult, VenueLocation } from '@/features/venues/types';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

import LoadingButton from '@/components/ui/loading-button';
import { cancelButtonClass, errorMessage, inputClass } from '../../shared';
import { Field } from '../shared';

export const resultMessage = (result: SlotActionResult, verb: string) =>
	`${result.updated} slot${result.updated === 1 ? '' : 's'} ${verb}.${
		result.skipped ? ` ${result.skipped} skipped (booked, past or already changed).` : ''
	}`;

const Shell = ({
	title,
	description,
	error,
	loading,
	action,
	onSubmit,
	onClose,
	children,
}: {
	title: string;
	description: string;
	error: string | null;
	loading: boolean;
	action: string;
	onSubmit: () => void;
	onClose: () => void;
	children: React.ReactNode;
}) => (
	<Dialog open onOpenChange={(open) => !open && onClose()}>
		<DialogContent className='max-w-md rounded-3xl p-6'>
			<DialogTitle className='text-lg font-semibold text-primary-black'>{title}</DialogTitle>
			<DialogDescription className='text-sm text-neutral-500'>{description}</DialogDescription>
			<div className='flex flex-col gap-4'>{children}</div>
			{error && <p className='text-xs text-danger'>{error}</p>}
			<div className='mt-2 flex gap-3'>
				<button type='button' onClick={onClose} className={cancelButtonClass}>
					Cancel
				</button>
				<LoadingButton variant='secondary' loading={loading} disabled={!!error} onClick={onSubmit} className='flex-1'>
					{action}
				</LoadingButton>
			</div>
		</DialogContent>
	</Dialog>
);

export const RepriceDialog = ({ ids, onClose }: { ids: string[]; onClose: (done: boolean) => void }) => {
	const [price, setPrice] = useState('');
	const [update, { isLoading }] = useUpdateSlotsMutation();
	const error = !(Number(price) > 0) ? 'Enter the new price per slot.' : null;

	const submit = async () => {
		try {
			const result = await update({ action: 'reprice', ids, price: Number(price) }).unwrap();
			toast.success(resultMessage(result, 'repriced'));
			onClose(true);
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t reprice those slots.'));
		}
	};

	return (
		<Shell
			title={`Reprice ${ids.length} slot${ids.length === 1 ? '' : 's'}`}
			description='Only open, upcoming slots change. Booked slots keep the price that was paid.'
			error={error}
			loading={isLoading}
			action='Set price'
			onSubmit={submit}
			onClose={() => onClose(false)}>
			<Field label='Price per slot (₦)'>
				<input type='number' min={0} step={500} autoFocus value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
			</Field>
		</Shell>
	);
};

export const BlockDialog = ({ ids, onClose }: { ids: string[]; onClose: (done: boolean) => void }) => {
	const [reason, setReason] = useState('');
	const [update, { isLoading }] = useUpdateSlotsMutation();

	const submit = async () => {
		try {
			const result = await update({ action: 'block', ids, reason: reason.trim() }).unwrap();
			toast.success(resultMessage(result, 'blocked'));
			onClose(true);
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t block those slots.'));
		}
	};

	return (
		<Shell
			title={`Block ${ids.length} slot${ids.length === 1 ? '' : 's'}`}
			description='Blocked slots show as unavailable to players and communities. Only open, upcoming slots are blocked.'
			error={null}
			loading={isLoading}
			action='Block'
			onSubmit={submit}
			onClose={() => onClose(false)}>
			<Field label='Reason (internal)'>
				<input autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder='e.g. Maintenance' className={inputClass} />
			</Field>
		</Shell>
	);
};

/** Public holidays and maintenance: every open slot on the chosen days. */
export const BlockDaysDialog = ({
	locations,
	defaultDate,
	onClose,
}: {
	locations: VenueLocation[];
	defaultDate: Date;
	onClose: () => void;
}) => {
	const [from, setFrom] = useState(format(defaultDate, 'yyyy-MM-dd'));
	const [to, setTo] = useState(format(defaultDate, 'yyyy-MM-dd'));
	const [chosen, setChosen] = useState<string[]>(locations.map((l) => l.id));
	const [reason, setReason] = useState('');
	const [blockDays, { isLoading }] = useBlockDaysMutation();

	const span = from && to ? differenceInCalendarDays(new Date(to), new Date(from)) + 1 : 0;
	const error =
		span < 1
			? 'Pick a date range that ends after it starts.'
			: span > 62
				? 'Block at most two months at a time.'
				: chosen.length === 0
					? 'Pick at least one location.'
					: !reason.trim()
						? 'Add a reason, e.g. “Independence Day”.'
						: null;

	const submit = async () => {
		const start = new Date(`${from}T00:00:00`);
		const dates = Array.from({ length: span }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'));
		try {
			const result = await blockDays({ locationIds: chosen, dates, reason: reason.trim() }).unwrap();
			toast.success(resultMessage(result, 'blocked'));
			onClose();
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t block those days.'));
		}
	};

	return (
		<Shell
			title='Block whole days'
			description='Blocks every open slot on these days. Booked slots are left alone; cancel them one by one if needed.'
			error={error}
			loading={isLoading}
			action='Block days'
			onSubmit={submit}
			onClose={onClose}>
			<div className='grid grid-cols-2 gap-3'>
				<Field label='From'>
					<input type='date' value={from} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
				</Field>
				<Field label='To'>
					<input type='date' value={to} min={from} onChange={(e) => setTo(e.target.value)} className={inputClass} />
				</Field>
			</div>
			<fieldset className='flex flex-col gap-2'>
				<legend className='text-sm font-medium text-neutral-700'>Locations</legend>
				{locations.map((location) => (
					<label key={location.id} className='flex items-center gap-2 text-sm text-ink'>
						<input
							type='checkbox'
							checked={chosen.includes(location.id)}
							onChange={(e) =>
								setChosen(e.target.checked ? [...chosen, location.id] : chosen.filter((id) => id !== location.id))
							}
							className='h-4 w-4 accent-[#111]'
						/>
						{location.name}
					</label>
				))}
			</fieldset>
			<Field label='Reason'>
				<input value={reason} onChange={(e) => setReason(e.target.value)} placeholder='e.g. Public holiday' className={inputClass} />
			</Field>
		</Shell>
	);
};
