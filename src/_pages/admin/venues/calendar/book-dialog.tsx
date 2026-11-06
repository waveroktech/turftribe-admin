import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useCreateManualBookingMutation } from '@/features/venues/venuesApi';
import { useGetAdminCommunitiesQuery } from '@/features/admin/adminApi';
import type { BookerType, Slot, VenueLocation } from '@/features/venues/types';
import { useDebounce } from '@/hooks/useDebounce';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import LoadingButton from '@/components/ui/loading-button';
import { cancelButtonClass, errorMessage, inputClass, naira } from '../../shared';
import { BOOKER_LABEL, Field, textareaClass } from '../shared';

/** Slots a manual booking can cover: open, upcoming, one location, back to back. */
export const bookableRun = (slots: Slot[]) => {
	const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));
	const ok =
		sorted.length > 0 &&
		sorted.every((s) => s.status === 'open' && new Date(s.start) > new Date()) &&
		new Set(sorted.map((s) => s.locationId)).size === 1 &&
		sorted.every((s, i) => i === 0 || sorted[i - 1].end === s.start);
	return ok ? sorted : null;
};

/*
 * Walk-ins and phone bookings, so the TurfTriibe calendar stays the single
 * source of truth. Paid at the venue, so no TurfTriibe fee is taken.
 */
const BookDialog = ({ slots, location, onClose }: { slots: Slot[]; location: VenueLocation; onClose: () => void }) => {
	const [type, setType] = useState<BookerType>('community');
	const [name, setName] = useState('');
	const [communityId, setCommunityId] = useState<string | null>(null);
	const [contactName, setContactName] = useState('');
	const [phone, setPhone] = useState('');
	const [email, setEmail] = useState('');
	const total = slots.reduce((sum, slot) => sum + slot.price, 0);
	const [amount, setAmount] = useState(String(total));
	const [note, setNote] = useState('');
	const [repeat, setRepeat] = useState(false);
	const [weeks, setWeeks] = useState('8');
	const [create, { isLoading }] = useCreateManualBookingMutation();

	const search = useDebounce(name, 300);
	const { data: communities } = useGetAdminCommunitiesQuery(
		{ q: search, limit: 8 },
		{ skip: type !== 'community' || search.trim().length < 2 }
	);
	const matches = communities?.data ?? [];

	const first = slots[0];
	const last = slots[slots.length - 1];
	const weeksNumber = repeat ? Number(weeks) : 1;

	const error = !name.trim()
		? type === 'community'
			? 'Name the community.'
			: 'Add the booker’s name.'
		: !phone.trim()
			? 'Add a phone number so the venue can reach them.'
			: !(Number(amount) >= 0)
				? 'Enter the amount agreed (0 if free).'
				: repeat && !(Number.isInteger(weeksNumber) && weeksNumber >= 2 && weeksNumber <= 52)
					? 'Repeat for 2 to 52 weeks.'
					: null;

	const save = async () => {
		try {
			const result = await create({
				slotIds: slots.map((s) => s.id),
				bookedBy: {
					type,
					id: type === 'community' ? communityId : null,
					name: name.trim(),
					contactName: (contactName || name).trim(),
					phone: phone.trim(),
					email: email.trim() || null,
				},
				amount: Number(amount),
				note: note.trim() || null,
				weeks: weeksNumber,
			}).unwrap();
			const skipped = result.skippedWeeks.length;
			toast.success(
				`${result.created} booking${result.created === 1 ? '' : 's'} added for ${name.trim()}.${
					skipped
						? ` ${skipped} week${skipped === 1 ? ' was' : 's were'} already taken: ${result.skippedWeeks
								.map((d) => format(new Date(`${d}T00:00:00`), 'd MMM'))
								.join(', ')}.`
						: ''
				}`
			);
			onClose();
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t book those slots.'));
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl p-6'>
				<DialogTitle className='text-lg font-semibold text-primary-black'>Book manually</DialogTitle>
				<DialogDescription className='text-sm text-neutral-500'>
					{location.name} · {format(new Date(first.start), 'EEE d MMM')}, {format(new Date(first.start), 'HH:mm')}–
					{format(new Date(last.end), 'HH:mm')}. For walk-ins and phone bookings paid at the venue; no TurfTriibe fee is
					taken.
				</DialogDescription>

				<div className='flex flex-col gap-4'>
					<div className='flex gap-2'>
						{(Object.keys(BOOKER_LABEL) as BookerType[]).map((value) => (
							<button
								key={value}
								type='button'
								aria-pressed={type === value}
								onClick={() => {
									setType(value);
									setCommunityId(null);
								}}
								className={cn(
									'flex-1 rounded-full border px-3 py-2 text-xs font-semibold transition-colors',
									type === value ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:border-ink'
								)}>
								{BOOKER_LABEL[value]}
							</button>
						))}
					</div>

					<Field
						label={type === 'community' ? 'Community' : 'Name'}
						hint={
							type === 'community'
								? communityId
									? 'Linked to the TurfTriibe community, so its game can be created on this slot.'
									: 'Pick a TurfTriibe community to link it, or type any name.'
								: undefined
						}>
						<input
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								setCommunityId(null);
							}}
							className={inputClass}
						/>
					</Field>
					{type === 'community' && !communityId && matches.length > 0 && (
						<ul className='-mt-2 flex flex-wrap gap-1.5'>
							{matches.map((community) => (
								<li key={community.id}>
									<button
										type='button'
										onClick={() => {
											setName(community.name);
											setCommunityId(community.id);
											if (community.manager) {
												setContactName(community.manager.name);
												setEmail(community.manager.email);
											}
										}}
										className='rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink hover:border-ink'>
										{community.name}
									</button>
								</li>
							))}
						</ul>
					)}

					<div className='grid gap-3 sm:grid-cols-2'>
						{type === 'community' && (
							<Field label='Contact person'>
								<input value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputClass} />
							</Field>
						)}
						<Field label='Phone'>
							<input type='tel' value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
						</Field>
						<Field label='Email (optional)'>
							<input type='email' value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
						</Field>
					</div>

					<Field label='Amount agreed (₦)' hint={`Listed price ${naira(total)} for ${slots.length} slot${slots.length === 1 ? '' : 's'}.`}>
						<input type='number' min={0} step={500} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
					</Field>

					<div className='flex flex-col gap-3 rounded-2xl bg-[#F7F7F7] p-4'>
						<label className='flex items-center gap-2 text-sm font-medium text-neutral-700'>
							<Switch checked={repeat} onCheckedChange={setRepeat} />
							Repeat weekly
							<span className='font-normal text-subtle'>· same time every {format(new Date(first.start), 'EEEE')}</span>
						</label>
						{repeat && (
							<Field label='For how many weeks (including this one)' hint='Weeks where any of these slots is taken are skipped.'>
								<input type='number' min={2} max={52} value={weeks} onChange={(e) => setWeeks(e.target.value)} className={inputClass} />
							</Field>
						)}
					</div>

					<Field label='Note (optional)'>
						<textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder='e.g. Pays at the gate' className={textareaClass} />
					</Field>
				</div>

				{error && <p className='text-xs text-danger'>{error}</p>}
				<div className='mt-2 flex gap-3'>
					<button type='button' onClick={onClose} className={cancelButtonClass}>
						Cancel
					</button>
					<LoadingButton variant='secondary' loading={isLoading} disabled={!!error} onClick={save} className='flex-1'>
						{repeat ? `Book ${weeksNumber || ''} weeks` : 'Book'}
					</LoadingButton>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default BookDialog;
