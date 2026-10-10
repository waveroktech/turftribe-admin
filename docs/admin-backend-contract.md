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
  only edits `platformFee`. A community with no commission row
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
