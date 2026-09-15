# Nii Plants Car Rentals

Digital platform for Nii Plants Car Rentals (`niiplantsghana.com`).

Single Next.js application: public website, guest self-drive booking, Paystack payments, and staff dashboard.

The full product specification lives in [PROJECT_SPEC.md](./PROJECT_SPEC.md).

## Status

Phases 0–9 are implemented. Phase 10 adds production readiness: environment guards, CI, security headers, health/cron endpoints, operational kill switches, and launch runbooks.

| Phase | Scope |
| --- | --- |
| 0–9 | Foundation through enquiries, UX, accessibility, SEO |
| 10 | Production readiness — see [docs/PRODUCTION_CHECKLIST.md](./docs/PRODUCTION_CHECKLIST.md) |

## Stack

- Next.js App Router, TypeScript, Tailwind, shadcn/ui
- Supabase (Auth, PostgreSQL, Storage, RLS)
- Drizzle ORM
- Paystack, Resend
- Vitest, Playwright, Lighthouse CI

## Local setup

```bash
cp .env.example .env.local
npm install
supabase start
npm run db:migrate
npm run db:seed
npm run dev
```

Default local/testing flags in `.env.example`:

- `PAYSTACK_MOCK=1` — local hosted checkout mock
- `EMAIL_DEV_OUTBOX=1` — capture emails in `.email-outbox.json`
- `CARDATABASE_MOCK=1` — fixture vehicles for the admin catalogue lookup instead
  of live CarDatabase calls (see [docs/VEHICLE_DATA_IMPORT.md](docs/VEHICLE_DATA_IMPORT.md))

Never commit `.env.local` or real secrets.

## Environment model

| Variable | Purpose |
| --- | --- |
| `APP_ENV` | `development` \| `preview` \| `production` (preferred over `NODE_ENV` alone) |
| `VERCEL_ENV` | Set automatically on Vercel |
| `PRODUCTION_SUPABASE_PROJECT_REF` | Blocks `npm run db:seed` against production project |

Runtime helper: `src/lib/env/runtime-environment.ts`

Production guards (fail fast): `src/lib/env/guards.ts` via `src/lib/env.server.ts`

## Commands

| Command | Purpose |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run test` | Vitest unit + integration |
| `npm run test:e2e` | Playwright (port 3001) |
| `npm run build` | Production build |
| `npm run analyze` | Bundle analysis |
| `npm run lhci` | Lighthouse CI (production build) |
| `npm run db:migrate` | Apply Drizzle migrations |
| `npm run db:seed` | **Development only** catalogue seed |
| `npm run db:bootstrap-production` | Production-safe site settings bootstrap |
| `npm run db:upsert-production-catalog` | Production locations, classes, and models (no demo plates) |
| `npm run ci:ensure-staff` | Create CI/local test staff user |

## Staff access

1. Create Supabase Auth user (dashboard or CLI).
2. Insert matching `staff_profiles` row with role (`administrator`, `reservations`, etc.).
3. Sign in at `/admin/login`.

For Playwright admin tests:

```bash
TEST_STAFF_EMAIL=...
TEST_STAFF_PASSWORD=...
npm run ci:ensure-staff   # optional helper for local/CI
```

## Paystack

- Local/CI: `PAYSTACK_MOCK=1`
- Staging: Paystack **TEST** keys
- Production: **LIVE** keys only after launch checklist

Webhook: `/api/webhooks/paystack`  
Callback: `/payment/callback`

## Email

- Local/CI: development outbox (`.email-outbox.json`, gitignored)
- Production: Resend with verified domain — see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## Production endpoints

- `GET /api/health` — liveness (no secrets)
- `GET /api/cron/cleanup` — housekeeping (requires `CRON_SECRET`)

## Operations documentation

- [Production checklist](./docs/PRODUCTION_CHECKLIST.md)
- [Deployment](./docs/DEPLOYMENT.md)
- [Backup & restore](./docs/BACKUP_RESTORE.md)
- [Security operations](./docs/SECURITY_OPERATIONS.md)
- [RLS audit](./docs/RLS_AUDIT.md)

## CI

GitHub Actions workflow: `.github/workflows/ci.yml`

Runs lint, typecheck, tests, build, Playwright (Chromium full + cross-browser smoke) against local Supabase.

Node 24 (see `.nvmrc` and `package.json` engines).
