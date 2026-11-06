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
| `platform:venues` | Venues: organisations, places, locations, calendar, bookings, clusters, venue fee (new; add to the backend enum) |
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

## Venues (v1)

None of these endpoints exist yet; the pages show "Waiting on the backend"
until they do, and in development they're served by
`src/features/venues/demo.ts` (`NEXT_PUBLIC_VENUES_DEMO=true|false`
overrides). Shapes are in `src/features/venues/types.ts`. Amounts are in
naira; fee rates are percentages (`10` = 10%). Times are stored in UTC and
days are counted in `Africa/Lagos`.

**Model.** A venue is an organisation with `type: 'venue'` (communities
become `type: 'community'` organisations later; a user can belong to many and
switches between them). It owns **Places** (a site, with address text and
optional coordinates) and **Locations** (one bookable pitch or court, under a
place or standalone). Each Location has its own **Slots**. There's no
country/state/LGA hierarchy: coordinates plus admin-defined clusters.

**TurfTriibe is the first venue owner.** Create its organisation with
`platformOwned: true` (the Venues page has a "Set up TurfTriibe" button that
does this when none exists, or seed it). There can be only one: a second
`POST` with `platformOwned: true` returns 409. It has no owner users; anyone
with `platform:venues` manages it. Its bookings carry `fee: 0` and settle in
full to TurfTriibe's main Paystack balance, so they're reported as
`ownVenueRevenue`, not fees.

| Page | Request | Notes |
| --- | --- | --- |
| Venues | `GET /venues/overview` → `VenueOverview` | Also feeds the dashboard strip |
| | `GET /venues/organisations` → `{ data: VenueOrganisation[] }` | Platform-owned first; includes `stats` |
| | `GET /venues/organisations/:id`, `POST /venues/organisations`, `PUT /venues/organisations/:id` (`VenueOrganisationInput`) | `ownerEmail` adds an owner (invite if no account). `platformOwned` is fixed at creation |
| Venue | `GET /venues/places?organisationId`, `POST /venues/places`, `PUT /venues/places/:id` (`PlaceInput`) | |
| | `GET /venues/locations?organisationId`, `POST /venues/locations`, `PUT /venues/locations/:id` (`LocationInput`) | Response includes `scheduledUntil` (last slot's end) |
| | `POST /venues/locations/:id/schedule` (`ScheduleInput`) → `{ created, skipped }` | Skips any slot overlapping an existing one, so it's safe to re-run |
| Calendar | `GET /venues/slots?organisationId&locationIds&from&to` → `{ data: Slot[] }` | `locationIds` comma-separated; `from`/`to` are inclusive dates. `status` is derived (see below); `booking` included |
| | `PATCH /venues/slots` (`SlotAction`) → `{ updated, skipped }` | `reprice`/`block`: open upcoming slots only. `reopen`: blocked or cancelled upcoming slots. `cancel`: cancels the whole booking behind each slot (upcoming only), refunds online payments, `reopen` decides whether its slots go back on sale |
| | `POST /venues/slots/block-days` `{ locationIds, dates, reason }` → `{ updated, skipped }` | Blocks every open slot on those days |
| | `POST /venues/bookings` (`ManualBookingInput`) → `{ created, skippedWeeks }` | Manual (walk-in/phone) booking of back-to-back open slots on one location; `weeks > 1` repeats weekly and skips weeks where any slot is taken. No fee |
| Bookings | `GET /venues/bookings?q&organisationId&status&source&from&to&page&limit` → `{ data, pagination, summary }` | `q` matches reference, booker and location; newest slot first |
| Clusters & fees | `GET /venues/settings`, `PUT /venues/settings` `{ defaultFeeRate }` | Per-venue override is `feeRate` on the organisation |
| | `GET /venues/clusters`, `POST`, `PUT /venues/clusters/:id` (`ClusterInput`) | |
| | `GET /venues/areas`, `POST`, `PUT /venues/areas/:id` (`AreaInput`) | Seed Lekki, Ikoyi, Victoria Island, Ikeja, Opebi, Yaba |

**Rules the backend owns** (the UI reflects them but doesn't enforce them):

- **Slot status.** Stored as `open`, `booked`, `blocked` or `cancelled`. A
  booked slot reads `in_progress` from its start and `completed` from its
  end; completed and in-progress slots are immutable from every route. A slot
  becomes `booked` only after Paystack confirms payment (or a manual
  booking). Hold slots during checkout with a short Redis lock so two
  bookers can't pay for the same slot.
- **Booking status.** `upcoming`, `in_progress`, `completed` from its slots'
  times; `cancelled` once cancelled.
- **Fees.** `fee = amount × (venue.feeRate ?? settings.defaultFeeRate) / 100`
  on online bookings at partner venues, captured at payment so later changes
  don't rewrite history, and taken through a Paystack split with the venue's
  subaccount (no subaccount = no online booking). Manual bookings and
  platform-owned venues: `fee = 0`.
- **Summary.** `count` excludes cancelled bookings; `gmv` and `fees` cover
  online ones; `manualValue` sums manual ones.
- **Overview.** "This month" by slot start in `Africa/Lagos`.
  `peakUtilisation` = booked ÷ (open + booked) for slots starting 17:00–22:00
  over the last 28 days.
- **Discovery.** A Location is searchable only with coordinates (its own, else
  its place's) and only inside an active cluster. Distance is haversine,
  server-side; default radius 10 km. Inactive organisations or locations are
  hidden.
