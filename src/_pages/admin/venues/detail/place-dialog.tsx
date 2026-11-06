import { useState } from 'react';
import { toast } from 'sonner';
import { useCreatePlaceMutation, useUpdatePlaceMutation } from '@/features/venues/venuesApi';
import type { Place, PlaceInput } from '@/features/venues/types';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import LoadingButton from '@/components/ui/loading-button';
import { cancelButtonClass, errorMessage, inputClass } from '../../shared';
import { CoordinatesField, Field, parseCoordinates, textareaClass, toCoordinateDraft } from '../shared';

const AMENITIES = ['Floodlights', 'Changing rooms', 'Showers', 'Parking', 'Drinking water', 'Seating', 'Toilets', 'Café'];

const isUrl = (value: string) => /^https?:\/\/\S+$/i.test(value);

const PlaceDialog = ({
	organisationId,
	place,
	onClose,
}: {
	organisationId: string;
	place: Place | null;
	onClose: () => void;
}) => {
	const [name, setName] = useState(place?.name ?? '');
	const [address, setAddress] = useState(place?.address ?? '');
	const [coordinates, setCoordinates] = useState(toCoordinateDraft(place?.coordinates ?? null));
	const [photos, setPhotos] = useState((place?.photos ?? []).join('\n'));
	const [amenities, setAmenities] = useState<string[]>(place?.amenities ?? []);
	const [otherAmenity, setOtherAmenity] = useState('');
	const [create, { isLoading: creating }] = useCreatePlaceMutation();
	const [update, { isLoading: updating }] = useUpdatePlaceMutation();

	const photoList = photos
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
	const parsed = parseCoordinates(coordinates);

	const error = !name.trim()
		? 'Name the place, e.g. the sports centre.'
		: !address.trim()
			? 'Add the address players will see.'
			: parsed === undefined
				? 'Fix the coordinates or clear them.'
				: photoList.some((url) => !isUrl(url))
					? 'Photos must be links starting with https://.'
					: null;

	const toggle = (amenity: string) =>
		setAmenities((current) => (current.includes(amenity) ? current.filter((a) => a !== amenity) : [...current, amenity]));

	const save = async () => {
		const extra = otherAmenity
			.split(',')
			.map((a) => a.trim())
			.filter((a) => a && !amenities.includes(a));
		const body: PlaceInput = {
			organisationId,
			name: name.trim(),
			address: address.trim(),
			coordinates: parsed ?? null,
			photos: photoList,
			amenities: [...amenities, ...extra],
		};
		try {
			if (place) await update({ id: place.id, body }).unwrap();
			else await create(body).unwrap();
			toast.success(`${body.name} ${place ? 'updated' : 'added'}.`);
			onClose();
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t save the place.'));
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContent className='max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl p-6'>
				<DialogTitle className='text-lg font-semibold text-primary-black'>{place ? `Edit ${place.name}` : 'Add a place'}</DialogTitle>
				<DialogDescription className='text-sm text-neutral-500'>
					A physical site, like a sports centre. Its pitches and courts are added as locations and share its address and
					coordinates unless they set their own.
				</DialogDescription>

				<div className='flex flex-col gap-4'>
					<Field label='Name'>
						<input value={name} onChange={(e) => setName(e.target.value)} placeholder='e.g. TurfTriibe Ikoyi' className={inputClass} />
					</Field>
					<Field label='Address'>
						<input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
					</Field>
					<CoordinatesField value={coordinates} onChange={setCoordinates} />

					<fieldset className='flex flex-col gap-2'>
						<legend className='text-sm font-medium text-neutral-700'>Amenities</legend>
						<div className='flex flex-wrap gap-2'>
							{[...new Set([...AMENITIES, ...amenities])].map((amenity) => {
								const on = amenities.includes(amenity);
								return (
									<button
										key={amenity}
										type='button'
										aria-pressed={on}
										onClick={() => toggle(amenity)}
										className={cn(
											'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
											on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:border-ink'
										)}>
										{amenity}
									</button>
								);
							})}
						</div>
						<input
							value={otherAmenity}
							onChange={(e) => setOtherAmenity(e.target.value)}
							placeholder='Others, comma-separated'
							className={cn(inputClass, 'mt-0')}
						/>
					</fieldset>

					<Field label='Photos' hint='One image link per line. The first is the cover.'>
						<textarea value={photos} onChange={(e) => setPhotos(e.target.value)} className={cn(textareaClass, 'font-mono text-xs')} />
					</Field>
				</div>

				{error && <p className='text-xs text-danger'>{error}</p>}
				<div className='mt-2 flex gap-3'>
					<button type='button' onClick={onClose} className={cancelButtonClass}>
						Cancel
					</button>
					<LoadingButton variant='secondary' loading={creating || updating} disabled={!!error} onClick={save} className='flex-1'>
						{place ? 'Save changes' : 'Add place'}
					</LoadingButton>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default PlaceDialog;
