# Nii Plants Car Rentals — Master Build Specification

**Project:** Nii Plants Car Rentals Digital Platform  
**Domain:** niiplantsghana.com  
**Architecture:** Next.js modular monolith  
**Primary database/backend:** Supabase  
**Payments:** Paystack  
**Initial platform:** Responsive web application  
**Mobile apps:** Future phase  

This document is the source of truth for implementation. Work phase-by-phase. Do not invent live business information. Never place secret API keys in source code.

## 1. Instructions

For every phase:

1. Inspect the existing repository first.
2. Reuse working code where appropriate.
3. Create a short implementation plan.
4. Implement only the requested phase.
5. Run TypeScript checks, ESLint, unit tests where applicable, and a production build.
6. Fix all errors introduced by the implementation.
7. Summarise files added, files modified, migrations, completed features, and outstanding work.

Do not invent business information such as vehicle prices, telephone numbers, addresses, security-deposit amounts, vehicle registration numbers, fleet inventory, business statistics, reviews, or customer numbers. Use clearly labelled development placeholders.

Never expose server credentials to browser code. Do not bypass database constraints merely to make something work.

## 2. Product goal

Build an ultra-modern car-rental website and operations platform with three parts:

- **Public website:** discover Nii Plants, view vehicles and services, check availability, start a booking, submit custom enquiries, contact the company.
- **Customer booking experience:** search, select a class, choose extras, receive a price, enter details, pay online, receive confirmation, view a booking, pay an outstanding balance.
- **Staff dashboard:** bookings, fleet, rates, blocks, maintenance, customers, security deposits, pickups and returns, website content, payments, enquiries.

## 3. Simplification decisions

- Web first. No Android or iOS apps in Version 1. The site must be responsive and mobile-first. API/domain design should remain reusable for future apps.
- One Next.js application. Use route groups for marketing, booking, customer, admin, and API.

## 4. Technology stack

- Next.js App Router, TypeScript, React, Node.js, PostgreSQL, Supabase
- Tailwind CSS, shadcn/ui, Lucide, Framer Motion only where meaningful
- React Hook Form, Zod
- Server Components, Server Actions for internal forms, Route Handlers for public/API/payment endpoints
- Supabase Auth for staff. Guest booking is the primary customer workflow.
- Supabase Storage for vehicle, inspection, and website media. Private customer/inspection files use private buckets.
- Drizzle ORM and Drizzle Kit. Raw SQL migrations when advanced PostgreSQL is required.
- Paystack hosted checkout
- Resend for transactional email, isolated in `src/lib/email/`
- Vitest, React Testing Library, Playwright

## 5. What not to build in Version 1

Native apps, marketplace, third-party owners, driver app, wallet, loyalty, referrals, flight tracking, live vehicle tracking, surge pricing, automated driver allocation, advanced seasonal pricing, automated contracts, automated refund/cancellation rules, multi-currency, maps/routing, live distance pricing, telematics, external CRM, microservices, Kafka, Redis unless needed, Elasticsearch, multiple databases.

## 6. Version 1 booking model

Only standard self-drive rentals are automatically bookable. Chauffeur, airport transfer, corporate, long-term, wedding, event, group, multi-city, and special requests use enquiry/manual review.

## 7. User types

- **Guest customer:** browse, search, book, pay reservation, retrieve booking, pay balance, contact support. No account required.
- **Staff** via Supabase Auth with simple roles: Administrator, Reservations, Fleet, Finance, Content Editor.

## 8–11. Design

The site should feel modern, premium, warm, trustworthy, and Ghanaian without clichés. Do not create a black-and-gold supercar website.

Design tokens (CSS variables):

```css
--background: #f7f3eb;
--foreground: #181a18;
--primary: #245844;
--primary-foreground: #ffffff;
--accent: #c86d38;
--accent-foreground: #ffffff;
--muted: #ece8df;
--muted-foreground: #66645f;
--border: #ded9cf;
--card: #ffffff;
--success: #2f7d50;
--warning: #b87524;
--error: #b83e3e;
```

Typography: display font for hero/section titles; interface font for navigation, buttons, forms, body, and dashboard. Editorial but highly readable.

UI: large whitespace, strong typography, high-quality photography, subtle borders, selective radius, simple shadows, clearly defined cards, good mobile layouts. Avoid excessive gradients, glass, pills, animation, hero video, and floating 3D vehicles.

## 12–16. Public navigation and pages

Desktop: Logo, Fleet, Services, Corporate, About, Help, Call, WhatsApp, Book a Vehicle.  
Mobile: Logo, Menu, Book.

Routes:

- `/`, `/fleet`, `/fleet/[slug]`
- `/services`, `/services/self-drive`, `/services/chauffeur`, `/services/airport-transfer`, `/services/long-term`, `/services/events`
- `/corporate`, `/about`, `/help`, `/help/requirements`, `/help/faqs`, `/contact`
- `/book`, `/book/vehicle`, `/book/details`, `/book/payment`, `/book/complete`
- `/booking`, `/booking/[reference]`
- `/privacy`, `/terms`

Homepage: hero with search widget, trust strip (no unverified numbers), popular fleet, services, why Nii Plants, corporate CTA, FAQ preview, contact CTA.

Fleet page filters: class, seats, transmission, price range. Vehicle details at `/fleet/[slug]`.

## 17. Model-or-similar

Customers book a representative vehicle model/class, not a registration number. Availability uses physical units. Staff sees the allocated vehicle.

## 18–24. Booking, pricing, and chargeable days

Trip validation: return after pickup, minimum 24 hours, no past dates.

Pricing Version 1: daily rate × chargeable days + extras − discount = rental total.

```text
chargeableDays = ceil(rentalDurationHours / 24)
```

Reservation payment percentage is configurable in business settings. Default development value is 25%. Never hard-code the percentage throughout the app.

## 25. Money

Store money as integer pesewas. Do not use JavaScript floating-point for final payment amounts. Utilities live in `src/lib/money/` (`formatGhs`, `pesewasToGhs`, `calculatePercentage`).

## 26–31. Quotes, availability, holds

Quotes are snapshotted before payment. Successful quotes must not change.

Availability uses `vehicle_allocations` with PostgreSQL range types and an exclusion constraint (`btree_gist`, `tstzrange`). Application checks are useful; database prevention is mandatory.

Holds last a configurable number of minutes (default 10). Availability must ignore expired holds even if cleanup is late. Create an atomic PostgreSQL function `create_vehicle_hold`.

## 32–37. Bookings, customers, guest access

Booking statuses: draft, held, payment_pending, confirmed, ready, checked_out, completed, cancelled, expired, under_review, rejected.

Human-friendly references such as `NP-2608-A7K4`. Guest customers do not require `auth_user_id`.

Guest access: booking reference + email, then a six-digit OTP hashed in `booking_access_codes`. After OTP, an HTTP-only secure cookie scoped to that booking. Do not expose bookings by reference alone.

## 38–46. Payments, Paystack, deposits, cancellation

All Paystack initialization is server-side. Never trust browser redirect success. Webhook at `POST /api/webhooks/paystack` must verify signature, verify server-to-server, be idempotent, and confirm only `reservation` or `full_rental` payments.

Callback `/payment/callback` shows “Confirming your payment...” and polls. Balance payments never reallocate a vehicle. Security deposits are staff-recorded in Version 1. Cancellation is staff-driven. Refunds do not automatically change booking status.

## 47–56. Catalogue and content data

Locations, vehicle classes, models, physical vehicles, images, extras, booking extras, promotions, and enquiries as specified. Physical vehicle information is not public unless intentionally exposed. Manual fleet entry must work before any external vehicle API.

## 57–72. Staff dashboard and CMS

Admin at `/admin` requires authentication. Operations-focused dashboard, not a massive analytics suite. Staff-assisted bookings reuse the public availability, pricing, quote, and allocation logic.

CMS Version 1: pages, FAQs, homepage settings, contact information, media. Site settings include business name, phone, WhatsApp, email, address, reservation percent, hold duration, currency, homepage copy, and social links.

## 73–77. SEO, performance, responsive, accessibility

Metadata, canonical URLs, Open Graph, sitemap, robots. Do not index `/admin`, `/book/payment`, or private customer pages. Vehicle URLs use slugs. Prioritise Ghanaian mobile users. Target WCAG AA.

## 78–82. Errors, logging, audit, security, env

Never show raw provider errors. Structured logs for important operations. Never log secrets, OTPs, or sensitive documents. Audit important staff actions. Browser clients must not have unrestricted table access. Service-role key is server-only.

Required example env keys are listed in `.env.example`.

## 83–86. Source structure and service layer

Follow `src/app` route groups, `src/components`, and `src/lib` domain folders. Do not put complex business logic in React components. Validate every external input with Zod. Every schema change requires a migration.

## 87–90. Seeds and tests

Seed development data only, clearly marked as test data. Unit-test pricing, reservation percent, extras, promos, and balances. Integration-test concurrent holds, expired holds, and payment idempotency. Playwright covers customer, guest access, and admin happy paths.

## 91–95. Email, WhatsApp, UX

Transactional email only. WhatsApp is `wa.me` links, not an API. Clear loading and empty states. Admin search uses PostgreSQL.

## 96. Development phases

- **Phase 0:** foundation (this phase)
- **Phase 1:** database and authentication
- **Phase 2:** fleet management
- **Phase 3:** marketing website and CMS
- **Phase 4:** availability and pricing
- **Phase 5:** booking system
- **Phase 6:** Paystack
- **Phase 7:** operations
- **Phase 8:** enquiries
- **Phase 9:** final UX
- **Phase 10:** production preparation

Do not begin a later phase until the current phase is clean.

## 97–101. Definition of done and engineering rules

The frontend must never determine final price, payment amount, payment success, availability, physical allocation, booking confirmation, or staff permission. Prefer one Next.js app, one PostgreSQL database, one auth provider, one payment provider, and one storage provider. Do not overengineer.

Future features (apps, driver scheduling, Cardatabase.dev, maps, loyalty, multi-currency, advanced rates, automated refunds) may be designed for, but not implemented in Version 1.
