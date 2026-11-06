import type { MerchOrder, OrdersParams } from '@/features/merch/types';
import { downloadCsv, orderStatusLabel, toCsv } from '../shared';

// Exports page through the list in one request; v1 volumes sit far below this.
export const EXPORT_LIMIT = 1000;

export const exportParams = (params: OrdersParams): OrdersParams => ({ ...params, page: 1, limit: EXPORT_LIMIT });

// One line per item, so the vendor can match SKUs; order totals repeat on
// each of an order's lines and are labelled as such.
export const downloadOrdersCsv = (filename: string, orders: MerchOrder[]) => {
	const header = [
		'reference',
		'date',
		'status',
		'vendor',
		'buyer',
		'phone',
		'delivery_address',
		'sku',
		'product',
		'size',
		'colour',
		'quantity',
		'unit_price',
		'order_subtotal',
		'order_delivery_fee',
		'order_total',
		'order_commission',
		'order_vendor_share',
	];
	const rows = orders.flatMap((order) =>
		order.items.map((item) => [
			order.reference,
			order.createdAt,
			orderStatusLabel(order.status),
			order.vendor.name,
			order.buyer.name,
			order.buyer.phone,
			order.deliveryAddress,
			item.sku,
			item.name,
			item.size,
			item.colour,
			item.quantity,
			item.unitPrice,
			order.subtotal,
			order.deliveryFee,
			order.total,
			order.commission,
			order.vendorShare,
		])
	);
	downloadCsv(filename, toCsv(header, rows));
};
