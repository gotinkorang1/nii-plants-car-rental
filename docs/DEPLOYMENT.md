# Deployment runbook

## Environments

| Environment | Indicator | Database | Paystack | Email |
| --- | --- | --- | --- | --- |
| Local | `APP_ENV=development` (default) | Local Supabase (`supabase start`) | `PAYSTACK_MOCK=1` | `EMAIL_DEV_OUTBOX=1` |
| Preview / staging | `VERCEL_ENV=preview` or `APP_ENV=preview` | **Non-production** Supabase | Paystack **TEST** keys only | Outbox / test recipients |
| Production | `VERCEL_ENV=production` or `APP_ENV=production` | **Production** Supabase | **LIVE** keys only | Verified Resend domain |

Never connect preview/staging deployments to the production database or service-role key.  
Production guards **reject** Paystack TEST keys — do not loosen them for acceptance testing.

## Paystack acceptance sequence (mandatory order)

### 1. Public staging / preview (Paystack TEST)

Use a publicly reachable **staging or preview** deployment backed by:

- non-production Supabase (`DATABASE_URL`, service role, anon key)
- `APP_ENV=preview` or `VERCEL_ENV=preview`
- Paystack **TEST** secret (`sk_test_*`) — never LIVE
- production-like HTTPS URL (staging subdomain or Vercel preview URL)
- `NEXT_PUBLIC_APP_URL` matching that HTTPS host
- callback: `https://<staging-host>/payment/callback`
- webhook: `https://<staging-host>/api/webhooks/paystack`

Run one genuine hosted **TEST** checkout and verify:

1. server payment initialization  
2. Paystack authorization URL  
3. hosted checkout completion  
4. browser callback  
5. webhook receipt + HMAC signature  
6. Verify Transaction (amount, currency, reference)  
7. booking confirmation state  
8. transactional email (test/outbox strategy)

Archive or clearly mark test records afterward.

### 2. Production (Paystack LIVE — manual only)

Only after **all** production gates in [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) are satisfied:

1. Production database migrated and bootstrapped (not dev seed)  
2. Backup verified  
3. Production rates, fleet, and site settings entered  
4. RLS and storage audit complete  
5. Resend domain verified  
6. Staging Paystack TEST flow passed on public HTTPS  
7. Operator deliberately adds **LIVE** secret (`sk_live_*`) to Vercel **Production** env only  
8. Redeploy production  
9. Configure Paystack **production** webhook URL  
10. Enable `onlinePaymentEnabled` when approved  

Do **not** run unauthorized real-money test charges. Do **not** use TEST keys on production — guards will fail startup.

## Local setup

```bash
cp .env.example .env.local
supabase start
npm run db:migrate
npm run db:seed
npm run dev
```

## Preview deploy (Vercel)

**First deploy on `main`/`master`:** Vercel sets `VERCEL_ENV=production` for the production deployment slot. Until real production launch, set **`APP_ENV=preview`** in the Vercel **Production** environment (along with staging Supabase and Paystack TEST keys). That keeps production guards from requiring LIVE Paystack and full production secrets during Stage A staging validation. Remove or change to `APP_ENV=production` only after the launch checklist.

1. Connect repository to Vercel.
2. Set **Production** and **Preview** environment variables (names only — use staging/non-production values until launch):
   - `APP_ENV=preview` (mandatory on production slot until launch)
   - Staging Supabase URL, anon key, service role, `DATABASE_URL`
   - Paystack **TEST** secret (`sk_test_*`) — not LIVE
   - `BOOKING_OTP_SECRET`, `CRON_SECRET` (unique staging values)
   - `RESEND_API_KEY`, `EMAIL_FROM`, `ENQUIRY_NOTIFICATION_EMAIL` (or `EMAIL_DEV_OUTBOX=1` for early smoke tests)
   - `NEXT_PUBLIC_APP_URL` = your Vercel deployment HTTPS URL (update after first deploy if needed)
3. Deploy branch → verify preview URL.
4. Run smoke tests: `/`, `/fleet`, `/book`, `/api/health`, enquiry flow.
5. Confirm `robots: noindex` on preview (automatic when `VERCEL_ENV=preview`).

## Production database migration

**Do not run migrations during `next build` or postinstall.**

1. Verify backup ([BACKUP_RESTORE.md](./BACKUP_RESTORE.md)).
2. Apply migrations on **staging** empty/fresh database first.
3. Apply migrations on production:

   ```bash
   DATABASE_URL=<production-direct-url> npm run db:migrate
   ```

4. Inspect migration history and RLS in Supabase dashboard.
5. Bootstrap safe defaults only:

   ```bash
   APP_ENV=production DATABASE_URL=<production> npm run db:bootstrap-production
   ```

6. Deploy application build that matches schema version.

## Production deploy (Vercel)

1. Set Production environment variables (see [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)).
2. Deploy to production hostname on Vercel **before** DNS cutover if possible (`.vercel.app` smoke).
3. Complete Paystack **TEST** acceptance on **public staging/preview** first (see Paystack acceptance sequence below).
4. After manual checklist, add LIVE Paystack secret to Vercel **Production** env only and redeploy.

## Paystack configuration

| Step | Action |
| --- | --- |
| Staging callback | `https://<staging-host>/payment/callback` |
| Staging webhook | `https://<staging-host>/api/webhooks/paystack` |
| Staging acceptance | Hosted **TEST** checkout on public HTTPS staging/preview |
| Production callback | `https://<canonical-domain>/payment/callback` |
| Production webhook | `https://<canonical-domain>/api/webhooks/paystack` |
| Live switch | Operator adds `sk_live_*` to Vercel Production env only after staging TEST pass |

## Resend configuration

1. Add domain in Resend dashboard.
2. Publish DNS records Resend provides (SPF/DKIM; DMARC if advised).
3. Set `EMAIL_FROM` to verified sender address.
4. Remove `EMAIL_DEV_OUTBOX` from production.

## Domain / DNS cutover

**Do not change DNS automatically during engineering.**

1. Inventory current records (protect MX and mail authentication).
2. Add Vercel verification + apex/`www` records per Vercel project instructions.
3. Lower TTL 24–48 hours before cutover.
4. Point apex/`www` to Vercel per chosen canonical strategy.
5. Verify HTTPS, redirects, sitemap, canonical URLs, email links.

### Canonical host

Recommended: **`https://niiplantsghana.com`** as canonical; redirect `www` → apex in Vercel domain settings.

### Legacy WordPress URLs

Add permanent redirects in `next.config.ts` for important indexed paths once old URL inventory is complete. Do not redirect exploit paths (`wp-admin`, `xmlrpc.php`) into app routes.

## Smoke test (post-deploy)

```bash
curl -s https://<host>/api/health
curl -I https://<host>/
curl -I https://<host>/fleet
curl -I https://<host>/book
```

Expected: health `200` with `status: ok`; public pages `200`.

## Rollback

| Layer | Action |
| --- | --- |
| Application | Promote previous Vercel production deployment |
| DNS | Restore prior A/CNAME/ALIAS records (keep TTL low during launch window) |
| Database | **Do not** assume frontend rollback reverts schema; plan forward-fix migrations |

## Incident quick reference

See [SECURITY_OPERATIONS.md](./SECURITY_OPERATIONS.md) for secret rotation and compromise steps.

| Incident | First checks |
| --- | --- |
| Site down | Vercel status, deployment logs, `/api/health` |
| Database errors | Supabase status, connection pool, recent migration |
| Webhook failures | Paystack dashboard logs, Vercel function logs, signature secret |
| Email failure | Resend logs, domain verification, `EMAIL_FROM` |
| Double booking | Availability exclusions, allocation status, audit logs |

**Kill switches (administrator):** disable `bookingEnabled` and/or `onlinePaymentEnabled` in `/admin/settings/site` while investigating.
