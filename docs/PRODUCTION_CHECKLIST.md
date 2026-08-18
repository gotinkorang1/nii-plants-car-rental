# Production launch checklist

Use this checklist before pointing `niiplantsghana.com` at the new platform. Engineering automation covers the **AUTOMATED PASS** items when CI is green locally or on GitHub.

## AUTOMATED PASS (engineering)

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run analyze`
- [ ] `npm run test:e2e` (Chromium full suite)
- [ ] Cross-browser smoke (Firefox + WebKit)
- [ ] Public + admin axe (no serious/critical)
- [ ] Fresh migration test on disposable database
- [ ] Production env guards (`APP_ENV=production` rejects mock/test/dev outbox)
- [ ] Development seed refuses production database
- [ ] `/api/health` returns `status: ok`
- [ ] `/api/cron/cleanup` rejects missing/wrong secret
- [ ] Security headers + CSP present on production build

## MANUAL REQUIRED (Gershon / operators)

### Supabase production

- [ ] Create dedicated **production** Supabase project (separate from preview/staging)
- [ ] Set `PRODUCTION_SUPABASE_PROJECT_REF` in operator secrets (blocks dev seed accidents)
- [ ] Apply migrations `0000`–`0009` on empty production database
- [ ] Run `npm run db:bootstrap-production` — **not** `npm run db:seed`
- [ ] Verify RLS matrix in [RLS_AUDIT.md](./RLS_AUDIT.md)
- [ ] Verify storage buckets: public fleet media, private `inspection-media`
- [ ] Confirm backup plan in [BACKUP_RESTORE.md](./BACKUP_RESTORE.md)
- [ ] Test restore into disposable non-production database

### Vercel / hosting

- [ ] Create Vercel project and connect repository
- [ ] Map **Production** env vars (live secrets only on Production environment)
- [ ] Map **Preview** env vars to staging Supabase + Paystack TEST + email outbox/test strategy
- [ ] Confirm preview uses `VERCEL_ENV=preview` and is `noindex`
- [ ] Deploy preview candidate and run smoke tests
- [ ] Deploy production candidate **without** DNS cutover first

### Paystack

Staging/preview acceptance (**before** production LIVE keys):

- [ ] Deploy **public staging/preview** with non-production Supabase
- [ ] Configure Paystack **TEST** secret on staging/preview only (production rejects TEST keys)
- [ ] Set staging callback: `https://<staging-host>/payment/callback`
- [ ] Set staging webhook: `https://<staging-host>/api/webhooks/paystack`
- [ ] Complete one hosted **TEST** checkout end-to-end (init → callback → webhook → Verify Transaction → booking confirmation)

Production LIVE switch (**after** all gates above + production checklist):

- [ ] Add **LIVE** secret in Vercel **Production** environment only
- [ ] Redeploy production
- [ ] Configure production webhook: `https://niiplantsghana.com/api/webhooks/paystack`
- [ ] Do **not** run unauthorized real-money test charges

### Email (Resend)

- [ ] Verify sending domain/subdomain in Resend
- [ ] Add SPF, DKIM, DMARC DNS records Resend provides (do not disturb existing MX)
- [ ] Set production `EMAIL_FROM` (e.g. `Nii Plants Car Rentals <bookings@notifications.niiplantsghana.com>`)
- [ ] Send test emails: booking created, OTP, receipt, confirmed, vehicle ready, completed, enquiry

### Content & fleet

- [ ] Enter real daily rates and security deposits (no 0-placeholder tariffs for launch)
- [ ] Register real physical vehicles (no `INTERNAL-UNSET-*` units live)
- [ ] Publish approved fleet images and models
- [ ] Verify site settings: phone, WhatsApp, email, address, payment percent, hold duration
- [ ] Enable `bookingEnabled` and `onlinePaymentEnabled` in admin when ready

### Staff

- [ ] Create first production administrator manually in Supabase Auth
- [ ] Insert matching `staff_profiles` row with role `administrator`
- [ ] Do **not** reuse CI/local test credentials

### DNS / domain

- [ ] Inventory existing DNS (MX, SPF, DKIM, DMARC, TXT, subdomains)
- [ ] Add Vercel domain verification records
- [ ] Choose canonical host (`niiplantsghana.com` vs `www`)
- [ ] Plan TTL reduction before cutover
- [ ] Execute cutover only after preview + Paystack TEST pass
- [ ] Keep rollback DNS values documented in [DEPLOYMENT.md](./DEPLOYMENT.md)

### Cron

- [ ] Set `CRON_SECRET` in production
- [ ] Schedule `GET /api/cron/cleanup` on hosting plan that supports cron (optional; correctness does not depend on cron)

## BLOCKER gate

Do not cut DNS or enable live Paystack until **all BLOCKER items** above are checked.

## POST-LAUNCH (first 24 hours)

- [ ] Monitor Vercel function/runtime errors
- [ ] Monitor Paystack webhook delivery
- [ ] Monitor email bounces/failures
- [ ] Verify first platform-managed backup occurred
- [ ] Manually verify first real payments: webhook → booking confirmed → email

## GO / NO-GO

| Status | Meaning |
| --- | --- |
| **READY** | All automated + manual items complete; DNS live |
| **ENGINEERING READY — MANUAL STEPS REMAIN** | Code/CI green; operator steps outstanding |
| **NOT READY** | Blockers in code, security, migrations, or tests |
