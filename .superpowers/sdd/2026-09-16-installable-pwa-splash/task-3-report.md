# Task 3 report: safe offline PWA shell

## Changed files

- `public/sw.js` — adds the versioned, navigation-only network-first service worker with a five-asset precache allowlist, offline fallback, and scoped old-cache cleanup.
- `public/offline.html` — adds a static branded connection-unavailable page with accessible retry and home actions.
- `src/components/app/service-worker.test.ts` — covers safe registration behavior and static worker/offline-page safeguards.

No manifest, splash visual behavior, booking, payment, admin, authentication, or API routes were modified.

## Commands and results

- `npx vitest run --project unit src/components/app/service-worker.test.ts` — passed, 5 tests.
- `npm run typecheck` — passed.
- `npm run lint` — timed out after approximately 60 seconds without completion output; stopped.
- `npm run test` — timed out after approximately 60 seconds without completion output; stopped.
- `npm run build` — passed; production build compiled, TypeScript completed, and 8 static pages generated.
- `git diff --check` — passed.

## Commit

Commit message: `Add safe offline PWA shell`.

## Concerns

- Repository-wide lint and unit verification did not complete within the bounded interval and must not be treated as passing.
- The worker intentionally does not cache runtime pages or non-navigation requests, so only the precached shell and offline fallback are available without a network connection.

## Round 1 fix report

### Findings addressed

- The worker test now extracts and compares the exact five-entry precache allowlist.
- Navigation fallback now opens and searches only `nii-plants-shell-v1`, including its offline page.
- Tests now isolate activation and fetch handlers to verify shell-only cache deletion and no cache reads/writes or interception for API, admin, payment, and customer requests.

### Verification

- `npx vitest run --project unit src/components/app/service-worker.test.ts` — passed, 7 tests.
- `npm run typecheck` — passed.
- `npx eslint src/components/app/service-worker.test.ts public/sw.js` — passed.

### Commit

Commit message: `Fix round 1 Task 3 findings`.

### Concerns

- The earlier repository-wide `npm run lint` and `npm run test` runs remain recorded above as bounded timeouts; this fix was verified with targeted lint, focused tests, and typecheck.
