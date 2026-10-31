# Installable PWA and Branded Splash Design

## Goal

Make Nii Plants Car Rentals installable on supported mobile and desktop browsers and give installed launches a polished, branded startup experience without slowing normal page navigation or interfering with booking, payments, authentication, or admin work.

## Experience

- The web app provides a valid manifest with the Nii Plants name, description, Ghana-appropriate theme colors, standalone display mode, portrait-friendly defaults, and icons for common install sizes.
- The existing official Nii Plants logo is reused for the app icon and splash artwork; no new brand mark is invented.
- A lightweight client splash appears once per browser session after the app shell mounts. It uses a short shield/logo reveal, a restrained accent glow, and a progress accent. It is skipped for reduced-motion users and never appears during client-side route changes.
- The splash is resilient to slow data: it covers only the app shell and has a bounded duration, so a slow database request cannot trap a user behind an indefinite loader.
- An install affordance is exposed only when the browser provides an install prompt. It is dismissible, does not repeatedly interrupt users, and is hidden when the app is already installed or unsupported.
- iOS metadata and touch-icon support are included where the platform requires them. Native operating-system startup screens remain browser-controlled and static; the animated experience begins after the document is available.

## Architecture

- Add an App Router manifest route and static PWA icon assets under `public/`.
- Add a small client-only app-shell component in the root layout for the splash and install prompt. Keep it independent from server data and database initialization.
- Add a minimal service worker registration path with a versioned cache for safe static shell assets and an offline fallback. Never cache authenticated admin responses, booking mutations, payment callbacks, or API responses containing customer/payment data.
- Add viewport/theme metadata in the root layout and preserve existing SEO metadata and no-index behavior.

## Failure and accessibility behavior

- If service-worker registration fails, the site remains fully functional as a normal web app.
- If an install prompt is unavailable, no dead button or misleading install message is shown.
- The splash is `aria-hidden` while decorative, does not steal focus, and respects `prefers-reduced-motion`.
- The install control has a visible focus state, a minimum 44px touch target, and clear status text.
- Offline fallback explains that the connection is unavailable and offers a retry path; it does not imply that a booking or payment succeeded.

## Verification

- Unit tests cover splash dismissal, reduced-motion behavior, install prompt availability/dismissal, and service-worker registration failure.
- Build, typecheck, lint, and existing unit tests must pass.
- Browser verification covers mobile-width menu/navigation, first launch, refresh, route changes, install prompt handling, and offline fallback without exercising real payment or booking mutations.
