import { useState } from 'react';
import { toast } from 'sonner';
import { useCreateLocationMutation, useUpdateLocationMutation } from '@/features/venues/venuesApi';
import type { LocationInput, Place, VenueLocation, VenueSport } from '@/features/venues/types';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

import LoadingButton from '@/components/ui/loading-button';
import { cancelButtonClass, errorMessage, inputClass } from '../../shared';
import { CoordinatesField, Field, SPORT_OPTIONS, parseCoordinates, toCoordinateDraft } from '../shared';

const STANDALONE = '';

const LocationDialog = ({
	organisationId,
	location,
	places,
	defaultPlaceId,
	onClose,
}: {
	organisationId: string;
	location: VenueLocation | null;
	places: Place[];
	defaultPlaceId?: string | null;
	onClose: () => void;
}) => {
	const [placeId, setPlaceId] = useState(location ? (location.placeId ?? STANDALONE) : (defaultPlaceId ?? STANDALONE));
	const [name, setName] = useState(location?.name ?? '');
	const [sport, setSport] = useState<VenueSport>(location?.sport ?? 'football');
	const [capacity, setCapacity] = useState(String(location?.capacity ?? ''));
	const [basePrice, setBasePrice] = useState(String(location?.basePrice ?? ''));
	const [coordinates, setCoordinates] = useState(toCoordinateDraft(location?.coordinates ?? null));
	const [active, setActive] = useState((location?.status ?? 'active') === 'active');
	const [create, { isLoading: creating }] = useCreateLocationMutation();
	const [update, { isLoading: updating }] = useUpdateLocationMutation();

	const place = places.find((p) => p.id === placeId);
	const parsed = parseCoordinates(coordinates);
	const capacityNumber = Number(capacity);
	const priceNumber = Number(basePrice);

	const error = !name.trim()
		? 'Name the pitch or court, e.g. “Pitch A · 5-a-side”.'
		: !(Number.isInteger(capacityNumber) && capacityNumber > 0)
			? 'Capacity is the most people at once, a whole number above 0.'
			: !(priceNumber > 0)
				? 'Add a base price per hour.'
				: parsed === undefined
					? 'Fix the coordinates or clear them.'
					: null;

	const save = async () => {
		const body: LocationInput = {
			organisationId,
			placeId: placeId || null,
			name: name.trim(),
			sport,
			capacity: capacityNumber,
			basePrice: priceNumber,
			coordinates: parsed ?? null,
			status: active ? 'active' : 'inactive',
		};
		try {
			if (location) await update({ id: location.id, body }).unwrap();
			else await create(body).unwrap();
			toast.success(`${body.name} ${location ? 'updated' : 'added'}.${location ? '' : ' Generate its schedule next.'}`);
			onClose();
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t save the location.'));
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl p-6'>
				<DialogTitle className='text-lg font-semibold text-primary-black'>
					{location ? `Edit ${location.name}` : 'Add a location'}
				</DialogTitle>
				<DialogDescription className='text-sm text-neutral-500'>
					One bookable pitch or court with its own calendar.
				</DialogDescription>

				<div className='flex flex-col gap-4'>
					<Field label='Place'>
						<select value={placeId} onChange={(e) => setPlaceId(e.target.value)} className={inputClass}>
							{places.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
							<option value={STANDALONE}>Standalone (no place)</option>
						</select>
					</Field>
					<Field label='Name'>
						<input value={name} onChange={(e) => setName(e.target.value)} placeholder='e.g. Padel Court 1' className={inputClass} />
					</Field>
					<div className='grid gap-3 sm:grid-cols-3'>
						<Field label='Sport'>
							<select value={sport} onChange={(e) => setSport(e.target.value as VenueSport)} className={inputClass}>
								{SPORT_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
						</Field>
						<Field label='Capacity'>
							<input
								type='number'
								min={1}
								value={capacity}
								onChange={(e) => setCapacity(e.target.value)}
								placeholder='Max people'
								className={inputClass}
							/>
						</Field>
						<Field label='Base price / hr (₦)'>
							<input
								type='number'
								min={0}
								step={500}
								value={basePrice}
								onChange={(e) => setBasePrice(e.target.value)}
								className={inputClass}
							/>
						</Field>
					</div>

					<CoordinatesField
						value={coordinates}
						onChange={setCoordinates}
						fallback={place?.coordinates ? `${place.name}’s coordinates` : undefined}
					/>
					{parsed === null && place?.coordinates && (
						<p className='-mt-2 text-xs text-subtle'>Uses {place.name}’s coordinates, so it’s searchable.</p>
					)}

					<label className='flex items-center gap-2 text-sm font-medium text-neutral-700'>
						<Switch checked={active} onCheckedChange={setActive} />
						Active
						<span className='font-normal text-subtle'>· inactive hides it from discovery and booking</span>
					</label>
				</div>

				{error && <p className='text-xs text-danger'>{error}</p>}
				<div className='mt-2 flex gap-3'>
					<button type='button' onClick={onClose} className={cancelButtonClass}>
						Cancel
					</button>
					<LoadingButton variant='secondary' loading={creating || updating} disabled={!!error} onClick={save} className='flex-1'>
						{location ? 'Save changes' : 'Add location'}
					</LoadingButton>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default LocationDialog;
