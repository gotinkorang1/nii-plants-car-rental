# RLS and public exposure audit

Review date: Phase 10 engineering pass. Re-verify against live Supabase after any policy change.

Legend:

- **RLS** — row level security enabled on table
- **Anon** — anonymous browser via Supabase anon key (should be none for private tables)
- **Auth** — authenticated staff via Supabase Auth
- **Service** — service role (server only)
- **Public intended** — deliberately readable anonymously (directly or via public views/API)

| Table | RLS | Anon SELECT | Anon INSERT | Auth staff | Service role | Public intended |
| --- | --- | --- | --- | --- | --- | --- |
| staff_profiles | Yes | No | No | Own row / admin | Yes | No |
| customers | Yes | No | No | Role-based | Yes | No |
| bookings | Yes | No | No | Role-based | Yes | No |
| booking_status_history | Yes | No | No | Role-based | Yes | No |
| quotes | Yes | No | No | Role-based | Yes | No |
| vehicle_allocations | Yes | No | No | Role-based | Yes | No |
| payments | Yes | No | No | Role-based | Yes | No |
| booking_access_codes | Yes | No | No | No | Yes | No |
| booking_guest_sessions | Yes | No | No | No | Yes | No |
| rental_inspections | Yes | No | No | Role-based | Yes | No |
| inspection_photos | Yes | No | No | Role-based | Yes | No |
| security_deposits | Yes | No | No | Role-based | Yes | No |
| maintenance_records | Yes | No | No | Role-based | Yes | No |
| enquiries | Yes | No | No | Role-based | Yes | No |
| enquiry_status_history | Yes | No | No | Role-based | Yes | No |
| audit_logs | Yes | No | No | Admin read | Yes | No |
| vehicle_classes | Yes | Published only | No | Yes | Yes | Published catalogue |
| vehicle_models | Yes | Published only | No | Yes | Yes | Published catalogue |
| vehicles | Yes | No | No | Yes | Yes | **No** — physical units private |
| locations | Yes | Active public | No | Yes | Yes | Public locations |
| extras / promotions | Yes | Active public | No | Yes | Yes | Public pricing extras |
| site_settings | Yes | No | No | Yes | Yes | No — server reads |
| content_pages / faqs / media | Yes | Published | No | CMS roles | Yes | Published CMS |

## Public catalogue rules

Public fleet APIs and pages must expose only:

- Published models/classes
- Marketing media from public storage bucket
- Aggregated availability counts

Must **not** leak:

- Physical `vehicles.id` in public catalogue responses
- Registration numbers, internal codes
- Maintenance notes/status
- Unpublished/inactive inventory

## Storage buckets

| Bucket | Access | Notes |
| --- | --- | --- |
| Fleet / website media | Public read | Marketing images only |
| `inspection-media` | Private | Staff signed URLs only |

## Server-side access pattern

Guest booking access uses HTTP-only cookies and server routes — not direct anon access to bookings/payments tables.

## Verification commands

With local Supabase:

```bash
npm run test -- tests/integration/public-fleet-access.test.ts
npm run test -- tests/integration/phase5-bookings.test.ts
npm run test -- tests/integration/phase6-payments.test.ts
```

Run Supabase Security Advisor on staging/production projects before launch.
