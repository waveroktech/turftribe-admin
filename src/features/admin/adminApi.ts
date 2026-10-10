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

// Drop empty filters so the backend never sees search= or status=.
const clean = (params: object) =>
	Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''));

export const adminApi = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getAdminOverview: builder.query<AdminOverview, void>({
			query: () => '/admin/overview',
			transformResponse: (res: { data: AdminOverview }) => res.data,
			providesTags: ['admin'],
		}),

		getAdminCommunities: builder.query<AdminPage<AdminCommunity>, AdminCommunitiesParams>({
			query: (params) => ({ url: '/admin/communities', params: clean(params) }),
			providesTags: ['admin'],
		}),
		updateCommunityStatus: builder.mutation<void, { id: string; status: CommunityStatus }>({
			query: ({ id, status }) => ({
				url: `/admin/communities/${id}/status`,
				method: 'PATCH',
				body: { status },
			}),
			invalidatesTags: ['admin'],
		}),
		updateCommunityCommission: builder.mutation<void, { id: string; commission: CommunityCommission }>({
			query: ({ id, commission }) => ({
				url: `/admin/communities/${id}/commission`,
				method: 'PUT',
				body: commission,
			}),
			invalidatesTags: ['admin'],
		}),

		getAdminUsers: builder.query<AdminPage<AdminUser>, AdminUsersParams>({
			query: (params) => ({ url: '/admin/users', params: clean(params) }),
			providesTags: ['admin'],
		}),
		getAdminUser: builder.query<AdminUserDetail, string>({
			query: (id) => `/admin/users/${id}`,
			transformResponse: (res: { data: AdminUserDetail }) => res.data,
			providesTags: ['admin'],
		}),

		getAdminPayments: builder.query<AdminPaymentsPage, AdminPaymentsParams>({
			query: (params) => ({ url: '/admin/payments', params: clean(params) }),
			providesTags: ['admin'],
		}),

		getAdminSports: builder.query<AdminSport[], void>({
			query: () => '/admin/sports',
			transformResponse: (res: { data: AdminSport[] }) => res.data,
			providesTags: ['admin'],
		}),
		createSport: builder.mutation<AdminSport, SportInput>({
			query: (body) => ({ url: '/admin/sports', method: 'POST', body }),
			invalidatesTags: ['admin'],
		}),
		updateSport: builder.mutation<AdminSport, { id: string; body: SportInput }>({
			query: ({ id, body }) => ({ url: `/admin/sports/${id}`, method: 'PUT', body }),
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
