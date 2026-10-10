# Admin backoffice: backend brief

This document is for whoever builds the backend half of the `/admin` backoffice.
The frontend is done, on branch `feat/admin-backoffice` (`src/_pages/admin`,
`src/features/admin`). It calls the endpoints below and shows "Waiting on the
backend" while they return 404. Response shapes must match
`src/features/admin/types.ts`.

Everything here was checked against `turftribe-backend` **`ticketmain`**
(`6f79726`). File and line references point there.

**Conventions**
- Amounts are in **naira**, as stored. Never use `amountCharged`: outside live
  mode it's capped at ₦1,000 (`startCheckout`, `membership.service.ts`).
- Lists return `{ data, pagination }` via `ResponseExtraData`, and take `page`,
  `limit` and, where listed, `search`. Escape regex input.
- "This month" and month buckets use `Africa/Lagos`.

---

## Step 1. Let admins in (blocking, small)

1. **Return `role` from login.** `loginResponseTransformer`
   (`auth.service.ts`, around line 100) destructures and returns a fixed set of
   fields and drops `role`. Add `role` to `ILoginUserData`, the destructure and
   the returned object. Without it the frontend can't recognise an admin, and
   `/admin` redirects to `/dashboard`.
2. **Make the first admin.** Run a one-off update:
   `db.users.updateOne({ email: '<admin email>' }, { $set: { role: 'superadmin' } })`.
   Nothing in the app can grant the role yet. The admin then signs out and in.
3. **Close the open commissions endpoint.** On `CommissionController`
   (`commission/commission.controller.ts`), `@UseGuards(PlatformAdminGuard)` is
   commented out, so any signed-in user can `PUT /commissions` and change any
   community's fee in production today. Uncomment it.

**Verify:** after signing in, the login response contains `"role": "superadmin"`,
and the backoffice sidebar appears at `/admin`.

## Step 2. Admin module skeleton

Create `src/features/admin/` with `AdminController` (`@Controller('admin')`) and
`AdminService`, registered in `features.module.ts` like the other features.
Put `@UseGuards(PlatformAdminGuard)` (`auth/admin.guard.ts`) on the controller
class. The global `AuthGuard` (an `APP_GUARD`) already attaches `req.user`.
`AdminService` reads collections through `MongoDataServices`. It needs
`users`, `communities`, `members`, `attendees`, `matches`, `commissions`,
`membershipPayments` and `subscriptions`.

## Step 3. `GET /admin/overview` (dashboard cards)

Where each number comes from:

| Field | Source |
|---|---|
| `totalUsers` | `users.countDocuments({})` |
| `newUsersThisMonth` | `users` with `createdAt >= start of month` |
| `totalCommunities` / `activeCommunities` | `communities` count, total and `{ status: 'active' }` (see the backfill in step 4) |
| `totalProcessed` | the sum of **all player payments** (definition below) |
| `totalRevenue` | the sum of **platform revenue** (definition below) |
| `totalTransactions` | count of the rows behind `totalProcessed` |
| `totalPaidOut` | `matches` with `payout.status: 'completed'`, summing `ownerFee`. This is the same rule as `getGamePayoutsSummary` (`payment.service.v2.ts:1714`), where a missing `payout.status` counts as completed. |
| `trend[]` | the processed, revenue and new-user figures grouped by month, for the last 12 months, zero-filled, oldest first |
| `topCommunities[]` | the processed and revenue figures grouped by community, top 6 by processed, joined to `communities` for `name` and `category` |

**Player payments, the "processed" figure.** It's the union of:
- **Game bookings:** `attendees` (one row per successful booking), excluding
  manual bookings (`paymentType: 'manual'`). The amount is
  `amountPaid ?? actualAmount`; the community is `beneficiaryId`. Use the same
  expression as `getCommunityBookingsSummary` (`match.service.ts:1523`), so the
  admin totals agree with each manager's payments page. Membership **bundles**
  already appear here, because each game in a bundle creates an attendee
  (`bookBundleItem` → `honourBundleBooking`). Don't count bundle rows from
  `membershippayments` as well, or they're counted twice.
- **Membership passes:** `membershippayments` where `kind: 'pass'` and `status: 'paid'`, summing `amount`.
- **PRO subscriptions:** `subscriptions` where `status: 'active'`, summing `amount`.
  These are ledger rows for past purchases, not current access.

**Platform revenue.** It's the sum of:
- `attendees.platformFee` over **all** bookings, **including manual ones**. On a
  manual booking the platform still takes its fee, from the payout pool
  (`splitCommission`, `payment.service.v2.ts:796`).
- PRO subscription `amount` (all of it is TurfTribe's).
- Membership passes: **confirm with the product owner.** Nothing in
  `membership.service.ts` takes a platform cut of a pass today, so pass revenue
  is 0 unless that changes.

**Indexes:** make sure `attendees.createdAt`, `attendees.beneficiaryId` and
`users.createdAt` are indexed. This endpoint scans them all, so cache the result
for about 5 minutes in Redis (`RedisService` is already wired).

## Step 4. Communities

### `GET /admin/communities?search&status&category&page&limit`
- Aggregate `communities`, `$lookup` the manager (`managerId` to `users`) for
  `name` and `email`, the active member count (`members` with `status: 'active'`
  — legacy members have no status field, so treat a missing status as active),
  the `commissions` row (`productType: 'matches'`) projecting only
  `platformFee`, and `processed` (the attendee sum above, filtered by `beneficiaryId`).
- `search` matches the community name, the manager's name and the manager's
  email. Return `id`, not `_id`.

### `PATCH /admin/communities/:id/status`, body `{ status: 'active' | 'inactive' }`
- **Backfill first.** `status` defaults to `'inactive'` in the schema, and
  `createCommunity` sets `'active'`, but older and onboarded communities may have
  no status or `'inactive'`. Before enforcing anything, run
  `updateMany({ status: { $ne: 'active' } }, { $set: { status: 'active' } })`,
  and confirm the count with the product owner.
- Then enforce it:
  - exclude `status: 'inactive'` from public discovery (`GET /communities`,
    `/communities/fetch-for-anons`, nearMe)
  - reject joins, game creation, bookings and membership checkouts for an
    inactive community with a clear message

### `PUT /admin/communities/:id/commission`, body `{ platformFee: number }`
**How fees work today:** checkout charges `commission.platformFee` as a **flat
naira amount per booking**. `splitCommission` calls `calculateFlatCharges`
(`payment.service.v2.ts:783`), and membership pricing uses `priceFloor` with the
same value. The `feeType`, `maxCap`, `communityFee` and `affectsManualBooking`
fields on the commission row are **never read**. Every new community is created
with `feeType: 'percent', platformFee: 11, maxCap: 1000` (`auth.service.ts:387`,
`community.service.ts:1023`), so it is actually charged **₦11 per booking**.
Check this is intended.

The frontend therefore edits only `platformFee`:
- Validate `platformFee >= 0`.
- Upsert `{ communityId, productType: 'matches' }`, setting `platformFee`.
- There's **no platform default.** A community without a commission row fails
  checkout with "No Comission Setup Here", so never delete the row. The list
  returns `commission: null` for these legacy communities, and the frontend
  warns about them.
- If percentage or capped fees are wanted, `calculateFlatCharges` has to change
  first. That's a pricing decision, not part of this work. Tell the frontend
  and the fee editor will grow to match.

## Step 5. Users (CRM)

### `GET /admin/users?search&userType&page&limit`
- `userType` filters `currentUserType` (`member`, `manager` or `staff`).
  `search` matches `firstName`, `lastName`, `email` and `phoneNumber`. Sort by
  `createdAt`, newest first.
- `communitiesCount` is `size(communities)`. `totalSpent` is the sum of that
  user's attendee `amountPaid` (non-manual bookings) plus their paid passes and
  subscriptions, done with a `$lookup` that has a pipeline.
- `lastActiveAt` has **no field yet.** Add `lastLoginAt` to the user schema, set
  it in `authenticateLogin`, and return `null` until it's populated.
- Never return `password` or tokens.

### `GET /admin/users/:id`
Returns the row above, plus:
- `country`, `gender` and `sports`
- `communities`: the user's `members` rows joined to community names, with
  `role` coming from `manager`, `staff` or `member`
- `recentPayments`: their last 10 rows from the payments union in step 6

## Step 6. `GET /admin/payments`

Query: `?search&type&status&communityId&from&to&page&limit`. It's one list over
three sources, built with `$unionWith` starting from `attendees`:

| `type` | Source | `status` | `amount` / `platformFee` / `ownerFee` |
|---|---|---|---|
| `booking` | `attendees` | `'success'` (rows only exist for successful bookings). Manual bookings show `channel: 'manual'`. | `amountPaid ?? actualAmount` / `platformFee` / `ownerFee` |
| `membership` | `membershippayments` | `paid` becomes `'success'`; `pending` and `failed` stay as they are | `amount` / `0` / `amount` (bundle games already appear as bookings, so list bundle rows but **exclude them from `summary`**) |
| `subscription` | `subscriptions` | `active` becomes `'success'`; `pending` and `failed` stay as they are | `amount` / `amount` / `0` |

- Fill `reference` from `paymentReference`, `user` from `userId` (falling back to
  the attendee's `displayName` and `email` for guests), `community` from
  `beneficiaryId` or `communityId`, and `match` from `matchId` (`title`, `matchDate`).
- `from` and `to` filter `createdAt`, inclusive. Sort by `createdAt`, newest first.
- `summary` (`count`, `amount`, `platformFee`) covers the same filters across
  all pages, using `$facet`.
- `refunded` is in the frontend's status filter, but nothing records refunds
  today, so it simply returns nothing.

## Step 7. Sports

There's no sport model yet. Sports are hardcoded in the frontend
(`src/lib/sports.tsx`), and `communities.category` holds the sport key.

- Add a `sports` schema with `key` (unique, lowercase), `name`, `isActive`,
  `formats[] { name, playersPerSide|null, durationMinutes|null }`,
  `stats[] { key, label, short, unit|null, headline }` and
  `positions[] { name, code }`.
- `GET /admin/sports` returns `{ data }`, each sport with `communitiesCount`
  (`communities` grouped by `category`).
- `POST /admin/sports` validates its input: unique `key` (409 if taken), at most
  3 `headline` stats, stat `key` equal to the lowercased label, and unique stat keys.
- `PUT /admin/sports/:id` replaces the whole document, and returns 400 if `key` changes.
- Seed football, basketball, tennis and running from
  `src/_pages/admin/sports/templates.ts` on the frontend branch.
- Follow-up, not part of this work: have create-community, create-game and the
  stats categories read from this collection instead of the frontend registry.

---

## How to test

1. Run the backend locally (port 3000). Set `role: 'superadmin'` on a local
   test user (for example `waveroktech@gmail.com`, password `Test1234!`).
2. From the frontend branch, start it on a different host so it doesn't collide
   with the production session cookie:
   `NEXT_PUBLIC_API_URL=http://localhost:3000 npx next dev -p 3005`, then open
   `http://127.0.0.1:3005`.
3. Sign in and open `/admin`. Each page leaves "Waiting on the backend" once its
   endpoint answers.
4. Cross-check one community: its `processed` on `/admin/communities` must equal
   `collected` from `GET /communities/:id/bookings/summary`.
