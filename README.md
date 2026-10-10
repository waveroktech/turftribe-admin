# TurfTribe Admin

Platform backoffice for TurfTribe: overview dashboard, communities (status and commission), users, payments and sports.

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
