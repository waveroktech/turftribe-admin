import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Ban, CalendarPlus, Mail, Phone, Repeat, Undo2 } from 'lucide-react';
import { useUpdateSlotsMutation } from '@/features/venues/venuesApi';
import type { Slot, VenueLocation } from '@/features/venues/types';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';

import LoadingButton from '@/components/ui/loading-button';
import { SheetCloseButton, cancelButtonClass, dateTime, errorMessage, inputClass, naira } from '../../shared';
import { BOOKER_LABEL, Field, SLOT_STATUS, linkButtonClass, sportLabel, textareaClass, timeRange } from '../shared';
import { resultMessage } from './bulk-dialogs';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<section className='flex flex-col gap-2'>
		<h3 className='text-[11px] font-semibold uppercase tracking-wide text-subtle'>{title}</h3>
		{children}
	</section>
);

const SlotSheet = ({
	slot,
	location,
	selected,
	onToggleSelect,
	onBook,
	onClose,
}: {
	slot: Slot;
	location: VenueLocation;
	selected: boolean;
	onToggleSelect: () => void;
	onBook: () => void;
	onClose: () => void;
}) => {
	const [update, { isLoading }] = useUpdateSlotsMutation();
	const [price, setPrice] = useState(String(slot.price));
	const [reason, setReason] = useState('');
	const [cancelling, setCancelling] = useState(false);
	const [reopen, setReopen] = useState(true);
	const [note, setNote] = useState('');

	const upcoming = new Date(slot.start) > new Date();
	const status = SLOT_STATUS[slot.status];
	const booking = slot.booking;

	const run = async (action: Parameters<typeof update>[0], verb: string) => {
		try {
			const result = await update(action).unwrap();
			if (result.updated === 0) toast.error('Nothing changed: the slot may have been booked or already started.');
			else toast.success(resultMessage(result, verb));
			onClose();
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t update the slot.'));
		}
	};

	return (
		<Sheet open onOpenChange={(open) => !open && onClose()}>
			<SheetContent className='flex w-full flex-col gap-0 overflow-hidden bg-[#F7F7F7] p-0 sm:max-w-md'>
				<SheetCloseButton />
				<div className='flex-1 overflow-y-auto p-6'>
					<header className='flex flex-col gap-1 pr-10'>
						<SheetTitle className='text-base font-bold text-ink'>{location.name}</SheetTitle>
						<SheetDescription className='flex flex-wrap items-center gap-2 text-xs text-subtle'>
							<span className='inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-0.5 font-semibold text-ink ring-1 ring-black/[0.06]'>
								<span className={`h-2 w-2 rounded-full ${status.dot}`} />
								{status.label}
							</span>
							<span>
								{format(new Date(slot.start), 'EEE d MMM yyyy')} · {timeRange(slot.start, slot.end)}
							</span>
							<span>· {sportLabel(location.sport)}</span>
						</SheetDescription>
					</header>

					<div className='mt-6 flex flex-col gap-6'>
						<Section title='Price'>
							<p className='text-2xl font-bold tabular-nums text-ink'>{naira(slot.price)}</p>
							{slot.status === 'blocked' && (
								<p className='text-sm text-subtle'>Blocked{slot.blockReason ? `: ${slot.blockReason}` : ''}.</p>
							)}
						</Section>

						{booking && (
							<Section title={slot.status === 'cancelled' ? 'Cancelled booking' : 'Booked by'}>
								<div className='flex flex-col gap-2 rounded-2xl bg-surface-raised px-4 py-3 text-sm ring-1 ring-black/[0.06]'>
									<p className='font-semibold text-ink'>
										{booking.bookedBy.name}{' '}
										<span className='font-normal text-subtle'>· {BOOKER_LABEL[booking.bookedBy.type]}</span>
									</p>
									{booking.bookedBy.contactName !== booking.bookedBy.name && (
										<p className='text-subtle'>Contact: {booking.bookedBy.contactName}</p>
									)}
									<p className='flex items-center gap-2'>
										<Phone className='h-4 w-4 text-subtle' />
										<a href={`tel:${booking.bookedBy.phone}`} className='hover:underline'>
											{booking.bookedBy.phone}
										</a>
									</p>
									{booking.bookedBy.email && (
										<p className='flex items-center gap-2'>
											<Mail className='h-4 w-4 text-subtle' />
											<a href={`mailto:${booking.bookedBy.email}`} className='hover:underline'>
												{booking.bookedBy.email}
											</a>
										</p>
									)}
								</div>
								<dl className='grid grid-cols-2 gap-y-1 rounded-2xl bg-surface-raised px-4 py-3 text-sm ring-1 ring-black/[0.06]'>
									<dt className='text-subtle'>Reference</dt>
									<dd className='text-right font-mono text-xs'>{booking.reference}</dd>
									<dt className='text-subtle'>{booking.source === 'online' ? 'Paid online' : 'Agreed (paid at venue)'}</dt>
									<dd className='text-right tabular-nums'>{naira(booking.amount)}</dd>
									{booking.source === 'online' && (
										<>
											<dt className='text-subtle'>TurfTriibe fee</dt>
											<dd className='text-right tabular-nums'>{naira(booking.fee)}</dd>
										</>
									)}
									<dt className='text-subtle'>Game</dt>
									<dd className='text-right'>{booking.game?.title ?? 'Not created yet'}</dd>
									<dt className='text-subtle'>Booked</dt>
									<dd className='text-right'>{dateTime(booking.createdAt)}</dd>
								</dl>
								{booking.recurring && (
									<p className='flex items-center gap-1.5 text-xs text-subtle'>
										<Repeat className='h-3.5 w-3.5' />
										Weekly booking, {booking.recurring.index} of {booking.recurring.total}
									</p>
								)}
								{booking.note && <p className='text-xs text-subtle'>Note: {booking.note}</p>}
							</Section>
						)}

						{(slot.status === 'in_progress' || slot.status === 'completed') && (
							<p className='rounded-2xl bg-black/[0.04] px-4 py-3 text-xs text-subtle'>
								{slot.status === 'completed'
									? 'Completed slots are locked and can’t be changed.'
									: 'This slot has started, so it can’t be changed.'}
							</p>
						)}

						{slot.status === 'open' && upcoming && (
							<>
								<Section title='Book'>
									<div className='flex flex-wrap gap-2'>
										<button onClick={onBook} className={linkButtonClass}>
											<CalendarPlus className='h-3.5 w-3.5' />
											Book manually
										</button>
										<button onClick={onToggleSelect} className={linkButtonClass}>
											{selected ? 'Remove from selection' : 'Add to selection'}
										</button>
									</div>
									<p className='text-xs text-subtle'>
										To book several slots in a row, drag across them on the calendar (or add each to the selection).
									</p>
								</Section>
								<Section title='Reprice'>
									<div className='flex gap-2'>
										<input
											type='number'
											min={0}
											step={500}
											value={price}
											onChange={(e) => setPrice(e.target.value)}
											aria-label='New price'
											className={`${inputClass} mt-0`}
										/>
										<LoadingButton
											variant='secondary'
											loading={isLoading}
											disabled={!(Number(price) > 0) || Number(price) === slot.price}
											onClick={() => run({ action: 'reprice', ids: [slot.id], price: Number(price) }, 'repriced')}
											className='h-12 shrink-0 px-5'>
											Save
										</LoadingButton>
									</div>
								</Section>
								<Section title='Block'>
									<div className='flex gap-2'>
										<input
											value={reason}
											onChange={(e) => setReason(e.target.value)}
											placeholder='Reason, e.g. Maintenance'
											className={`${inputClass} mt-0`}
										/>
										<button
											disabled={isLoading}
											onClick={() => run({ action: 'block', ids: [slot.id], reason: reason.trim() }, 'blocked')}
											className='inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink hover:border-ink'>
											<Ban className='h-4 w-4' />
											Block
										</button>
									</div>
								</Section>
							</>
						)}

						{(slot.status === 'blocked' || slot.status === 'cancelled') && upcoming && (
							<div className='flex flex-wrap gap-2'>
								<button
									disabled={isLoading}
									onClick={() => run({ action: 'reopen', ids: [slot.id] }, 'reopened')}
									className={linkButtonClass}>
									<Undo2 className='h-3.5 w-3.5' />
									Reopen for booking
								</button>
								{slot.status === 'blocked' && (
									<button onClick={onToggleSelect} className={linkButtonClass}>
										{selected ? 'Remove from selection' : 'Add to selection'}
									</button>
								)}
							</div>
						)}

						{slot.status === 'booked' && booking && (
							<Section title='Cancel booking'>
								{cancelling ? (
									<div className='flex flex-col gap-3 rounded-2xl bg-surface-raised p-4 ring-1 ring-black/[0.06]'>
										<p className='text-sm text-ink'>
											Cancels {booking.reference} on every slot it covers.
											{booking.source === 'online' && ` ${naira(booking.amount)} is refunded to ${booking.bookedBy.name}.`}
											{booking.game && ' Its game is cancelled and players are refunded.'}
										</p>
										<label className='flex items-center gap-2 text-sm font-medium text-neutral-700'>
											<Switch checked={reopen} onCheckedChange={setReopen} />
											Put the slots back on sale
										</label>
										<Field label='Note (optional)'>
											<textarea value={note} onChange={(e) => setNote(e.target.value)} className={textareaClass} />
										</Field>
										<div className='flex gap-3'>
											<button type='button' onClick={() => setCancelling(false)} className={cancelButtonClass}>
												Keep it
											</button>
											<LoadingButton
												variant='destructive'
												loading={isLoading}
												onClick={() =>
													run({ action: 'cancel', ids: [slot.id], reopen, note: note.trim() || undefined }, 'cancelled')
												}
												className='h-12 flex-1 rounded-full'>
												Cancel booking
											</LoadingButton>
										</div>
									</div>
								) : (
									<button
										onClick={() => setCancelling(true)}
										className='self-start rounded-full border border-danger/40 bg-white px-3 py-1.5 text-xs font-semibold text-danger hover:border-danger'>
										Cancel this booking…
									</button>
								)}
							</Section>
						)}
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
};

export default SlotSheet;
