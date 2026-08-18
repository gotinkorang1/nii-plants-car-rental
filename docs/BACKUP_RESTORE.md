# Backup and restore

## Strategy (Supabase)

Confirm the **actual Supabase plan** for the production project before launch. Capabilities vary by plan tier.

| Concern | Operator action |
| --- | --- |
| Mechanism | Use Supabase dashboard **Database → Backups** (PITR on eligible plans) or scheduled logical exports |
| Frequency | At least daily for production; verify vendor retention window |
| Retention | Document chosen retention (e.g. 7/30 days per plan) |
| Operator | Named staff member responsible for backup verification |
| Pre-launch | Create/verify backup immediately before first production migration |

Do not claim backups are configured without inspecting the Supabase project settings.

## Pre-launch backup

1. Open production Supabase project → Database → Backups.
2. Confirm backups enabled or configure logical export cron to secure storage.
3. Record timestamp of last successful backup in launch notes.

## Restore test (non-production)

1. Create disposable Supabase project or local database.
2. Restore backup/export into disposable instance **only**.
3. Run `npm run db:migrate` if restoring to empty instance with migration files instead of full dump.
4. Verify critical tables, RLS enabled, extensions present.
5. Destroy disposable instance after test.

**Never restore a test dump over production.**

## Application-level exports

For additional safety, operators may run periodic logical exports:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=niiplants-$(date +%F).dump
```

Store dumps encrypted off-site. Add `*.dump` to local gitignore (already ignored).

## Migration release procedure

1. Verify backup.
2. Apply migration on staging.
3. Run integration/E2E against staging.
4. Apply migration on production (controlled window).
5. Deploy matching application version.
6. Smoke test production.
7. Roll back **application** if needed; schema rollback requires forward migration.

## Connection notes

Production app connections should use Supabase pooler appropriately:

- Transaction pooler (port **6543**): prepared statements disabled, small pool (default 1).
- Session/direct (port **5432**): configurable `DATABASE_POOL_MAX` (default 5, max 10).

Document final production values in Vercel env after load testing.
