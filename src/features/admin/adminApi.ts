import { apiSlice } from '@/features/api/apiSlice';
import {
	AdminCommunitiesParams,
	AdminCommunity,
	AdminOverview,
	AdminPage,
	AdminPaymentsPage,
	AdminPaymentsParams,
	AdminSport,
	AdminUser,
	AdminUserDetail,
	AdminUsersParams,
	CommunityCommission,
	CommunityStatus,
	SportInput,
} from './types';

// Drop empty filters so the backend never sees q= or status=.
const clean = (params: object) =>
	Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''));

// Communities, users and payments reuse the community app's endpoints;
// view=platform switches them to the platform-wide backoffice view.
const platform = (params: object = {}) => ({ ...clean(params), view: 'platform' });

export const adminApi = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getAdminOverview: builder.query<AdminOverview, void>({
			query: () => '/admin/overview',
			transformResponse: (res: { data: AdminOverview }) => res.data,
			providesTags: ['admin'],
		}),

		getAdminCommunities: builder.query<AdminPage<AdminCommunity>, AdminCommunitiesParams>({
			query: (params) => ({ url: '/communities', params: platform(params) }),
			providesTags: ['admin'],
		}),
		updateCommunityStatus: builder.mutation<void, { id: string; status: CommunityStatus }>({
			query: ({ id, status }) => ({
				url: `/communities/${id}/status`,
				method: 'PATCH',
				body: { status },
			}),
			invalidatesTags: ['admin'],
		}),
		// The existing commissions endpoint. Legacy communities have no
		// commission row yet, so their first save creates one.
		updateCommunityCommission: builder.mutation<
			void,
			{ id: string; commission: CommunityCommission; exists: boolean }
		>({
			query: ({ id, commission, exists }) => ({
				url: '/commissions',
				method: 'PUT',
				body: {
					communityId: id,
					feeType: 'flat',
					platformFee: commission.platformFee,
					actionType: exists ? 'update' : 'create',
				},
			}),
			invalidatesTags: ['admin'],
		}),

		getAdminUsers: builder.query<AdminPage<AdminUser>, AdminUsersParams>({
			query: (params) => ({ url: '/users', params: platform(params) }),
			providesTags: ['admin'],
		}),
		getAdminUser: builder.query<AdminUserDetail, string>({
			query: (id) => ({ url: `/users/${id}`, params: platform() }),
			transformResponse: (res: { data: AdminUserDetail }) => res.data,
			providesTags: ['admin'],
		}),

		getAdminPayments: builder.query<AdminPaymentsPage, AdminPaymentsParams>({
			query: (params) => ({ url: '/payments/history', params: platform(params) }),
			providesTags: ['admin'],
		}),

		getAdminSports: builder.query<AdminSport[], void>({
			query: () => '/sports',
			transformResponse: (res: { data: AdminSport[] }) => res.data,
			providesTags: ['admin'],
		}),
		createSport: builder.mutation<AdminSport, SportInput>({
			query: (body) => ({ url: '/sports', method: 'POST', body }),
			invalidatesTags: ['admin'],
		}),
		updateSport: builder.mutation<AdminSport, { id: string; body: SportInput }>({
			query: ({ id, body }) => ({ url: `/sports/${id}`, method: 'PUT', body }),
			invalidatesTags: ['admin'],
		}),
	}),
});

export const {
	useGetAdminOverviewQuery,
	useGetAdminCommunitiesQuery,
	useUpdateCommunityStatusMutation,
	useUpdateCommunityCommissionMutation,
	useGetAdminUsersQuery,
	useGetAdminUserQuery,
	useGetAdminPaymentsQuery,
	useGetAdminSportsQuery,
	useCreateSportMutation,
	useUpdateSportMutation,
} = adminApi;
