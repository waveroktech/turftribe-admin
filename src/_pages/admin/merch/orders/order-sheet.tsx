import { useState } from 'react';
import { toast } from 'sonner';
import { formatDistanceToNowStrict, isPast } from 'date-fns';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useUpdateOrderStatusMutation } from '@/features/merch/merchApi';
import type { MerchOrder, OrderStatus } from '@/features/merch/types';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';

import LoadingButton from '@/components/ui/loading-button';
import { Pill, SheetCloseButton, cancelButtonClass, dateTime, errorMessage, inputClass, naira } from '../../shared';
import { NEXT_ORDER_STATUS, ORDER_STATUS_TONE, canCancelOrder, orderStatusLabel } from '../shared';

const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
	confirmed: 'Mark confirmed',
	dispatched: 'Mark dispatched',
	delivered: 'Mark delivered',
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<section className='flex flex-col gap-2'>
		<h3 className='text-[11px] font-semibold uppercase tracking-wide text-subtle'>{title}</h3>
		{children}
	</section>
);

export const ConfirmWindow = ({ order }: { order: MerchOrder }) => {
	if (order.status !== 'awaiting_confirmation') return null;
	const late = isPast(new Date(order.confirmBy));
	return (
		<span className={late ? 'text-danger' : 'text-[#8A5A00]'}>
			<Clock className='mr-1 inline h-3.5 w-3.5 align-[-2px]' />
			{late ? 'Auto-cancelling' : `Confirm within ${formatDistanceToNowStrict(new Date(order.confirmBy))}`}
		</span>
	);
};

const OrderSheet = ({ order, onClose }: { order: MerchOrder; onClose: () => void }) => {
	const [updateStatus, { isLoading, originalArgs }] = useUpdateOrderStatusMutation();
	const [cancelling, setCancelling] = useState(false);
	const [note, setNote] = useState('');

	const next = NEXT_ORDER_STATUS[order.status];

	const change = async (status: OrderStatus) => {
		try {
			await updateStatus({ id: order.id, status, note: note.trim() || undefined }).unwrap();
			toast.success(
				status === 'cancelled'
					? `Order ${order.reference} cancelled. The buyer is refunded and stock restored.`
					: `Order ${order.reference} is now ${orderStatusLabel(status).toLowerCase()}. The buyer has been notified.`
			);
			onClose();
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t update the order.'));
		}
	};

	return (
		<Sheet open onOpenChange={(open) => !open && onClose()}>
			<SheetContent className='flex w-full flex-col gap-0 overflow-hidden bg-[#F7F7F7] p-0 sm:max-w-md'>
				<SheetCloseButton />
				<div className='flex-1 overflow-y-auto p-6'>
					<header className='flex flex-col gap-1 pr-10'>
						<SheetTitle className='font-mono text-base font-bold text-ink'>{order.reference}</SheetTitle>
						<SheetDescription className='flex flex-wrap items-center gap-2 text-xs text-subtle'>
							<Pill tone={ORDER_STATUS_TONE[order.status]}>{orderStatusLabel(order.status)}</Pill>
							<span>{dateTime(order.createdAt)}</span>
							<span>· Sold by {order.vendor.name}</span>
						</SheetDescription>
						<p className='text-xs'>
							<ConfirmWindow order={order} />
						</p>
					</header>

					<div className='mt-6 flex flex-col gap-6'>
						<Section title='Items'>
							<ul className='flex flex-col divide-y divide-line/70 rounded-2xl bg-surface-raised ring-1 ring-black/[0.06]'>
								{order.items.map((item) => (
									<li key={item.variantId} className='flex items-start justify-between gap-3 px-4 py-3 text-sm'>
										<div className='min-w-0'>
											<p className='truncate font-semibold text-ink'>{item.name}</p>
											<p className='text-xs text-subtle'>
												{item.size} · {item.colour} · <span className='font-mono'>{item.sku}</span>
											</p>
										</div>
										<p className='shrink-0 text-right tabular-nums'>
											{item.quantity} × {naira(item.unitPrice)}
										</p>
									</li>
								))}
							</ul>
							<dl className='grid grid-cols-2 gap-y-1 rounded-2xl bg-surface-raised px-4 py-3 text-sm ring-1 ring-black/[0.06]'>
								<dt className='text-subtle'>Subtotal</dt>
								<dd className='text-right tabular-nums'>{naira(order.subtotal)}</dd>
								<dt className='text-subtle'>Delivery</dt>
								<dd className='text-right tabular-nums'>{naira(order.deliveryFee)}</dd>
								<dt className='font-semibold text-ink'>Paid</dt>
								<dd className='text-right font-semibold tabular-nums'>{naira(order.total)}</dd>
								<dt className='mt-2 border-t border-line/70 pt-2 text-subtle'>TurfTribe commission</dt>
								<dd className='mt-2 border-t border-line/70 pt-2 text-right tabular-nums'>{naira(order.commission)}</dd>
								<dt className='text-subtle'>To {order.vendor.name}</dt>
								<dd className='text-right tabular-nums'>{naira(order.vendorShare)}</dd>
							</dl>
						</Section>

						<Section title='Deliver to'>
							<ul className='flex flex-col gap-2 text-sm text-ink'>
								<li className='font-semibold capitalize'>{order.buyer.name}</li>
								<li className='flex items-start gap-2'>
									<MapPin className='mt-0.5 h-4 w-4 shrink-0 text-subtle' />
									<span>{order.deliveryAddress}</span>
								</li>
								<li className='flex items-center gap-2'>
									<Phone className='h-4 w-4 text-subtle' />
									<a href={`tel:${order.buyer.phone}`} className='hover:underline'>
										{order.buyer.phone}
									</a>
								</li>
								<li className='flex items-center gap-2'>
									<Mail className='h-4 w-4 text-subtle' />
									<a href={`mailto:${order.buyer.email}`} className='truncate hover:underline'>
										{order.buyer.email}
									</a>
								</li>
							</ul>
						</Section>

						<Section title='Timeline'>
							<ol className='flex flex-col gap-3 border-l-2 border-line pl-4'>
								{order.history.map((entry, index) => (
									<li key={index} className='relative text-sm'>
										<span className='absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-ink' />
										<p className='font-semibold text-ink'>{orderStatusLabel(entry.status)}</p>
										<p className='text-xs text-subtle'>
											{dateTime(entry.at)}
											{entry.by && ` · ${entry.by}`}
										</p>
										{entry.note && <p className='mt-0.5 text-xs text-ink'>{entry.note}</p>}
									</li>
								))}
							</ol>
						</Section>
					</div>
				</div>

				{(next || canCancelOrder(order.status)) && (
					<footer className='flex flex-col gap-3 border-t border-line bg-white p-4'>
						<p className='text-xs text-subtle'>Updating on {order.vendor.name}’s behalf. The buyer is notified of each change.</p>
						<label className='text-xs font-medium text-neutral-700'>
							Note (optional)
							<input
								value={note}
								onChange={(e) => setNote(e.target.value)}
								placeholder={cancelling ? 'Why it’s cancelled, e.g. out of stock' : 'e.g. rider name, tracking'}
								maxLength={200}
								className={inputClass.replace('h-12', 'h-11')}
							/>
						</label>
						{cancelling ? (
							<div className='flex flex-col gap-2'>
								<p className='rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger'>
									The buyer is refunded in full and the stock goes back on sale. This can’t be undone.
								</p>
								<div className='flex gap-3'>
									<button type='button' onClick={() => setCancelling(false)} className={cancelButtonClass}>
										Keep order
									</button>
									<LoadingButton
										variant='destructive'
										loading={isLoading && originalArgs?.status === 'cancelled'}
										onClick={() => change('cancelled')}
										className='flex-1'>
										Cancel and refund
									</LoadingButton>
								</div>
							</div>
						) : (
							<div className='flex gap-3'>
								{canCancelOrder(order.status) && (
									<button type='button' onClick={() => setCancelling(true)} className={cancelButtonClass}>
										Cancel order
									</button>
								)}
								{next && (
									<LoadingButton
										variant='secondary'
										loading={isLoading && originalArgs?.status === next}
										onClick={() => change(next)}
										className='flex-1'>
										{ACTION_LABEL[next]}
									</LoadingButton>
								)}
							</div>
						)}
					</footer>
				)}
			</SheetContent>
		</Sheet>
	);
};

export default OrderSheet;
