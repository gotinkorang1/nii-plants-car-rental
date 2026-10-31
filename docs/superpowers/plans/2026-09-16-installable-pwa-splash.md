# Installable PWA and Branded Splash Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Nii Plants Car Rentals installable and add a polished, bounded branded launch experience without affecting booking, payment, authentication, or admin flows.

**Architecture:** Add an App Router manifest and static icons, then mount a small client-only app-shell component from the root layout. Register a narrowly scoped service worker for safe shell assets only; never cache API, admin, booking mutation, payment, or authenticated responses.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Vitest, Testing Library, browser verification.

**Spec:** `docs/superpowers/specs/2026-09-16-installable-pwa-splash-design.md`

## Global Constraints

- Reuse the existing official Nii Plants logo; do not invent a new brand mark.
- The splash must be bounded and must not block normal navigation or slow data loading.
- Respect `prefers-reduced-motion` and keep interactive targets at least 44px.
- Never cache authenticated admin responses, booking mutations, payment callbacks, or customer/payment API data.
- Preserve existing SEO metadata and production no-index behavior.

---

### Task 1: Add PWA manifest, icons, and root metadata

**Files:**
- Create: `src/app/manifest.ts`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `public/icons/maskable-512.png`
- Modify: `src/app/layout.tsx`
- Test: `tests/unit/manifest.test.ts`

**Interfaces:**
- Produces a Next.js `MetadataRoute.Manifest` from `src/app/manifest.ts`.
- Root layout consumes the manifest automatically through the App Router and adds theme/color metadata plus Apple web-app metadata.

- [ ] **Step 1: Write the failing manifest test**

```ts
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  it("describes an installable standalone Nii Plants app", () => {
    const value = manifest();
    expect(value.name).toBe("Nii Plants Car Rentals");
    expect(value.display).toBe("standalone");
    expect(value.start_url).toBe("/");
    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "/icons/icon-192.png", sizes: "192x192" }),
        expect.objectContaining({ src: "/icons/icon-512.png", sizes: "512x512" }),
      ]),
    );
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run tests/unit/manifest.test.ts --pool=threads --maxWorkers=1`

Expected: FAIL because `src/app/manifest.ts` does not exist.

- [ ] **Step 3: Create the manifest and derive icons from the existing logo**

Implement `manifest()` with `name`, `short_name`, `description`, `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `orientation: "portrait-primary"`, `background_color: "#f7f3eb"`, `theme_color: "#1f5c46"`, and 192px/512px any-purpose plus 512px maskable icon entries. Generate the PNG files from `public/brand/nii-plants-logo.png` using the repository’s installed image tooling, placing the logo on the warm background with safe padding for the maskable variant.

- [ ] **Step 4: Add root mobile metadata**

Extend `metadata` in `src/app/layout.tsx` with `applicationName`, `appleWebApp: { capable: true, statusBarStyle: "default", title: "Nii Plants Car Rentals" }`, and `icons` for `/icons/icon-192.png` and `/icons/icon-512.png`. Export `viewport` with `themeColor: "#1f5c46"`, `width: "device-width"`, `initialScale: 1`, and `viewportFit: "cover"` without removing existing metadata.

- [ ] **Step 5: Run tests and typecheck**

Run: `npx vitest run tests/unit/manifest.test.ts --pool=threads --maxWorkers=1` and `npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit the install metadata**

```bash
git add src/app/manifest.ts src/app/layout.tsx public/icons tests/unit/manifest.test.ts
git commit -m "Add installable PWA metadata"
```

### Task 2: Add bounded animated splash and install affordance

**Files:**
- Create: `src/components/app/app-shell.tsx`
- Create: `src/components/app/app-shell.test.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- `AppShell` accepts `{ children: ReactNode }` and renders children immediately plus a decorative splash overlay when appropriate.
- `AppShell` listens for the browser `beforeinstallprompt` event and exposes an install button only while a prompt is available.

- [ ] **Step 1: Write failing behavior tests**

Cover these exact behaviors: first render shows a splash with `aria-hidden="true"`; a timer dismisses it within the bounded duration; setting `window.matchMedia` to reduced motion skips it; a synthetic `beforeinstallprompt` event reveals an install button; clicking install calls `prompt()` and hides the affordance after the user response.

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `npx vitest run src/components/app/app-shell.test.tsx --pool=threads --maxWorkers=1`

Expected: FAIL because `AppShell` does not exist.

- [ ] **Step 3: Implement the client-only app shell**

Use a client component with a `sessionStorage` key such as `nii-plants:splash-seen:v1`, a maximum splash duration of 1200ms, and a reduced-motion check. Keep children outside the overlay so server-rendered page content is not blocked. Use the existing `/brand/nii-plants-logo.png`, an accessible install button with `min-h-11`, and a non-interactive status label. Register the service worker from a guarded `useEffect` without making its failure visible as an application error.

- [ ] **Step 4: Add polished motion and safe-area styles**

Add scoped classes in `src/app/globals.css` for the warm background, logo reveal, accent ring, fade-out, and `env(safe-area-inset-*)` padding. Add a `@media (prefers-reduced-motion: reduce)` rule that removes animation and transitions. Do not add a permanent loading overlay.

- [ ] **Step 5: Mount `AppShell` in the root layout**

Wrap `{children}` with `<AppShell>{children}</AppShell>` in `src/app/layout.tsx`. Keep the existing `<html>` language/font classes unchanged.

- [ ] **Step 6: Run focused tests, typecheck, and lint**

Run: `npx vitest run src/components/app/app-shell.test.tsx --pool=threads --maxWorkers=1`, `npm run typecheck`, and `npm run lint`.

Expected: PASS with no hook, accessibility, or hydration errors.

- [ ] **Step 7: Commit the splash and install UI**

```bash
git add src/components/app src/app/layout.tsx src/app/globals.css
git commit -m "Add branded PWA launch experience"
```

### Task 3: Add safe offline shell behavior

**Files:**
- Create: `public/sw.js`
- Create: `src/components/app/service-worker.ts`
- Create: `src/components/app/service-worker.test.ts`
- Modify: `src/components/app/app-shell.tsx`
- Create: `public/offline.html`

**Interfaces:**
- `registerServiceWorker()` registers `/sw.js` only in a browser and resolves without throwing when unsupported or blocked.
- The worker caches only explicitly listed static shell assets and returns `offline.html` only for failed navigation requests.

- [ ] **Step 1: Write failing service-worker tests**

Test that registration is skipped when `serviceWorker` is unavailable, failures resolve safely, and the worker source contains no API/admin/payment cache route. Test that `offline.html` gives a retry link and does not claim a booking or payment succeeded.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npx vitest run src/components/app/service-worker.test.ts --pool=threads --maxWorkers=1`

Expected: FAIL because the registration module and worker do not exist.

- [ ] **Step 3: Implement registration and the worker**

Register on window load with `{ scope: "/" }`. In `public/sw.js`, use a versioned cache containing only `/`, `/offline.html`, `/icons/icon-192.png`, `/icons/icon-512.png`, and `/brand/nii-plants-logo.png`; use network-first navigation with offline fallback and pass through all non-navigation/API/admin/payment requests without caching.

- [ ] **Step 4: Add the offline document**

Create a branded, accessible page stating that the connection is unavailable, with a retry button/link and a link home. Avoid booking/payment success language.

- [ ] **Step 5: Run tests and full verification**

Run: `npx vitest run src/components/app/service-worker.test.ts --pool=threads --maxWorkers=1`, `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.

Expected: PASS; build emits the manifest and static worker assets.

- [ ] **Step 6: Commit the offline shell**

```bash
git add public/sw.js public/offline.html src/components/app
git commit -m "Add safe offline PWA shell"
```

### Task 4: Browser verification and release

**Files:**
- Modify: none unless verification finds a defect

- [ ] **Step 1: Verify production metadata**

Open the production site and confirm `/manifest.webmanifest`, icons, theme color, and standalone metadata are reachable.

- [ ] **Step 2: Verify mobile navigation and splash**

At a 390px-wide viewport, confirm the splash dismisses, the navbar remains above page content, the menu opens, all links are reachable, Escape closes it, and focus returns to the menu button.

- [ ] **Step 3: Verify install and offline safety**

Use an install-capable browser to confirm the install affordance appears only after `beforeinstallprompt`; simulate offline navigation and confirm the offline document appears. Confirm booking, payment, admin, and authentication requests are not served from the worker cache.

- [ ] **Step 4: Inspect final repository state**

Run: `git status --short` and `git log -5 --oneline`. Confirm only intended changes are present and all release checks pass before deployment.
