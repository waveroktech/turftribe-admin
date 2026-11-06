# TurfTribe Admin

Platform backoffice for TurfTribe: overview dashboard, communities (status and commission), users, payments, sports, venues and merchandise.

Only accounts whose platform role (`admin` or `superadmin`) grants backoffice permissions can sign in, and each page needs its own permission. The app reads them with `usePermissions()`; the backend enforces the same permissions on every request. See [docs/admin-backend-contract.md](docs/admin-backend-contract.md) for the endpoints and permissions.

## Development

```bash
npm install
npm run dev
```

The API base URL comes from `NEXT_PUBLIC_API_URL` and falls back to `https://api.turftriibe.com`.

## Routes

| Route | Page |
| --- | --- |
| `/sign-in` | Admin sign-in |
| `/admin` | Overview dashboard |
| `/admin/communities` | Communities, status and fee commission |
| `/admin/users` | Users and user detail sheet |
| `/admin/payments` | Platform-wide payments |
| `/admin/sports` | Sport catalogue and editor |
| `/admin/venues` | Venue organisations (TurfTriibe first), with booking GMV and fees |
| `/admin/venues/:id` | A venue's places and locations, schedule generator, fee override |
| `/admin/venues/calendar` | Day, week and month calendar: reprice, block, manual and weekly bookings, cancellations |
| `/admin/venues/bookings` | Venue bookings with GMV, fees and manual totals |
| `/admin/venues/clusters` | Launch clusters, fallback areas and the default venue fee |
| `/admin/merch` | Merchandise products, editor, change history and placements |
| `/admin/merch/stock` | Bulk stock and price editing, CSV import/export |
| `/admin/merch/orders` | Merchandise orders, status updates, export |
| `/admin/merch/vendors` | Vendors, commission, Paystack subaccount, statements |
