import { apiSlice } from '@/features/api/apiSlice';
import type { AdminPage } from '@/features/admin/types';
import type {
	AuditEntry,
	EditableProductStatus,
	MerchOrder,
	OrderStatus,
	OrdersPage,
	OrdersParams,
	Placement,
	PlacementKey,
	Product,
	ProductInput,
	ProductsParams,
	VariantRow,
	VariantUpdate,
	VariantsParams,
	Vendor,
	VendorInput,
} from './types';

// Drop empty filters so the backend never sees q= or status=.
const clean = (params: object) =>
	Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== ''));

// Endpoints from the "Merchandise" section of docs/admin-backend-contract.md.
// The backend scopes every list to the caller's vendor unless they hold
// platform:merch, so the same endpoints serve vendor users in v1.5.
export const merchApi = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getVendors: builder.query<Vendor[], void>({
			query: () => '/merch/vendors',
			transformResponse: (res: { data: Vendor[] }) => res.data,
			providesTags: ['merch'],
		}),
		createVendor: builder.mutation<Vendor, VendorInput>({
			query: (body) => ({ url: '/merch/vendors', method: 'POST', body }),
			invalidatesTags: ['merch'],
		}),
		updateVendor: builder.mutation<Vendor, { id: string; body: VendorInput }>({
			query: ({ id, body }) => ({ url: `/merch/vendors/${id}`, method: 'PUT', body }),
			invalidatesTags: ['merch'],
		}),

		getProducts: builder.query<AdminPage<Product>, ProductsParams>({
			query: (params) => ({ url: '/merch/products', params: clean(params) }),
			providesTags: ['merch'],
		}),
		createProduct: builder.mutation<Product, ProductInput>({
			query: (body) => ({ url: '/merch/products', method: 'POST', body }),
			invalidatesTags: ['merch'],
		}),
		updateProduct: builder.mutation<Product, { id: string; body: ProductInput }>({
			query: ({ id, body }) => ({ url: `/merch/products/${id}`, method: 'PUT', body }),
			invalidatesTags: ['merch'],
		}),
		// Copies the product as a draft; SKUs get a "-COPY" suffix to stay unique.
		duplicateProduct: builder.mutation<Product, string>({
			query: (id) => ({ url: `/merch/products/${id}/duplicate`, method: 'POST' }),
			invalidatesTags: ['merch'],
		}),
		updateProductStatus: builder.mutation<void, { id: string; status: EditableProductStatus | 'archived' }>({
			query: ({ id, status }) => ({ url: `/merch/products/${id}/status`, method: 'PATCH', body: { status } }),
			invalidatesTags: ['merch'],
		}),
		getProductAudit: builder.query<AuditEntry[], string>({
			query: (id) => `/merch/products/${id}/audit`,
			transformResponse: (res: { data: AuditEntry[] }) => res.data,
			providesTags: ['merch'],
		}),

		getVariants: builder.query<VariantRow[], VariantsParams>({
			query: (params) => ({ url: '/merch/variants', params: clean(params) }),
			transformResponse: (res: { data: VariantRow[] }) => res.data,
			providesTags: ['merch'],
		}),
		// One request for the whole bulk edit; each change is audit-logged.
		updateVariants: builder.mutation<void, VariantUpdate[]>({
			query: (updates) => ({ url: '/merch/variants', method: 'PATCH', body: { updates } }),
			invalidatesTags: ['merch'],
		}),

		getPlacements: builder.query<Placement[], void>({
			query: () => '/merch/placements',
			transformResponse: (res: { data: Placement[] }) => res.data,
			providesTags: ['merch'],
		}),
		updatePlacement: builder.mutation<void, { key: PlacementKey; enabled: boolean }>({
			query: ({ key, enabled }) => ({ url: `/merch/placements/${key}`, method: 'PUT', body: { enabled } }),
			invalidatesTags: ['merch'],
		}),

		getOrders: builder.query<OrdersPage, OrdersParams>({
			query: (params) => ({ url: '/merch/orders', params: clean(params) }),
			providesTags: ['merch'],
		}),
		// Cancelling refunds the buyer and restores stock on the backend.
		updateOrderStatus: builder.mutation<MerchOrder, { id: string; status: OrderStatus; note?: string }>({
			query: ({ id, ...body }) => ({ url: `/merch/orders/${id}/status`, method: 'PATCH', body }),
			invalidatesTags: ['merch'],
		}),
	}),
});

export const {
	useGetVendorsQuery,
	useCreateVendorMutation,
	useUpdateVendorMutation,
	useGetProductsQuery,
	useCreateProductMutation,
	useUpdateProductMutation,
	useDuplicateProductMutation,
	useUpdateProductStatusMutation,
	useGetProductAuditQuery,
	useGetVariantsQuery,
	useUpdateVariantsMutation,
	useGetPlacementsQuery,
	useUpdatePlacementMutation,
	useGetOrdersQuery,
	useLazyGetOrdersQuery,
	useUpdateOrderStatusMutation,
} = merchApi;
