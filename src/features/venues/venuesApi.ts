import { apiSlice } from '@/features/api/apiSlice';
import type {
	Area,
	AreaInput,
	BlockDaysInput,
	Cluster,
	ClusterInput,
	LocationInput,
	ManualBookingInput,
	ManualBookingResult,
	Place,
	PlaceInput,
	ScheduleInput,
	ScheduleResult,
	Slot,
	SlotAction,
	SlotActionResult,
	SlotsParams,
	VenueBookingsPage,
	VenueBookingsParams,
	VenueLocation,
	VenueOrganisation,
	VenueOrganisationInput,
	VenueOverview,
	VenueSettings,
} from './types';

const clean = (params: object) =>
	Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''));

// Endpoints from the "Venues" section of docs/admin-backend-contract.md. The
// backend scopes each list to the caller's organisations unless they hold
// platform:venues, so venue owners can use the same endpoints later.
export const venuesApi = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getVenueOverview: builder.query<VenueOverview, void>({
			query: () => '/venues/overview',
			providesTags: ['venues'],
		}),
		getVenueSettings: builder.query<VenueSettings, void>({
			query: () => '/venues/settings',
			providesTags: ['venues'],
		}),
		updateVenueSettings: builder.mutation<VenueSettings, VenueSettings>({
			query: (body) => ({ url: '/venues/settings', method: 'PUT', body }),
			invalidatesTags: ['venues'],
		}),

		getVenueOrganisations: builder.query<VenueOrganisation[], void>({
			query: () => '/venues/organisations',
			transformResponse: (res: { data: VenueOrganisation[] }) => res.data,
			providesTags: ['venues'],
		}),
		getVenueOrganisation: builder.query<VenueOrganisation, string>({
			query: (id) => `/venues/organisations/${id}`,
			providesTags: ['venues'],
		}),
		createVenueOrganisation: builder.mutation<VenueOrganisation, VenueOrganisationInput>({
			query: (body) => ({ url: '/venues/organisations', method: 'POST', body }),
			invalidatesTags: ['venues'],
		}),
		updateVenueOrganisation: builder.mutation<VenueOrganisation, { id: string; body: VenueOrganisationInput }>({
			query: ({ id, body }) => ({ url: `/venues/organisations/${id}`, method: 'PUT', body }),
			invalidatesTags: ['venues'],
		}),

		getPlaces: builder.query<Place[], { organisationId?: string }>({
			query: (params) => ({ url: '/venues/places', params: clean(params) }),
			transformResponse: (res: { data: Place[] }) => res.data,
			providesTags: ['venues'],
		}),
		createPlace: builder.mutation<Place, PlaceInput>({
			query: (body) => ({ url: '/venues/places', method: 'POST', body }),
			invalidatesTags: ['venues'],
		}),
		updatePlace: builder.mutation<Place, { id: string; body: PlaceInput }>({
			query: ({ id, body }) => ({ url: `/venues/places/${id}`, method: 'PUT', body }),
			invalidatesTags: ['venues'],
		}),

		getLocations: builder.query<VenueLocation[], { organisationId?: string }>({
			query: (params) => ({ url: '/venues/locations', params: clean(params) }),
			transformResponse: (res: { data: VenueLocation[] }) => res.data,
			providesTags: ['venues'],
		}),
		createLocation: builder.mutation<VenueLocation, LocationInput>({
			query: (body) => ({ url: '/venues/locations', method: 'POST', body }),
			invalidatesTags: ['venues'],
		}),
		updateLocation: builder.mutation<VenueLocation, { id: string; body: LocationInput }>({
			query: ({ id, body }) => ({ url: `/venues/locations/${id}`, method: 'PUT', body }),
			invalidatesTags: ['venues'],
		}),
		generateSchedule: builder.mutation<ScheduleResult, { locationId: string; body: ScheduleInput }>({
			query: ({ locationId, body }) => ({ url: `/venues/locations/${locationId}/schedule`, method: 'POST', body }),
			invalidatesTags: ['venues'],
		}),

		getSlots: builder.query<Slot[], SlotsParams>({
			query: (params) => ({ url: '/venues/slots', params: clean(params) }),
			transformResponse: (res: { data: Slot[] }) => res.data,
			providesTags: ['venues'],
		}),
		// Completed and in-progress slots are immutable; the backend skips them.
		updateSlots: builder.mutation<SlotActionResult, SlotAction>({
			query: (body) => ({ url: '/venues/slots', method: 'PATCH', body }),
			invalidatesTags: ['venues'],
		}),
		blockDays: builder.mutation<SlotActionResult, BlockDaysInput>({
			query: (body) => ({ url: '/venues/slots/block-days', method: 'POST', body }),
			invalidatesTags: ['venues'],
		}),
		createManualBooking: builder.mutation<ManualBookingResult, ManualBookingInput>({
			query: (body) => ({ url: '/venues/bookings', method: 'POST', body }),
			invalidatesTags: ['venues'],
		}),

		getVenueBookings: builder.query<VenueBookingsPage, VenueBookingsParams>({
			query: (params) => ({ url: '/venues/bookings', params: clean(params) }),
			providesTags: ['venues'],
		}),

		getClusters: builder.query<Cluster[], void>({
			query: () => '/venues/clusters',
			transformResponse: (res: { data: Cluster[] }) => res.data,
			providesTags: ['venues'],
		}),
		createCluster: builder.mutation<Cluster, ClusterInput>({
			query: (body) => ({ url: '/venues/clusters', method: 'POST', body }),
			invalidatesTags: ['venues'],
		}),
		updateCluster: builder.mutation<Cluster, { id: string; body: ClusterInput }>({
			query: ({ id, body }) => ({ url: `/venues/clusters/${id}`, method: 'PUT', body }),
			invalidatesTags: ['venues'],
		}),

		getAreas: builder.query<Area[], void>({
			query: () => '/venues/areas',
			transformResponse: (res: { data: Area[] }) => res.data,
			providesTags: ['venues'],
		}),
		createArea: builder.mutation<Area, AreaInput>({
			query: (body) => ({ url: '/venues/areas', method: 'POST', body }),
			invalidatesTags: ['venues'],
		}),
		updateArea: builder.mutation<Area, { id: string; body: AreaInput }>({
			query: ({ id, body }) => ({ url: `/venues/areas/${id}`, method: 'PUT', body }),
			invalidatesTags: ['venues'],
		}),
	}),
});

export const {
	useGetVenueOverviewQuery,
	useGetVenueSettingsQuery,
	useUpdateVenueSettingsMutation,
	useGetVenueOrganisationsQuery,
	useGetVenueOrganisationQuery,
	useCreateVenueOrganisationMutation,
	useUpdateVenueOrganisationMutation,
	useGetPlacesQuery,
	useCreatePlaceMutation,
	useUpdatePlaceMutation,
	useGetLocationsQuery,
	useCreateLocationMutation,
	useUpdateLocationMutation,
	useGenerateScheduleMutation,
	useGetSlotsQuery,
	useUpdateSlotsMutation,
	useBlockDaysMutation,
	useCreateManualBookingMutation,
	useGetVenueBookingsQuery,
	useGetClustersQuery,
	useCreateClusterMutation,
	useUpdateClusterMutation,
	useGetAreasQuery,
	useCreateAreaMutation,
	useUpdateAreaMutation,
} = venuesApi;
