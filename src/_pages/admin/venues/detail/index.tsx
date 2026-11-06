'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, CalendarPlus, ImageOff, MapPin, Pencil, Plus, ShieldCheck } from 'lucide-react';
import {
	useGetLocationsQuery,
	useGetPlacesQuery,
	useGetVenueOrganisationQuery,
	useGetVenueSettingsQuery,
} from '@/features/venues/venuesApi';
import { formatLatLng, locationCoordinates } from '@/features/venues/geo';
import type { Place, VenueLocation, VenueOrganisation, VenueSettings } from '@/features/venues/types';
import { VENUES_HOME } from '@/lib/admin';

import NavWrapper from '@/shared/nav-wrapper';
import { AdminQueryState, EmptyRows, Pill, RowsSkeleton, count, naira, shortDate } from '../../shared';
import OrgDialog from '../org-dialog';
import {
	DemoBanner,
	NotSearchable,
	effectiveFeeRate,
	linkButtonClass,
	percent,
	primaryButtonClass,
	secondaryButtonClass,
	sportLabel,
} from '../shared';
import PlaceDialog from './place-dialog';
import LocationDialog from './location-dialog';
import ScheduleDialog from './schedule-dialog';

const Summary = ({ org, settings, onEdit }: { org: VenueOrganisation; settings?: VenueSettings; onEdit: () => void }) => {
	const rate = effectiveFeeRate(org, settings);
	return (
		<section className='flex flex-col gap-4 rounded-3xl border border-black/[0.06] bg-surface-raised p-5 shadow-card'>
			<div className='flex flex-wrap items-start justify-between gap-3'>
				<div className='min-w-0'>
					<p className='flex flex-wrap items-center gap-2 text-lg font-bold text-ink'>
						{org.name}
						{org.platformOwned && (
							<span className='inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-ink'>
								<ShieldCheck className='h-3 w-3' />
								Run by TurfTriibe
							</span>
						)}
						<Pill tone={org.status === 'active' ? 'success' : 'neutral'}>{org.status}</Pill>
					</p>
					<p className='text-sm text-subtle'>{org.address}</p>
				</div>
				<div className='flex gap-2'>
					<Link href={`${VENUES_HOME}/calendar?venue=${org.id}`} className={secondaryButtonClass}>
						<CalendarDays className='h-4 w-4' />
						Calendar
					</Link>
					<button onClick={onEdit} className={primaryButtonClass}>
						<Pencil className='h-4 w-4' />
						Edit
					</button>
				</div>
			</div>

			<dl className='grid grid-cols-2 gap-4 border-t border-line/60 pt-4 text-xs md:grid-cols-4'>
				<div>
					<dt className='text-subtle'>Contact</dt>
					<dd className='mt-0.5 font-semibold text-ink'>{org.contact.name}</dd>
					<dd className='text-subtle'>{org.contact.email}</dd>
					{org.contact.phone && <dd className='text-subtle'>{org.contact.phone}</dd>}
				</div>
				<div>
					<dt className='text-subtle'>Owners</dt>
					<dd className='mt-0.5 font-semibold text-ink'>
						{org.platformOwned
							? 'TurfTriibe superadmins'
							: org.owners.length
								? org.owners.map((owner) => owner.email).join(', ')
								: 'None yet'}
					</dd>
					<dd className='text-subtle'>{org.sports.map(sportLabel).join(' · ')}</dd>
				</div>
				<div>
					<dt className='text-subtle'>Payout</dt>
					<dd className='mt-0.5 font-semibold text-ink'>
						{org.payout ? `${org.payout.bankName} · ${org.payout.accountName}` : 'Not set'}
					</dd>
					<dd className='font-mono text-subtle'>
						{org.payout?.paystackSubaccountCode ?? (org.platformOwned ? 'Main Paystack balance' : 'No subaccount')}
					</dd>
				</div>
				<div>
					<dt className='text-subtle'>Booking fee</dt>
					<dd className='mt-0.5 font-semibold text-ink'>
						{rate === null ? 'None, own venue' : `${percent(rate)} ${org.feeRate !== null ? '(custom)' : '(default)'}`}
					</dd>
					<dd className='text-subtle'>
						{naira(org.stats.gmv)} GMV · {naira(org.stats.fees)} fees
					</dd>
				</div>
			</dl>
		</section>
	);
};

const LocationRow = ({
	location,
	places,
	onEdit,
	onSchedule,
}: {
	location: VenueLocation;
	places: Place[];
	onEdit: () => void;
	onSchedule: () => void;
}) => {
	const coords = locationCoordinates(location, places);
	return (
		<li className='flex flex-wrap items-center justify-between gap-3 px-4 py-3'>
			<div className='min-w-0'>
				<p className='flex flex-wrap items-center gap-2 text-sm font-semibold text-ink'>
					{location.name}
					{location.status === 'inactive' && <Pill tone='neutral'>inactive</Pill>}
					{!coords && <NotSearchable />}
				</p>
				<p className='text-xs text-subtle'>
					{sportLabel(location.sport)} · up to {count(location.capacity)} people · {naira(location.basePrice)}/hr ·{' '}
					{location.scheduledUntil ? `slots to ${shortDate(location.scheduledUntil)}` : 'no schedule yet'}
					{location.coordinates && ` · ${formatLatLng(location.coordinates)}`}
				</p>
			</div>
			<div className='flex flex-wrap gap-2'>
				<button onClick={onSchedule} className={linkButtonClass}>
					<CalendarPlus className='h-3.5 w-3.5' />
					{location.scheduledUntil ? 'Extend schedule' : 'Generate schedule'}
				</button>
				<Link href={`${VENUES_HOME}/calendar?venue=${location.organisationId}&location=${location.id}`} className={linkButtonClass}>
					<CalendarDays className='h-3.5 w-3.5' />
					Calendar
				</Link>
				<button onClick={onEdit} className={linkButtonClass}>
					<Pencil className='h-3.5 w-3.5' />
					Edit
				</button>
			</div>
		</li>
	);
};

const PlaceCover = ({ place }: { place: Place }) => {
	const [broken, setBroken] = useState(false);
	const src = place.photos[0];
	return (
		<span className='grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-soft text-ink'>
			{src && !broken ? (
				// eslint-disable-next-line @next/next/no-img-element -- venue photos live on arbitrary hosts
				<img src={src} alt='' onError={() => setBroken(true)} className='h-full w-full object-cover' />
			) : (
				<ImageOff className='h-5 w-5 opacity-50' />
			)}
		</span>
	);
};

type Editing =
	| { kind: 'org' }
	| { kind: 'place'; place: Place | null }
	| { kind: 'location'; location: VenueLocation | null; placeId?: string | null }
	| { kind: 'schedule'; location: VenueLocation };

const AdminVenueDetail = ({ id }: { id: string }) => {
	const { data: org, error, isLoading, refetch } = useGetVenueOrganisationQuery(id);
	const { data: places = [], isLoading: placesLoading } = useGetPlacesQuery({ organisationId: id });
	const { data: locations = [], isLoading: locationsLoading } = useGetLocationsQuery({ organisationId: id });
	const { data: settings } = useGetVenueSettingsQuery();
	const [editing, setEditing] = useState<Editing | null>(null);

	const standalone = locations.filter((location) => !location.placeId);
	const close = () => setEditing(null);

	const row = (location: VenueLocation) => (
		<LocationRow
			key={location.id}
			location={location}
			places={places}
			onEdit={() => setEditing({ kind: 'location', location })}
			onSchedule={() => setEditing({ kind: 'schedule', location })}
		/>
	);

	return (
		<NavWrapper title={org?.name ?? 'Venue'} back>
			<div className='mt-2 flex flex-col gap-4 pb-10 md:mt-4'>
				<DemoBanner />
				{error ? (
					<AdminQueryState error={error} endpoint={`GET /venues/organisations/${id}`} onRetry={refetch} />
				) : isLoading || !org ? (
					<RowsSkeleton rows={4} />
				) : (
					<>
						<Summary org={org} settings={settings} onEdit={() => setEditing({ kind: 'org' })} />

						<div className='flex flex-wrap items-center justify-between gap-3'>
							<h2 className='text-base font-bold text-ink'>Places and locations</h2>
							<div className='flex gap-2'>
								<button onClick={() => setEditing({ kind: 'location', location: null })} className={secondaryButtonClass}>
									<Plus className='h-4 w-4' />
									Add location
								</button>
								<button onClick={() => setEditing({ kind: 'place', place: null })} className={primaryButtonClass}>
									<Plus className='h-4 w-4' />
									Add place
								</button>
							</div>
						</div>

						{placesLoading || locationsLoading ? (
							<RowsSkeleton rows={3} />
						) : places.length === 0 && locations.length === 0 ? (
							<EmptyRows
								title='No places yet'
								info='Add a place (the sports centre), then its pitches and courts as locations.'
							/>
						) : (
							<>
								{places.map((place) => {
									const theirs = locations.filter((location) => location.placeId === place.id);
									return (
										<section
											key={place.id}
											className='overflow-hidden rounded-3xl border border-black/[0.06] bg-surface-raised shadow-card'>
											<header className='flex flex-wrap items-start justify-between gap-3 border-b border-line/60 p-4'>
												<div className='flex min-w-0 gap-3'>
													<PlaceCover place={place} />
													<div className='min-w-0'>
														<p className='flex flex-wrap items-center gap-2 font-bold text-ink'>
															{place.name}
															{!place.coordinates && <NotSearchable />}
														</p>
														<p className='flex items-center gap-1 text-xs text-subtle'>
															<MapPin className='h-3 w-3 shrink-0' />
															{place.address}
															{place.coordinates && ` · ${formatLatLng(place.coordinates)}`}
														</p>
														{place.amenities.length > 0 && (
															<p className='mt-1 text-xs text-subtle'>{place.amenities.join(' · ')}</p>
														)}
													</div>
												</div>
												<div className='flex gap-2'>
													<button
														onClick={() => setEditing({ kind: 'location', location: null, placeId: place.id })}
														className={linkButtonClass}>
														<Plus className='h-3.5 w-3.5' />
														Location
													</button>
													<button onClick={() => setEditing({ kind: 'place', place })} className={linkButtonClass}>
														<Pencil className='h-3.5 w-3.5' />
														Edit
													</button>
												</div>
											</header>
											{theirs.length ? (
												<ul className='divide-y divide-line/60'>{theirs.map(row)}</ul>
											) : (
												<p className='px-4 py-4 text-xs text-subtle'>No pitches or courts here yet.</p>
											)}
										</section>
									);
								})}

								{standalone.length > 0 && (
									<section className='overflow-hidden rounded-3xl border border-black/[0.06] bg-surface-raised shadow-card'>
										<header className='border-b border-line/60 p-4'>
											<p className='font-bold text-ink'>Standalone locations</p>
											<p className='text-xs text-subtle'>Bookable spaces that don’t belong to a place.</p>
										</header>
										<ul className='divide-y divide-line/60'>{standalone.map(row)}</ul>
									</section>
								)}
							</>
						)}
					</>
				)}
			</div>

			{org && editing?.kind === 'org' && <OrgDialog org={org} settings={settings} onClose={close} />}
			{editing?.kind === 'place' && <PlaceDialog organisationId={id} place={editing.place} onClose={close} />}
			{editing?.kind === 'location' && (
				<LocationDialog
					organisationId={id}
					location={editing.location}
					places={places}
					defaultPlaceId={editing.placeId ?? places[0]?.id ?? null}
					onClose={close}
				/>
			)}
			{editing?.kind === 'schedule' && <ScheduleDialog location={editing.location} onClose={close} />}
		</NavWrapper>
	);
};

export default AdminVenueDetail;
