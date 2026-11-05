# Task 1 report: Add PWA manifest, icons, and root metadata

## Files changed

- `src/app/manifest.ts` — Added the installable `MetadataRoute.Manifest` with the approved application name, short name, description, launch scope, standalone display mode, portrait orientation, brand colors, and 192px, 512px, and maskable 512px icon entries.
- `src/app/layout.tsx` — Added application name, Apple web-app metadata, 192px and 512px icon metadata, and the approved viewport configuration. Existing title, Open Graph, Twitter, and conditional production no-index metadata remain in place.
- `public/icons/icon-192.png` — Generated from `public/brand/nii-plants-logo.png` on the approved warm background at 192x192.
- `public/icons/icon-512.png` — Generated from `public/brand/nii-plants-logo.png` on the approved warm background at 512x512.
- `public/icons/maskable-512.png` — Generated from `public/brand/nii-plants-logo.png` on the approved warm background at 512x512 with additional safe maskable padding and `purpose: "maskable"` in the manifest.
- `tests/unit/manifest.test.ts` — Added the focused manifest regression test.

No splash, service worker, interactive behavior, API behavior, or caching behavior was added or changed.

## Tests and output

### Focused manifest test

Command:

`npx vitest run tests/unit/manifest.test.ts --pool=threads --maxWorkers=1`

Output summary: `Test Files 1 passed (1)` and `Tests 1 passed (1)`.

### Typecheck

Command:

`npm run typecheck`

Output summary: `tsc --noEmit` completed successfully with exit code 0 and no diagnostics.

### Icon validation

The installed Sharp tooling confirmed:

- `public/icons/icon-192.png`: PNG, 192x192
- `public/icons/icon-512.png`: PNG, 512x512
- `public/icons/maskable-512.png`: PNG, 512x512

## Commit

Implementation commit: `57c9d35` (`Add installable PWA metadata`)

## Concerns

- The brief names `short_name` without providing a separate literal; `Nii Plants` was used as the concise brand label.
- The manifest description reuses the existing `PAGE_SEO.home.description` so the PWA metadata stays aligned with the site’s approved SEO copy.
- The implementation is local and committed; production deployment and browser installation verification are outside Task 1.
