import { useState } from 'react';
import { format } from 'date-fns';
import { LocateFixed, MapPinOff } from 'lucide-react';
import { toast } from 'sonner';
import type {
	LatLng,
	SlotStatus,
	VenueBookingStatus,
	VenueOrganisation,
	VenueSettings,
	VenueSport,
} from '@/features/venues/types';
import { VENUES_DEMO, VENUES_DEMO_EMPTY } from '@/features/venues/demo';
import { cn } from '@/lib/utils';
import { inputClass } from '../shared';

export { percent, primaryButtonClass, secondaryButtonClass } from '../merch/shared';

export const SPORT_OPTIONS: { value: VenueSport; label: string }[] = [
	{ value: 'football', label: 'Football' },
	{ value: 'padel', label: 'Padel' },
	{ value: 'tennis', label: 'Tennis' },
	{ value: 'basketball', label: 'Basketball' },
	{ value: 'multi_use', label: 'Multi-use' },
];

export const sportLabel = (sport: VenueSport) => SPORT_OPTIONS.find((option) => option.value === sport)?.label ?? sport;

export const SLOT_STATUS: Record<SlotStatus, { label: string; className: string; dot: string }> = {
	open: { label: 'Open', className: 'border-brand/60 bg-brand-soft text-ink hover:border-ink', dot: 'bg-brand' },
	booked: { label: 'Booked', className: 'border-ink bg-ink text-white', dot: 'bg-ink' },
	in_progress: { label: 'In progress', className: 'border-[#2D9CDB] bg-[#2D9CDB] text-white', dot: 'bg-[#2D9CDB]' },
	completed: { label: 'Completed', className: 'border-black/10 bg-black/[0.06] text-subtle', dot: 'bg-black/25' },
	blocked: {
		label: 'Blocked',
		className:
			'border-black/15 bg-[repeating-linear-gradient(135deg,#f1f1f1_0,#f1f1f1_6px,#e4e4e4_6px,#e4e4e4_12px)] text-subtle',
		dot: 'bg-black/40',
	},
	cancelled: { label: 'Cancelled', className: 'border-danger/40 bg-danger/10 text-danger line-through', dot: 'bg-danger' },
};

export const SLOT_STATUS_ORDER: SlotStatus[] = ['open', 'booked', 'in_progress', 'completed', 'blocked', 'cancelled'];

export const BOOKING_STATUS_OPTIONS: { value: VenueBookingStatus; label: string }[] = [
	{ value: 'upcoming', label: 'Upcoming' },
	{ value: 'in_progress', label: 'In progress' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'cancelled', label: 'Cancelled' },
];

export const BOOKING_STATUS_TONE: Record<VenueBookingStatus, 'success' | 'danger' | 'warning' | 'neutral'> = {
	upcoming: 'warning',
	in_progress: 'success',
	completed: 'neutral',
	cancelled: 'danger',
};

export const bookingStatusLabel = (status: VenueBookingStatus) =>
	BOOKING_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

export const BOOKER_LABEL = { community: 'Community', player: 'Player', walk_in: 'Walk-in' } as const;

export const timeRange = (start: string, end: string) => `${format(new Date(start), 'HH:mm')}–${format(new Date(end), 'HH:mm')}`;

export const effectiveFeeRate = (org: Pick<VenueOrganisation, 'feeRate' | 'platformOwned'>, settings?: VenueSettings) =>
	org.platformOwned ? null : (org.feeRate ?? settings?.defaultFeeRate ?? null);

export const linkButtonClass =
	'inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-ink disabled:opacity-50';

export const textareaClass =
	'mt-1.5 min-h-[5rem] w-full rounded-xl border border-[#E7EAEE] bg-white px-4 py-3 text-sm text-primary-black outline-none focus:border-primary-black';

export const Field = ({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) => (
	<label className='block text-sm font-medium text-neutral-700'>
		{label}
		{children}
		{hint && <span className='mt-1 block text-xs font-normal text-subtle'>{hint}</span>}
	</label>
);

// Text state for a lat/lng pair, so half-typed values ("6.") survive.
export type CoordinateDraft = { lat: string; lng: string };

export const toCoordinateDraft = (point: LatLng | null): CoordinateDraft =>
	point ? { lat: String(point.lat), lng: String(point.lng) } : { lat: '', lng: '' };

/** undefined = invalid, null = left empty. */
export const parseCoordinates = (draft: CoordinateDraft): LatLng | null | undefined => {
	if (!draft.lat.trim() && !draft.lng.trim()) return null;
	const lat = Number(draft.lat);
	const lng = Number(draft.lng);
	if (!draft.lat.trim() || !draft.lng.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
	if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
	return { lat, lng };
};

/*
 * Coordinates come from the browser's geolocation (stand on site and tap) or
 * manual entry, e.g. copied from a maps app. No maps SDK, no per-search cost.
 */
export const CoordinatesField = ({
	value,
	onChange,
	fallback,
	required,
}: {
	value: CoordinateDraft;
	onChange: (value: CoordinateDraft) => void;
	/** What applies when left empty, e.g. "the place's coordinates". */
	fallback?: string;
	required?: boolean;
}) => {
	const [locating, setLocating] = useState(false);
	const parsed = parseCoordinates(value);

	const locate = () => {
		if (!navigator.geolocation) {
			toast.error('This browser can’t share its location. Enter the coordinates instead.');
			return;
		}
		setLocating(true);
		navigator.geolocation.getCurrentPosition(
			(position) => {
				setLocating(false);
				onChange({ lat: position.coords.latitude.toFixed(6), lng: position.coords.longitude.toFixed(6) });
				toast.success(`Location captured (±${Math.round(position.coords.accuracy)} m).`);
			},
			(error) => {
				setLocating(false);
				toast.error(
					error.code === error.PERMISSION_DENIED
						? 'Location permission was denied. Allow it in the browser, or enter the coordinates.'
						: 'Couldn’t get the location. Try again or enter the coordinates.'
				);
			},
			{ enableHighAccuracy: true, timeout: 15000 }
		);
	};

	return (
		<fieldset className='flex flex-col gap-2'>
			<legend className='text-sm font-medium text-neutral-700'>Coordinates{required ? '' : ' (optional)'}</legend>
			<div className='grid grid-cols-2 gap-2'>
				<input
					inputMode='decimal'
					aria-label='Latitude'
					placeholder='Latitude, e.g. 6.4527'
					value={value.lat}
					onChange={(e) => onChange({ ...value, lat: e.target.value })}
					className={cn(inputClass, 'mt-0 font-mono')}
				/>
				<input
					inputMode='decimal'
					aria-label='Longitude'
					placeholder='Longitude, e.g. 3.4385'
					value={value.lng}
					onChange={(e) => onChange({ ...value, lng: e.target.value })}
					className={cn(inputClass, 'mt-0 font-mono')}
				/>
			</div>
			<div className='flex flex-wrap items-center gap-2'>
				<button type='button' onClick={locate} disabled={locating} className={linkButtonClass}>
					<LocateFixed className='h-3.5 w-3.5' />
					{locating ? 'Locating…' : 'Use my current location'}
				</button>
				{parsed && (
					<a
						href={`https://www.openstreetmap.org/?mlat=${parsed.lat}&mlon=${parsed.lng}#map=17/${parsed.lat}/${parsed.lng}`}
						target='_blank'
						rel='noreferrer'
						className='text-xs font-semibold text-ink underline'>
						Check on a map
					</a>
				)}
			</div>
			{parsed === undefined ? (
				<p className='text-xs text-danger'>Enter both, as decimal degrees (latitude −90 to 90, longitude −180 to 180).</p>
			) : parsed === null ? (
				<p className='flex items-start gap-1.5 rounded-xl bg-warning/15 px-3 py-2 text-xs text-[#8A5A00]'>
					<MapPinOff className='mt-0.5 h-3.5 w-3.5 shrink-0' />
					{fallback
						? `Left empty, ${fallback} apply. Without any coordinates players can’t find it by distance.`
						: 'Without coordinates players can’t find it in “near me” searches.'}
				</p>
			) : null}
		</fieldset>
	);
};

export const NotSearchable = () => (
	<span
		title='No coordinates, so it doesn’t appear in “near me” results'
		className='inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-[#8A5A00]'>
		<MapPinOff className='h-3 w-3' />
		Not searchable
	</span>
);

// Shown while /venues/* is served from src/features/venues/demo.ts.
export const DemoBanner = () =>
	VENUES_DEMO ? (
		<p className='rounded-2xl bg-warning/15 px-4 py-3 text-xs text-[#8A5A00]'>
			<span className='font-semibold'>Demo data.</span>{' '}
			{VENUES_DEMO_EMPTY
				? 'Starting empty: anything you add is served by the app, not the backend, and is gone when you reload the page.'
				: 'TurfTriibe’s venues, slots and bookings here are samples served by the app, not the backend. Changes last until you reload the page.'}
		</p>
	) : null;
