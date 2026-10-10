# TurfTribe Admin

Platform backoffice for TurfTribe: overview dashboard, communities (status and commission), users, payments and sports.

Only accounts whose `role` is `admin` or `superadmin` can sign in. The UI check mirrors the backend's `PlatformAdminGuard`, which is the real gate on every `/admin/*` endpoint. See [docs/admin-backend-contract.md](docs/admin-backend-contract.md) for the API these pages expect.

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
