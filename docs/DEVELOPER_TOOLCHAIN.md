# Developer toolchain

This project uses one workflow across local development, GitHub CI, Supabase,
and Vercel production. Secrets stay in `.env.local`, Supabase/Vercel managed
environment variables, or authenticated CLI credential stores.

## Core tools

- Node.js 24 and npm
- Git and GitHub CLI (`gh`)
- Docker Desktop and Supabase CLI
- Vercel CLI (invoked with `npx vercel` when it is not installed globally)
- Vitest, Playwright, Axe, Storybook, and Lighthouse CI
- Drizzle ORM and Drizzle Kit
- Codex browser tooling and the project-scoped Supabase MCP

Run the environment check before starting work:

```bash
npm run toolchain:doctor
```

Include the deployed health endpoint when checking a release:

```bash
npm run toolchain:doctor:production
```

## Local workflow

```bash
npm ci
npm run supabase:start
npm run db:migrate
npm run db:seed
npm run dev
```

Useful focused checks:

```bash
npm run test
npm run test:integration
npm run test:e2e
npm run test:storybook
npm run lhci
```

Stop the local stack with `npm run supabase:stop`. Use
`npm run supabase:status` to confirm its URLs and ports; do not paste its keys
into logs, issues, or chat.

## Pull requests and releases

Before opening or merging a pull request:

```bash
npm run verify:release
```

GitHub Actions repeats linting, type checking, the production dependency audit,
unit/integration tests, production build, browser tests, accessibility checks,
cross-browser smoke tests, and Lighthouse checks against a disposable local
Supabase stack. Dependabot proposes grouped, scheduled dependency updates.

Production is deployed through the linked Vercel project. After deployment,
run the production doctor and verify `https://www.niiplantsghana.com/api/health`
returns `status: ok`.

## Authentication

- GitHub: `gh auth status`
- Supabase CLI: `supabase login` when remote CLI access is needed
- Supabase MCP: `codex mcp login supabase`
- Vercel: `npx vercel login`, then `npx vercel link`

Use browser/device authorization when offered. Never commit access tokens,
service-role keys, database passwords, or `.env.local`.
