# Admin backoffice: backend contract

The `turftribe-backend` endpoints this app calls, and the permission each one
needs. Response shapes are in `src/features/admin/types.ts`.

## Permissions

The backend keeps one permission list (`src/constants/permissions.ts`):
community permissions for staff roles, and platform permissions for the
backoffice. A platform role (`user.role`) grants platform permissions through
`PLATFORM_ROLE_PERMISSIONS`; today `admin` and `superadmin` get all of them.
`AuthGuard` enforces them on every request through `@RequirePermissions`.

Login returns the granted list as `platformPermissions`. The app reads it
through `usePermissions()` (`src/hooks/usePermissions.ts`):

- sign-in only starts a session when the list isn't empty;
- the sidebar shows only the pages the user can open (`src/lib/admin.tsx`);
- the layout redirects away from a page the user can't open;
- the user sheet loads recent payments only with `platform:payments`.

Users who signed in before `platformPermissions` existed must sign in again.

| Permission | Unlocks |
| --- | --- |
| `platform:overview` | Dashboard |
| `platform:communities` | Communities, their status and fee |
| `platform:users` | Users and user detail |
| `platform:payments` | Payments, and a user's recent payments |
| `platform:sports` | Sports |
| `platform:merch` | Merchandise: products, stock, orders, vendors, placements (new; add to the backend enum) |
| `platform:payouts` | Approving game payouts (not in this app yet) |
| `platform:subscriptions` | Subscription plans (not in this app yet) |

To make the first admin, set the role directly:
`db.users.updateOne({ email: '<admin email>' }, { $set: { role: 'superadmin' } })`,
then sign in again.

## Endpoints

Only the overview and the sport catalogue are backoffice-specific. Lists of
communities, users and payments reuse the community app's endpoints:
`view=platform` switches them to the platform-wide view and requires the
matching permission. Lists take `page`, `limit` and `q` (search) and return
`{ data, pagination }`.

| Page | Request | Permission |
| --- | --- | --- |
| Dashboard | `GET /admin/overview` | `platform:overview` |
| Communities | `GET /communities?view=platform&q&status&category` | `platform:communities` |
| | `PATCH /communities/:id/status` `{ status: 'active' \| 'inactive' }` | `platform:communities` |
| | `PUT /commissions` `{ communityId, feeType: 'flat', platformFee, actionType }` | `platform:communities` |
| Users | `GET /users?view=platform&q&userType` | `platform:users` |
| | `GET /users/:id?view=platform` | `platform:users` |
| Payments | `GET /payments/history?view=platform&q&type&status&communityId&userId&from&to` | `platform:payments` |
| Sports | `GET /sports`, `POST /sports`, `PUT /sports/:id` | `platform:sports` |

## How the numbers are counted

Amounts are in naira, as stored. "This month" and monthly buckets use
`Africa/Lagos`.

- **Processed** (money players paid through the platform) is the union of
  game bookings (`attendees`, excluding manual bookings, amount
  `amountPaid ?? actualAmount`), paid membership passes and active PRO
  subscriptions. It uses the same expression as the manager payments page,
  so the totals agree. Bundle games already appear as bookings, so bundle
  payments are listed but left out of totals.
- **Revenue** is `attendees.platformFee` on all bookings (manual ones
  included, since the fee comes from the payout pool), plus PRO
  subscriptions. Membership passes carry no platform cut today.
- **Fees.** Checkout charges `commission.platformFee` as a flat naira amount
  per booking. The other commission fields aren't read, so the fee dialog
  only edits `platformFee`, which `PUT /commissions` limits to ₦100–₦5,000
  for flat fees. A community with no commission row
  (`commission: null` in the list) fails checkout; its first save sends
  `actionType: 'create'`, later saves send `'update'`.
- **Community status** is only recorded. Nothing reads it yet, so
  deactivating a community doesn't block discovery, joins or bookings.
- **Payments** list bookings as `success` (rows only exist for successful
  ones). Membership `paid` and subscription `active` show as `success`.
  `refunded` matches nothing, as refunds aren't recorded. The list also
  returns `summary` (`count`, `amount`, `platformFee`) for the filtered set.
- **Sports.** A sport's `key` is fixed once created, because communities
  store it as their `category`. At most 3 headline stats, and each stat key
  equals its lowercased label.

## How to test

1. Run the backend locally (port 3000) and give a local test user
   `role: 'superadmin'`.
2. Start this app on a different host so it doesn't collide with the
   production session cookie:
   `NEXT_PUBLIC_API_URL=http://localhost:3000 npx next dev -p 3005`, then open
   `http://127.0.0.1:3005`.
3. Sign in and open each page.
4. Cross-check one community: its `processed` on Communities must equal
   `collected` from `GET /communities/:id/bookings/summary`.

## Merchandise (v1)

None of these endpoints exist yet; the pages show "Waiting on the backend"
until they do. Shapes are in `src/features/merch/types.ts`. Amounts are in
naira; commission rates are percentages (`15` = 15%).

**Vendor scoping.** Every product, variant, order, payout and audit row
carries a `vendorId`. A caller with `platform:merch` sees every vendor; a
vendor user (v1.5) will see only rows with their own `vendorId`, enforced on
the backend. That's why these endpoints take no `view=platform`.

| Page | Request | Notes |
| --- | --- | --- |
| Vendors | `GET /merch/vendors` → `{ data: Vendor[] }` | Includes all-time `gmv`, `commission`, `productsCount` |
| | `POST /merch/vendors`, `PUT /merch/vendors/:id` (`VendorInput`) | `paystackSubaccountCode` is `ACCT_…`; `null` blocks checkout |
| Products | `GET /merch/products?q&vendorId&status&category&page&limit` → `{ data, pagination }` | `q` matches name and SKU |
| | `POST /merch/products`, `PUT /merch/products/:id` (`ProductInput`) | Variants are sent in full; match by `id`, create rows without one, delete missing ones |
| | `POST /merch/products/:id/duplicate` → `Product` | Copy as `draft`, SKUs suffixed `-COPY` |
| | `PATCH /merch/products/:id/status` `{ status: 'draft' \| 'live' \| 'hidden' \| 'archived' }` | |
| | `GET /merch/products/:id/audit` → `{ data: AuditEntry[] }` | Newest first |
| Stock & prices | `GET /merch/variants?vendorId&q` → `{ data: VariantRow[] }` | Every non-archived variant |
| | `PATCH /merch/variants` `{ updates: [{ id, price?, quantity? }] }` | All-or-nothing; one audit entry per changed field |
| Placements | `GET /merch/placements` → `{ data: Placement[] }`, `PUT /merch/placements/:key` `{ enabled }` | Keys: `game_confirmation`, `game_details`, `player_home`, `venue_booking` |
| Orders | `GET /merch/orders?q&vendorId&status&from&to&page&limit` → `{ data, pagination, summary }` | `q` matches reference, buyer and SKU; newest first; `limit` up to 1000 (CSV export and statements) |
| | `PATCH /merch/orders/:id/status` `{ status, note? }` | See transitions below |

**Rules the backend owns** (the UI reflects them but doesn't enforce them):

- **Status.** `sold_out` is derived: a `live` product whose variants are all
  at 0. The player app hides sold-out variants, and hides the product once
  every variant is sold out. An inactive vendor hides all its products.
- **Commission.** `product.commissionRate ?? vendor.commissionRate`, captured
  on the order at payment so later rate changes don't rewrite history.
- **Stock.** Reserve on checkout, decrement on payment, restore on
  cancellation. `reserved` on a variant is the count held by unpaid checkouts.
  Price and quantity changes, from any route, write an `AuditEntry` with the
  actor.
- **Orders.** `awaiting_confirmation → confirmed → dispatched → delivered`;
  `cancelled` is allowed from `awaiting_confirmation` or `confirmed` and
  refunds the buyer in full. An order still awaiting confirmation at
  `confirmBy` is cancelled and refunded automatically. Each change notifies
  the buyer and appends to `history`. New orders email the vendor's
  `contactEmail` (SES) with the SKUs.
- **Summary.** `count`, `gmv` (sum of `total`) and `commission` cover paid
  orders matching the filters, excluding cancelled ones. Dates use
  `Africa/Lagos`.
- **Low stock.** Notify admins when a variant's `quantity` drops below its
  `lowStockThreshold`.
- **Payment split.** Paystack split with the vendor's subaccount. Confirm with
  Paystack how refunds behave on split transactions before building
  cancellation; if the vendor share can't be reversed cleanly, hold funds and
  settle after delivery instead (the PRD's fallback).

