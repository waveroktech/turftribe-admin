import { apiSlice } from '../api/apiSlice';

export const authApiSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		login: builder.mutation({
			query: (body: { email: string; password: string }) => ({
				url: '/auth/login',
				method: 'POST',
				body,
			}),
		}),
	}),
});

export const { useLoginMutation } = authApiSlice;
