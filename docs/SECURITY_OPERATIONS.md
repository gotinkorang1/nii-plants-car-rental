# Security operations

Operational procedures for Nii Plants Car Rentals platform security. Not legal/compliance advice.

## Secret rotation

| Secret | Rotation steps | Notes |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Rotate in Supabase → update Vercel env → redeploy | Never expose to browser |
| `PAYSTACK_SECRET_KEY` | Rotate in Paystack dashboard → update Vercel → verify webhook | Use TEST on staging first |
| `RESEND_API_KEY` | Revoke/create in Resend → update Vercel | |
| `BOOKING_OTP_SECRET` | Generate new random 32+ char secret → update Vercel → redeploy | **Invalidates existing guest sessions/OTP codes** |
| `CRON_SECRET` | Generate new secret → update Vercel + scheduler | |
| Staff passwords | Supabase Auth dashboard or admin reset | Remove departed staff promptly |

After rotation, check git history for accidental commits. If a real secret was committed, rotate immediately — deleting the file is not sufficient.

## Staff account lifecycle

1. Create Auth user + `staff_profiles` row with least-privilege role.
2. Disable with `active = false` before deletion when offboarding.
3. Delete Auth user when access must be fully revoked.
4. Review audit logs for anomalous admin activity.

## Suspected compromise

1. Disable affected staff accounts.
2. Rotate `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, `BOOKING_OTP_SECRET`, `CRON_SECRET`.
3. Toggle `bookingEnabled` / `onlinePaymentEnabled` off if booking/payment abuse suspected.
4. Review Paystack transactions and webhook logs.
5. Review Supabase audit/auth logs and Vercel access.

## Paystack webhook

- Endpoint: `/api/webhooks/paystack` (public HTTPS, no staff auth).
- Authentication: HMAC signature on raw body — do not weaken.
- Never trust browser redirect alone for payment confirmation.

## Private inspection media

- Bucket: `inspection-media` (private).
- Access: authenticated staff + authorization check + short-lived signed URL.
- No guest or anonymous access.

## RLS verification

Re-run checks in [RLS_AUDIT.md](./RLS_AUDIT.md) after policy changes. Use Supabase Security Advisor on staging/production and reconcile with intentional architecture.

## Rate limits (Version 1)

Database-backed limits on OTP, enquiries, and availability search. Monitor abuse via structured logs (`otp_requested`, `enquiry_spam_rejected`, etc.).

## CSP / headers

Production CSP is defined in `next.config.ts`. If adding third-party scripts, update CSP deliberately — do not use `*` wildcards.

## Environment guards

Production rejects:

- `PAYSTACK_MOCK=1`
- `EMAIL_DEV_OUTBOX=1`
- Missing `BOOKING_OTP_SECRET`
- Localhost `NEXT_PUBLIC_APP_URL`
- Paystack `sk_test_*` secrets

Development seed refuses production environment and `PRODUCTION_SUPABASE_PROJECT_REF` matches.

## Reporting

Document incidents with timestamps, affected bookings/payments, actions taken, and whether customers were notified.
