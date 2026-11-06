'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { AlertTriangle, FileText, Pencil, Plus } from 'lucide-react';
import {
	useCreateVendorMutation,
	useGetVendorsQuery,
	useLazyGetOrdersQuery,
	useUpdateVendorMutation,
} from '@/features/merch/merchApi';
import type { OrdersSummary, Vendor, VendorInput } from '@/features/merch/types';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

import NavWrapper from '@/shared/nav-wrapper';
import LoadingButton from '@/components/ui/loading-button';
import { downloadOrdersCsv, exportParams } from '../orders/export';
import {
	AdminQueryState,
	EmptyRows,
	Pill,
	RowsSkeleton,
	cancelButtonClass,
	count,
	errorMessage,
	inputClass,
	naira,
} from '../../shared';
import { DemoBanner, percent, primaryButtonClass } from '../shared';

const DEFAULT_COMMISSION = 15;
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
// Paystack subaccount codes look like ACCT_xxxxxxxx.
const isSubaccount = (value: string) => /^ACCT_[a-z0-9]+$/i.test(value.trim());

const VendorDialog = ({ vendor, onClose }: { vendor: Vendor | null; onClose: () => void }) => {
	const [draft, setDraft] = useState<VendorInput>(() =>
		vendor
			? {
					name: vendor.name,
					contactEmail: vendor.contactEmail,
					commissionRate: vendor.commissionRate,
					paystackSubaccountCode: vendor.paystackSubaccountCode,
					status: vendor.status,
				}
			: { name: '', contactEmail: '', commissionRate: DEFAULT_COMMISSION, paystackSubaccountCode: null, status: 'active' }
	);
	const [createVendor, { isLoading: creating }] = useCreateVendorMutation();
	const [updateVendor, { isLoading: updating }] = useUpdateVendorMutation();

	const subaccount = draft.paystackSubaccountCode?.trim() ?? '';
	const error = !draft.name.trim()
		? 'Give the vendor a name.'
		: !isEmail(draft.contactEmail)
			? 'Add the email new orders are sent to.'
			: !(draft.commissionRate >= 0 && draft.commissionRate <= 100)
				? 'Commission must be between 0% and 100%.'
				: subaccount && !isSubaccount(subaccount)
					? 'Paystack subaccount codes look like ACCT_xxxxxxxx.'
					: null;

	const save = async () => {
		const body: VendorInput = {
			...draft,
			name: draft.name.trim(),
			contactEmail: draft.contactEmail.trim(),
			paystackSubaccountCode: subaccount || null,
		};
		try {
			if (vendor) await updateVendor({ id: vendor.id, body }).unwrap();
			else await createVendor(body).unwrap();
			toast.success(`${body.name} ${vendor ? 'updated' : 'added'}.`);
			onClose();
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t save the vendor.'));
		}
	};

	const set = <K extends keyof VendorInput>(field: K, value: VendorInput[K]) =>
		setDraft((current) => ({ ...current, [field]: value }));

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='max-w-md rounded-3xl p-6'>
				<DialogTitle className='text-lg font-semibold text-primary-black'>
					{vendor ? `Edit ${vendor.name}` : 'Add a vendor'}
				</DialogTitle>
				<DialogDescription className='text-sm text-neutral-500'>
					At checkout the payment is split: the commission stays with TurfTribe and the rest settles to the
					vendor’s Paystack subaccount.
				</DialogDescription>

				<div className='flex flex-col gap-4'>
					<label className='block text-sm font-medium text-neutral-700'>
						Name
						<input value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder='e.g. Smileys' className={inputClass} />
					</label>
					<label className='block text-sm font-medium text-neutral-700'>
						Order email
						<input
							type='email'
							value={draft.contactEmail}
							onChange={(e) => set('contactEmail', e.target.value)}
							placeholder='orders@vendor.com'
							className={inputClass}
						/>
						<span className='mt-1 block text-xs text-subtle'>Each new order, with SKUs, is emailed here.</span>
					</label>
					<label className='block text-sm font-medium text-neutral-700'>
						Default commission (%)
						<input
							type='number'
							min={0}
							max={100}
							step={0.5}
							value={draft.commissionRate}
							onChange={(e) => set('commissionRate', Number(e.target.value))}
							className={inputClass}
						/>
						<span className='mt-1 block text-xs text-subtle'>Products can override this in their editor.</span>
					</label>
					<label className='block text-sm font-medium text-neutral-700'>
						Paystack subaccount code
						<input
							value={draft.paystackSubaccountCode ?? ''}
							onChange={(e) => set('paystackSubaccountCode', e.target.value)}
							placeholder='ACCT_xxxxxxxx'
							className={`${inputClass} font-mono`}
						/>
						<span className='mt-1 block text-xs text-subtle'>
							Create it in the Paystack dashboard first. Checkout is blocked until this is set.
						</span>
					</label>
					<label className='flex items-center gap-2 text-sm font-medium text-neutral-700'>
						<Switch
							checked={draft.status === 'active'}
							onCheckedChange={(checked) => set('status', checked ? 'active' : 'inactive')}
						/>
						Active
						<span className='font-normal text-subtle'>· inactive hides all of the vendor’s products</span>
					</label>
				</div>

				{error && <p className='text-xs text-danger'>{error}</p>}
				<div className='mt-2 flex gap-3'>
					<button type='button' onClick={onClose} className={cancelButtonClass}>
						Cancel
					</button>
					<LoadingButton variant='secondary' loading={creating || updating} disabled={!!error} onClick={save} className='flex-1'>
						{vendor ? 'Save changes' : 'Add vendor'}
					</LoadingButton>
				</div>
			</DialogContent>
		</Dialog>
	);
};

// Months on offer for a statement: this one and the eleven before it.
const statementMonths = () =>
	Array.from({ length: 12 }, (_, i) => {
		const month = subMonths(startOfMonth(new Date()), i);
		return {
			value: format(month, 'yyyy-MM'),
			label: format(month, 'MMMM yyyy'),
			from: format(month, 'yyyy-MM-dd'),
			to: format(endOfMonth(month), 'yyyy-MM-dd'),
		};
	});

const StatementDialog = ({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) => {
	const months = statementMonths();
	const [month, setMonth] = useState(months[0].value);
	const [summary, setSummary] = useState<{ month: string; data: OrdersSummary } | null>(null);
	const [fetchOrders, { isFetching }] = useLazyGetOrdersQuery();
	const range = months.find((m) => m.value === month)!;

	const load = async (download: boolean) => {
		try {
			const res = await fetchOrders(exportParams({ vendorId: vendor.id, from: range.from, to: range.to })).unwrap();
			setSummary({ month, data: res.summary });
			if (download) downloadOrdersCsv(`${vendor.name.toLowerCase().replace(/\W+/g, '-')}-statement-${month}.csv`, res.data);
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t load the statement.'));
		}
	};

	const shown = summary?.month === month ? summary.data : null;

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='max-w-md rounded-3xl p-6'>
				<DialogTitle className='text-lg font-semibold text-primary-black'>{vendor.name} statement</DialogTitle>
				<DialogDescription className='text-sm text-neutral-500'>
					Paid orders, GMV and TurfTribe’s commission for a month (Africa/Lagos). The CSV lists every order line
					with its SKU.
				</DialogDescription>

				<select
					aria-label='Statement month'
					value={month}
					onChange={(e) => setMonth(e.target.value)}
					className={inputClass}>
					{months.map((m) => (
						<option key={m.value} value={m.value}>
							{m.label}
						</option>
					))}
				</select>

				{shown && (
					<dl className='grid grid-cols-2 gap-y-1 rounded-2xl bg-[#F7F7F7] px-4 py-3 text-sm'>
						<dt className='text-subtle'>Paid orders</dt>
						<dd className='text-right tabular-nums'>{count(shown.count)}</dd>
						<dt className='text-subtle'>GMV</dt>
						<dd className='text-right tabular-nums'>{naira(shown.gmv)}</dd>
						<dt className='text-subtle'>TurfTribe commission</dt>
						<dd className='text-right tabular-nums'>{naira(shown.commission)}</dd>
						<dt className='font-semibold text-ink'>Settled to {vendor.name}</dt>
						<dd className='text-right font-semibold tabular-nums'>{naira(shown.gmv - shown.commission)}</dd>
					</dl>
				)}

				<div className='mt-2 flex gap-3'>
					<button type='button' onClick={() => load(false)} disabled={isFetching} className={cancelButtonClass}>
						Show totals
					</button>
					<LoadingButton variant='secondary' loading={isFetching} onClick={() => load(true)} className='flex-1'>
						Download CSV
					</LoadingButton>
				</div>
			</DialogContent>
		</Dialog>
	);
};

const VendorCard = ({ vendor, onEdit, onStatement }: { vendor: Vendor; onEdit: () => void; onStatement: () => void }) => (
	<section className='flex min-w-0 flex-col gap-4 rounded-3xl border border-black/[0.06] bg-surface-raised p-5 shadow-card'>
		<div className='flex items-start justify-between gap-3'>
			<div className='min-w-0'>
				<p className='truncate font-bold text-ink'>{vendor.name}</p>
				<p className='truncate text-xs text-subtle'>{vendor.contactEmail}</p>
			</div>
			<Pill tone={vendor.status === 'active' ? 'success' : 'neutral'}>{vendor.status}</Pill>
		</div>

		{!vendor.paystackSubaccountCode && (
			<p className='flex items-center gap-1.5 rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger'>
				<AlertTriangle className='h-3.5 w-3.5 shrink-0' />
				No Paystack subaccount, so its products can’t be bought.
			</p>
		)}

		<dl className='grid grid-cols-2 gap-3 border-t border-line/60 pt-3 text-xs sm:grid-cols-4'>
			<div>
				<dt className='text-subtle'>Commission</dt>
				<dd className='mt-0.5 font-semibold text-ink'>{percent(vendor.commissionRate)}</dd>
			</div>
			<div>
				<dt className='text-subtle'>Products</dt>
				<dd className='mt-0.5 font-semibold text-ink'>{count(vendor.productsCount)}</dd>
			</div>
			<div>
				<dt className='text-subtle'>GMV</dt>
				<dd className='mt-0.5 font-semibold text-ink'>{naira(vendor.gmv)}</dd>
			</div>
			<div>
				<dt className='text-subtle'>Earned</dt>
				<dd className='mt-0.5 font-semibold text-ink'>{naira(vendor.commission)}</dd>
			</div>
		</dl>

		{vendor.paystackSubaccountCode && (
			<p className='font-mono text-xs text-subtle'>Paystack {vendor.paystackSubaccountCode}</p>
		)}

		<div className='flex gap-2'>
			<button
				onClick={onEdit}
				className='inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink'>
				<Pencil className='h-3.5 w-3.5' />
				Edit
			</button>
			<button
				onClick={onStatement}
				className='inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink'>
				<FileText className='h-3.5 w-3.5' />
				Statement
			</button>
		</div>
	</section>
);

const AdminMerchVendors = () => {
	const { data: vendors = [], error, isLoading, refetch } = useGetVendorsQuery();
	// undefined = closed, null = adding a vendor.
	const [editing, setEditing] = useState<Vendor | null | undefined>(undefined);
	const [statementFor, setStatementFor] = useState<Vendor | null>(null);

	return (
		<NavWrapper title='Vendors'>
			<div className='mt-2 flex flex-col gap-4 pb-10 md:mt-4'>
				<DemoBanner />
				<div className='flex flex-wrap items-center justify-between gap-3'>
					<p className='max-w-2xl text-sm text-subtle'>
						Partners whose products TurfTribe sells. Each has its own commission rate and Paystack subaccount. TurfTribe
						admins manage listings on their behalf for now.
					</p>
					{!error && (
						<button onClick={() => setEditing(null)} className={primaryButtonClass}>
							<Plus className='h-4 w-4' />
							Add vendor
						</button>
					)}
				</div>

				{error ? (
					<AdminQueryState error={error} endpoint='GET /merch/vendors' onRetry={refetch} />
				) : isLoading ? (
					<RowsSkeleton rows={3} />
				) : vendors.length === 0 ? (
					<EmptyRows title='No vendors yet' info='Add the launch partner (Smileys) to start listing products.' />
				) : (
					<div className='grid gap-3 md:gap-4 lg:grid-cols-2'>
						{vendors.map((vendor) => (
							<VendorCard
								key={vendor.id}
								vendor={vendor}
								onEdit={() => setEditing(vendor)}
								onStatement={() => setStatementFor(vendor)}
							/>
						))}
					</div>
				)}
			</div>

			{editing !== undefined && <VendorDialog vendor={editing} onClose={() => setEditing(undefined)} />}
			{statementFor && <StatementDialog vendor={statementFor} onClose={() => setStatementFor(null)} />}
		</NavWrapper>
	);
};

export default AdminMerchVendors;
