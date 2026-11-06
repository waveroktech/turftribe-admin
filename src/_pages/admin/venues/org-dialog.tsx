import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateVenueOrganisationMutation, useUpdateVenueOrganisationMutation } from '@/features/venues/venuesApi';
import type { VenueOrganisation, VenueOrganisationInput, VenueSettings, VenueSport } from '@/features/venues/types';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import LoadingButton from '@/components/ui/loading-button';
import { cancelButtonClass, errorMessage, inputClass } from '../shared';
import { Field, SPORT_OPTIONS } from './shared';

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isSubaccount = (value: string) => /^ACCT_[a-z0-9]+$/i.test(value.trim());

/** What TurfTriibe's own venue organisation starts with. */
export const TURFTRIIBE_VENUE: VenueOrganisationInput = {
	name: 'TurfTriibe',
	platformOwned: true,
	address: 'Lagos',
	contact: { name: 'TurfTriibe Venues', email: 'venues@turftriibe.com', phone: '' },
	sports: ['football', 'padel'],
	payout: null,
	feeRate: null,
	status: 'active',
};

type Draft = VenueOrganisationInput & { payoutDraft: NonNullable<VenueOrganisationInput['payout']> };

const toDraft = (org: VenueOrganisation | null, preset?: VenueOrganisationInput): Draft => {
	const source = org ?? preset;
	return {
		name: source?.name ?? '',
		address: source?.address ?? '',
		contact: source?.contact ?? { name: '', email: '', phone: '' },
		sports: source?.sports ?? [],
		payout: source?.payout ?? null,
		feeRate: source?.feeRate ?? null,
		status: source?.status ?? 'active',
		platformOwned: org?.platformOwned ?? preset?.platformOwned,
		ownerEmail: '',
		payoutDraft: source?.payout ?? { bankName: '', accountNumber: '', accountName: '', paystackSubaccountCode: null },
	};
};

/*
 * Venue sign-up, run by an admin. It collects what the PRD's venue entry
 * point does: business name, address, contact, payout account and sports.
 * TurfTriibe's own organisation has no owners to invite and pays no fee.
 */
const OrgDialog = ({
	org,
	preset,
	settings,
	onClose,
	onSaved,
}: {
	org: VenueOrganisation | null;
	/** Prefill for a new organisation (used to set up TurfTriibe). */
	preset?: VenueOrganisationInput;
	settings?: VenueSettings;
	onClose: () => void;
	onSaved?: (org: VenueOrganisation) => void;
}) => {
	const [draft, setDraft] = useState<Draft>(() => toDraft(org, preset));
	const [overrideFee, setOverrideFee] = useState(draft.feeRate !== null);
	const [create, { isLoading: creating }] = useCreateVenueOrganisationMutation();
	const [update, { isLoading: updating }] = useUpdateVenueOrganisationMutation();
	const platformOwned = !!(org?.platformOwned ?? draft.platformOwned);

	const payout = draft.payoutDraft;
	const payoutStarted = !!(payout.bankName.trim() || payout.accountNumber.trim() || payout.accountName.trim());
	const subaccount = payout.paystackSubaccountCode?.trim() ?? '';

	const error = !draft.name.trim()
		? 'Add the business name.'
		: !draft.address.trim()
			? 'Add the address.'
			: !draft.contact.name.trim()
				? 'Add a contact person.'
				: !isEmail(draft.contact.email)
					? 'Add a contact email.'
					: draft.sports.length === 0
						? 'Pick at least one sport.'
						: draft.ownerEmail?.trim() && !isEmail(draft.ownerEmail)
							? 'The owner’s email doesn’t look right.'
							: payoutStarted && !(payout.bankName.trim() && payout.accountNumber.trim() && payout.accountName.trim())
								? 'Complete the payout account, or clear it.'
								: subaccount && !isSubaccount(subaccount)
									? 'Paystack subaccount codes look like ACCT_xxxxxxxx.'
									: overrideFee && !(draft.feeRate !== null && draft.feeRate >= 0 && draft.feeRate <= 100)
										? 'The fee must be between 0% and 100%.'
										: null;

	const save = async () => {
		const body: VenueOrganisationInput = {
			name: draft.name.trim(),
			address: draft.address.trim(),
			contact: {
				name: draft.contact.name.trim(),
				email: draft.contact.email.trim(),
				phone: draft.contact.phone.trim(),
			},
			sports: draft.sports,
			payout:
				payoutStarted || subaccount
					? {
							bankName: payout.bankName.trim(),
							accountNumber: payout.accountNumber.trim(),
							accountName: payout.accountName.trim(),
							paystackSubaccountCode: subaccount || null,
						}
					: null,
			feeRate: !platformOwned && overrideFee ? draft.feeRate : null,
			status: draft.status,
			...(draft.ownerEmail?.trim() ? { ownerEmail: draft.ownerEmail.trim() } : {}),
			...(!org && draft.platformOwned ? { platformOwned: true } : {}),
		};
		try {
			const saved = org ? await update({ id: org.id, body }).unwrap() : await create(body).unwrap();
			toast.success(`${body.name} ${org ? 'updated' : 'is set up as a venue owner'}.`);
			onSaved?.(saved);
			onClose();
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t save the venue.'));
		}
	};

	const set = <K extends keyof Draft>(field: K, value: Draft[K]) => setDraft((current) => ({ ...current, [field]: value }));
	const setContact = (field: keyof Draft['contact'], value: string) =>
		setDraft((current) => ({ ...current, contact: { ...current.contact, [field]: value } }));
	const setPayout = (field: keyof Draft['payoutDraft'], value: string) =>
		setDraft((current) => ({ ...current, payoutDraft: { ...current.payoutDraft, [field]: value } }));
	const toggleSport = (sport: VenueSport) =>
		set('sports', draft.sports.includes(sport) ? draft.sports.filter((s) => s !== sport) : [...draft.sports, sport]);

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl p-6'>
				<DialogTitle className='text-lg font-semibold text-primary-black'>
					{org ? `Edit ${org.name}` : platformOwned ? 'Set up TurfTriibe as a venue owner' : 'Add a venue'}
				</DialogTitle>
				<DialogDescription className='text-sm text-neutral-500'>
					{platformOwned
						? 'TurfTriibe’s own venue organisation. Superadmins manage its places and calendar from here, and every booking’s full amount stays with TurfTriibe.'
						: 'A venue organisation owns places and courts. Its owners switch into it from their account, like a LinkedIn page.'}
				</DialogDescription>

				<div className='flex flex-col gap-4'>
					<Field label='Business name'>
						<input value={draft.name} onChange={(e) => set('name', e.target.value)} className={inputClass} />
					</Field>
					<Field label='Address' hint='Free text shown to players. Each place gets its own address and coordinates.'>
						<input value={draft.address} onChange={(e) => set('address', e.target.value)} className={inputClass} />
					</Field>

					<fieldset className='flex flex-col gap-2'>
						<legend className='text-sm font-medium text-neutral-700'>Sports offered</legend>
						<div className='flex flex-wrap gap-2'>
							{SPORT_OPTIONS.map((option) => {
								const on = draft.sports.includes(option.value);
								return (
									<button
										key={option.value}
										type='button'
										aria-pressed={on}
										onClick={() => toggleSport(option.value)}
										className={cn(
											'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
											on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:border-ink'
										)}>
										{option.label}
									</button>
								);
							})}
						</div>
					</fieldset>

					<div className='grid gap-3 sm:grid-cols-2'>
						<Field label='Contact person'>
							<input value={draft.contact.name} onChange={(e) => setContact('name', e.target.value)} className={inputClass} />
						</Field>
						<Field label='Contact phone'>
							<input
								type='tel'
								value={draft.contact.phone}
								onChange={(e) => setContact('phone', e.target.value)}
								className={inputClass}
							/>
						</Field>
					</div>
					<Field label='Contact email' hint='Booking notifications go here.'>
						<input
							type='email'
							value={draft.contact.email}
							onChange={(e) => setContact('email', e.target.value)}
							className={inputClass}
						/>
					</Field>

					{!platformOwned && (
						<Field
							label={org?.owners.length ? 'Add another owner (email)' : 'Owner’s email'}
							hint={
								org?.owners.length
									? `Owners: ${org.owners.map((o) => o.email).join(', ')}`
									: 'Optional. They can switch into this venue from their account; without an account they get an invite.'
							}>
							<input
								type='email'
								value={draft.ownerEmail ?? ''}
								onChange={(e) => set('ownerEmail', e.target.value)}
								placeholder='owner@venue.com'
								className={inputClass}
							/>
						</Field>
					)}

					<fieldset className='flex flex-col gap-3 rounded-2xl bg-[#F7F7F7] p-4'>
						<legend className='sr-only'>Payout account</legend>
						<p className='text-sm font-semibold text-ink'>Payout account</p>
						<div className='grid gap-3 sm:grid-cols-2'>
							<Field label='Bank'>
								<input value={payout.bankName} onChange={(e) => setPayout('bankName', e.target.value)} className={inputClass} />
							</Field>
							<Field label='Account number'>
								<input
									inputMode='numeric'
									value={payout.accountNumber}
									onChange={(e) => setPayout('accountNumber', e.target.value)}
									className={inputClass}
								/>
							</Field>
						</div>
						<Field label='Account name'>
							<input value={payout.accountName} onChange={(e) => setPayout('accountName', e.target.value)} className={inputClass} />
						</Field>
						<Field
							label='Paystack subaccount code'
							hint={
								platformOwned
									? 'Leave empty: TurfTriibe’s own bookings settle to the main Paystack balance.'
									: 'Create it in the Paystack dashboard. Online booking is blocked until it’s set.'
							}>
							<input
								value={payout.paystackSubaccountCode ?? ''}
								onChange={(e) => setPayout('paystackSubaccountCode', e.target.value)}
								placeholder='ACCT_xxxxxxxx'
								className={`${inputClass} font-mono`}
							/>
						</Field>
					</fieldset>

					{!platformOwned && (
						<div className='flex flex-col gap-2'>
							<label className='flex items-center gap-2 text-sm font-medium text-neutral-700'>
								<Switch
									checked={overrideFee}
									onCheckedChange={(checked) => {
										setOverrideFee(checked);
										if (checked && draft.feeRate === null) set('feeRate', settings?.defaultFeeRate ?? 10);
									}}
								/>
								Custom booking fee
								<span className='font-normal text-subtle'>
									· default {settings ? `${settings.defaultFeeRate}%` : 'from Clusters & fees'}
								</span>
							</label>
							{overrideFee && (
								<Field label='TurfTriibe fee (%)'>
									<input
										type='number'
										min={0}
										max={100}
										step={0.5}
										value={draft.feeRate ?? ''}
										onChange={(e) => set('feeRate', e.target.value === '' ? null : Number(e.target.value))}
										className={inputClass}
									/>
								</Field>
							)}
						</div>
					)}

					<label className='flex items-center gap-2 text-sm font-medium text-neutral-700'>
						<Switch
							checked={draft.status === 'active'}
							onCheckedChange={(checked) => set('status', checked ? 'active' : 'inactive')}
						/>
						Active
						<span className='font-normal text-subtle'>· inactive hides its locations from discovery and booking</span>
					</label>
				</div>

				{error && <p className='text-xs text-danger'>{error}</p>}
				<div className='mt-2 flex gap-3'>
					<button type='button' onClick={onClose} className={cancelButtonClass}>
						Cancel
					</button>
					<LoadingButton variant='secondary' loading={creating || updating} disabled={!!error} onClick={save} className='flex-1'>
						{org ? 'Save changes' : platformOwned ? 'Set up TurfTriibe' : 'Add venue'}
					</LoadingButton>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default OrgDialog;
