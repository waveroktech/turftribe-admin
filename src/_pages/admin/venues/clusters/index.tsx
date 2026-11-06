'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, MapPin, Pencil, Plus } from 'lucide-react';
import {
	useCreateAreaMutation,
	useCreateClusterMutation,
	useGetAreasQuery,
	useGetClustersQuery,
	useGetLocationsQuery,
	useGetPlacesQuery,
	useGetVenueOrganisationsQuery,
	useGetVenueSettingsQuery,
	useUpdateAreaMutation,
	useUpdateClusterMutation,
	useUpdateVenueSettingsMutation,
} from '@/features/venues/venuesApi';
import { clustersAt, formatLatLng, haversineKm, locationCoordinates } from '@/features/venues/geo';
import type { Area, Cluster, LatLng } from '@/features/venues/types';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

import NavWrapper from '@/shared/nav-wrapper';
import LoadingButton from '@/components/ui/loading-button';
import { AdminQueryState, EmptyRows, Pill, RowsSkeleton, cancelButtonClass, count, errorMessage, inputClass } from '../../shared';
import {
	CoordinatesField,
	DemoBanner,
	Field,
	linkButtonClass,
	parseCoordinates,
	percent,
	primaryButtonClass,
	secondaryButtonClass,
	toCoordinateDraft,
} from '../shared';

const FormDialog = ({
	title,
	description,
	error,
	loading,
	action,
	onSave,
	onClose,
	children,
}: {
	title: string;
	description: string;
	error: string | null;
	loading: boolean;
	action: string;
	onSave: () => void;
	onClose: () => void;
	children: React.ReactNode;
}) => (
	<Dialog open onOpenChange={(open) => !open && onClose()}>
		<DialogContent className='max-h-[90vh] max-w-md overflow-y-auto rounded-3xl p-6'>
			<DialogTitle className='text-lg font-semibold text-primary-black'>{title}</DialogTitle>
			<DialogDescription className='text-sm text-neutral-500'>{description}</DialogDescription>
			<div className='flex flex-col gap-4'>{children}</div>
			{error && <p className='text-xs text-danger'>{error}</p>}
			<div className='mt-2 flex gap-3'>
				<button type='button' onClick={onClose} className={cancelButtonClass}>
					Cancel
				</button>
				<LoadingButton variant='secondary' loading={loading} disabled={!!error} onClick={onSave} className='flex-1'>
					{action}
				</LoadingButton>
			</div>
		</DialogContent>
	</Dialog>
);

const ClusterDialog = ({ cluster, onClose }: { cluster: Cluster | null; onClose: () => void }) => {
	const [name, setName] = useState(cluster?.name ?? '');
	const [centre, setCentre] = useState(toCoordinateDraft(cluster?.centre ?? null));
	const [radius, setRadius] = useState(String(cluster?.radiusKm ?? 8));
	const [active, setActive] = useState(cluster?.active ?? false);
	const [create, { isLoading: creating }] = useCreateClusterMutation();
	const [update, { isLoading: updating }] = useUpdateClusterMutation();
	const parsed = parseCoordinates(centre);

	const error = !name.trim()
		? 'Name the cluster, e.g. “Lekki / Ikoyi”.'
		: !parsed
			? 'Set the centre point.'
			: !(Number(radius) > 0 && Number(radius) <= 100)
				? 'Radius must be between 0 and 100 km.'
				: null;

	const save = async () => {
		const body = { name: name.trim(), centre: parsed as LatLng, radiusKm: Number(radius), active };
		try {
			if (cluster) await update({ id: cluster.id, body }).unwrap();
			else await create(body).unwrap();
			toast.success(`${body.name} ${cluster ? 'updated' : 'added'}.`);
			onClose();
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t save the cluster.'));
		}
	};

	return (
		<FormDialog
			title={cluster ? `Edit ${cluster.name}` : 'Add a cluster'}
			description='A launch area: a centre point and radius. Discovery only shows what’s inside an active cluster; people outside see the live areas and a waitlist.'
			error={error}
			loading={creating || updating}
			action={cluster ? 'Save changes' : 'Add cluster'}
			onSave={save}
			onClose={onClose}>
			<Field label='Name'>
				<input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
			</Field>
			<CoordinatesField value={centre} onChange={setCentre} required />
			<Field label='Radius (km)' hint='Field sales signs venues within about 7–10 km of the anchor venue before announcing.'>
				<input type='number' min={1} max={100} step={0.5} value={radius} onChange={(e) => setRadius(e.target.value)} className={inputClass} />
			</Field>
			<label className='flex items-center gap-2 text-sm font-medium text-neutral-700'>
				<Switch checked={active} onCheckedChange={setActive} />
				Live
				<span className='font-normal text-subtle'>· turn on once it has both communities and venues</span>
			</label>
		</FormDialog>
	);
};

const AreaDialog = ({ area, onClose }: { area: Area | null; onClose: () => void }) => {
	const [name, setName] = useState(area?.name ?? '');
	const [centre, setCentre] = useState(toCoordinateDraft(area?.centre ?? null));
	const [create, { isLoading: creating }] = useCreateAreaMutation();
	const [update, { isLoading: updating }] = useUpdateAreaMutation();
	const parsed = parseCoordinates(centre);
	const error = !name.trim() ? 'Name the area.' : !parsed ? 'Set the area’s centre point.' : null;

	const save = async () => {
		const body = { name: name.trim(), centre: parsed as LatLng };
		try {
			if (area) await update({ id: area.id, body }).unwrap();
			else await create(body).unwrap();
			toast.success(`${body.name} ${area ? 'updated' : 'added'}.`);
			onClose();
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t save the area.'));
		}
	};

	return (
		<FormDialog
			title={area ? `Edit ${area.name}` : 'Add an area'}
			description='Players who don’t share their location pick an area instead; distances are measured from its centre.'
			error={error}
			loading={creating || updating}
			action={area ? 'Save changes' : 'Add area'}
			onSave={save}
			onClose={onClose}>
			<Field label='Name'>
				<input value={name} onChange={(e) => setName(e.target.value)} placeholder='e.g. Surulere' className={inputClass} />
			</Field>
			<CoordinatesField value={centre} onChange={setCentre} required />
		</FormDialog>
	);
};

const FeeCard = () => {
	const { data: settings, error, refetch } = useGetVenueSettingsQuery();
	const { data: orgs = [] } = useGetVenueOrganisationsQuery();
	const [update, { isLoading }] = useUpdateVenueSettingsMutation();
	const [draft, setDraft] = useState<string | null>(null);

	if (error) return <AdminQueryState error={error} endpoint='GET /venues/settings' onRetry={refetch} />;

	const value = draft ?? String(settings?.defaultFeeRate ?? '');
	const valid = Number(value) >= 0 && Number(value) <= 100 && value.trim() !== '';
	const overrides = orgs.filter((org) => !org.platformOwned && org.feeRate !== null);

	const save = async () => {
		try {
			await update({ defaultFeeRate: Number(value) }).unwrap();
			toast.success(`Default venue fee set to ${percent(Number(value))}. It applies to new bookings.`);
			setDraft(null);
		} catch (err) {
			toast.error(errorMessage(err, 'Couldn’t save the fee.'));
		}
	};

	return (
		<section className='flex flex-col gap-4 rounded-3xl border border-black/[0.06] bg-surface-raised p-5 shadow-card'>
			<div>
				<h2 className='text-base font-bold text-ink'>Venue booking fee</h2>
				<p className='mt-0.5 text-xs text-subtle'>
					TurfTriibe’s share of each online booking at a partner venue, taken at payment through the Paystack split.
					Manual bookings and TurfTriibe’s own venues pay none. Changing it never rewrites past bookings.
				</p>
			</div>
			<div className='flex flex-wrap items-end gap-3'>
				<Field label='Default fee (%)'>
					<input
						type='number'
						min={0}
						max={100}
						step={0.5}
						value={value}
						onChange={(e) => setDraft(e.target.value)}
						className={`${inputClass} w-40`}
					/>
				</Field>
				<LoadingButton
					variant='secondary'
					loading={isLoading}
					disabled={!valid || draft === null || Number(value) === settings?.defaultFeeRate}
					onClick={save}
					className='h-12 px-6'>
					Save
				</LoadingButton>
			</div>
			<p className='text-xs text-subtle'>
				{overrides.length
					? `Custom fees: ${overrides.map((org) => `${org.name} ${percent(org.feeRate!)}`).join(', ')}. Change them on each venue.`
					: 'No venue has a custom fee. Set one on the venue’s page.'}
			</p>
		</section>
	);
};

const AdminVenueClusters = () => {
	const { data: clusters = [], error, isLoading, refetch } = useGetClustersQuery();
	const { data: areas = [] } = useGetAreasQuery();
	const { data: places = [] } = useGetPlacesQuery({});
	const { data: locations = [] } = useGetLocationsQuery({});
	const [editingCluster, setEditingCluster] = useState<Cluster | null | undefined>(undefined);
	const [editingArea, setEditingArea] = useState<Area | null | undefined>(undefined);

	const live = clusters.filter((c) => c.active);
	const located = locations
		.filter((l) => l.status === 'active')
		.map((location) => ({ location, point: locationCoordinates(location, places) }));
	const outside = located.filter(({ point }) => point && clustersAt(point, live).length === 0);
	const unlocated = located.filter(({ point }) => !point);

	return (
		<NavWrapper title='Clusters & fees'>
			<div className='mt-2 flex flex-col gap-4 pb-10 md:mt-4'>
				<DemoBanner />
				<FeeCard />

				<div className='flex flex-wrap items-center justify-between gap-3'>
					<div>
						<h2 className='text-base font-bold text-ink'>Launch clusters</h2>
						<p className='text-xs text-subtle'>
							Open an area only where there are both communities and venues, so nobody lands on an empty map.
						</p>
					</div>
					<button onClick={() => setEditingCluster(null)} className={primaryButtonClass}>
						<Plus className='h-4 w-4' />
						Add cluster
					</button>
				</div>

				{(outside.length > 0 || unlocated.length > 0) && (
					<div className='flex flex-col gap-1.5'>
						{outside.length > 0 && (
							<p className='flex items-start gap-1.5 rounded-xl bg-warning/15 px-3 py-2 text-xs text-[#8A5A00]'>
								<AlertTriangle className='mt-0.5 h-3.5 w-3.5 shrink-0' />
								Outside every live cluster, so not discoverable: {outside.map(({ location }) => location.name).join(', ')}.
							</p>
						)}
						{unlocated.length > 0 && (
							<p className='flex items-start gap-1.5 rounded-xl bg-warning/15 px-3 py-2 text-xs text-[#8A5A00]'>
								<MapPin className='mt-0.5 h-3.5 w-3.5 shrink-0' />
								No coordinates, so not searchable: {unlocated.map(({ location }) => location.name).join(', ')}.
							</p>
						)}
					</div>
				)}

				{error ? (
					<AdminQueryState error={error} endpoint='GET /venues/clusters' onRetry={refetch} />
				) : isLoading ? (
					<RowsSkeleton rows={2} />
				) : clusters.length === 0 ? (
					<EmptyRows
						title='No clusters yet'
						info='Add Lekki / Ikoyi and Ikeja / Opebi. Until a cluster is live, discovery shows the waitlist to everyone.'
					/>
				) : (
					<div className='grid gap-3 md:gap-4 lg:grid-cols-2'>
						{clusters.map((cluster) => {
							const inside = located.filter(({ point }) => point && haversineKm(point, cluster.centre) <= cluster.radiusKm);
							const areasInside = areas.filter((area) => haversineKm(area.centre, cluster.centre) <= cluster.radiusKm);
							return (
								<section
									key={cluster.id}
									className='flex flex-col gap-3 rounded-3xl border border-black/[0.06] bg-surface-raised p-5 shadow-card'>
									<div className='flex items-start justify-between gap-3'>
										<div>
											<p className='font-bold text-ink'>{cluster.name}</p>
											<p className='font-mono text-xs text-subtle'>
												{formatLatLng(cluster.centre)} · {cluster.radiusKm} km
											</p>
										</div>
										<Pill tone={cluster.active ? 'success' : 'neutral'}>{cluster.active ? 'live' : 'not live'}</Pill>
									</div>
									<dl className='grid grid-cols-2 gap-3 border-t border-line/60 pt-3 text-xs'>
										<div>
											<dt className='text-subtle'>Bookable locations inside</dt>
											<dd className='mt-0.5 font-semibold text-ink'>
												{count(inside.length)}
												{inside.length > 0 && (
													<span className='font-normal text-subtle'> · {inside.map(({ location }) => location.name).join(', ')}</span>
												)}
											</dd>
										</div>
										<div>
											<dt className='text-subtle'>Areas inside</dt>
											<dd className='mt-0.5 font-semibold text-ink'>
												{areasInside.length ? areasInside.map((a) => a.name).join(', ') : 'None'}
											</dd>
										</div>
									</dl>
									<button onClick={() => setEditingCluster(cluster)} className={`${linkButtonClass} self-start`}>
										<Pencil className='h-3.5 w-3.5' />
										Edit
									</button>
								</section>
							);
						})}
					</div>
				)}

				<div className='mt-2 flex flex-wrap items-center justify-between gap-3'>
					<div>
						<h2 className='text-base font-bold text-ink'>Areas</h2>
						<p className='text-xs text-subtle'>
							The short list players pick from when they don’t share their location.
						</p>
					</div>
					<button onClick={() => setEditingArea(null)} className={secondaryButtonClass}>
						<Plus className='h-4 w-4' />
						Add area
					</button>
				</div>
				{areas.length === 0 ? (
					<EmptyRows
						title='No areas yet'
						info='Add the neighbourhoods players can pick from, e.g. Lekki, Ikoyi, Victoria Island, Ikeja, Opebi, Yaba.'
					/>
				) : (
					<ul className='overflow-hidden rounded-[20px] bg-surface-raised ring-1 ring-black/[0.06]'>
						{areas.map((area) => {
							const inClusters = clustersAt(area.centre, live);
							return (
								<li key={area.id} className='flex flex-wrap items-center justify-between gap-3 border-b border-line/60 px-4 py-3 last:border-b-0'>
									<div>
										<p className='text-sm font-semibold text-ink'>{area.name}</p>
										<p className='font-mono text-xs text-subtle'>{formatLatLng(area.centre)}</p>
									</div>
									<div className='flex items-center gap-2'>
										{inClusters.length ? (
											<Pill tone='success'>{inClusters.map((c) => c.name).join(', ')}</Pill>
										) : (
											<Pill tone='neutral'>Waitlist</Pill>
										)}
										<button onClick={() => setEditingArea(area)} className={linkButtonClass}>
											<Pencil className='h-3.5 w-3.5' />
											Edit
										</button>
									</div>
								</li>
							);
						})}
					</ul>
				)}
			</div>

			{editingCluster !== undefined && <ClusterDialog cluster={editingCluster} onClose={() => setEditingCluster(undefined)} />}
			{editingArea !== undefined && <AreaDialog area={editingArea} onClose={() => setEditingArea(undefined)} />}
		</NavWrapper>
	);
};

export default AdminVenueClusters;
