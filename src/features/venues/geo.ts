import type { Cluster, LatLng, Place, VenueLocation } from './types';

// Great-circle distance in km. The backend ranks discovery results the same
// way, so there's no paid distance API anywhere.
export const haversineKm = (a: LatLng, b: LatLng) => {
	const R = 6371;
	const rad = (deg: number) => (deg * Math.PI) / 180;
	const dLat = rad(b.lat - a.lat);
	const dLng = rad(b.lng - a.lng);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(h));
};

/** A Location's own coordinates, else its Place's. null = not searchable. */
export const locationCoordinates = (location: VenueLocation, places: Pick<Place, 'id' | 'coordinates'>[]) =>
	location.coordinates ?? places.find((place) => place.id === location.placeId)?.coordinates ?? null;

export const clustersAt = (point: LatLng, clusters: Cluster[]) =>
	clusters.filter((cluster) => haversineKm(point, cluster.centre) <= cluster.radiusKm);

export const isLatLng = (value: Partial<LatLng> | null | undefined): value is LatLng =>
	!!value &&
	typeof value.lat === 'number' &&
	typeof value.lng === 'number' &&
	Number.isFinite(value.lat) &&
	Number.isFinite(value.lng) &&
	Math.abs(value.lat) <= 90 &&
	Math.abs(value.lng) <= 180;

export const formatLatLng = (point: LatLng) => `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
