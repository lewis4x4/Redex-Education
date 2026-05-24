# ADR 017 — Redex schema isolation (separate Postgres schema for Redex Education tables)

**Status**: Accepted
**Date**: 2026-05-23
**Phase / Slice**: 8.5 — Schema Reconciliation
**Replaces / Adjusts**: ADR 002 (domain types) implicitly; the canonical types
remain the source of truth, but their tables now live in `redex`, not `public`.

## Context

The `Redex_App` Supabase project (`toghxeuhgkcrbrdxewdw`) is a shared workspace. At the time Slice 8.5 began it held **340 tables in `public`** belonging to an internal installer / Victra ops system written by the same owner (DragonFruit-style scheduling, devices, panels, bookings, skills, an `app_role` enum with `tech / dispatch / management / sales / admin / pm / admin_technician / service / call_center`, an installer-shaped `profiles` table with hourly_rate, region, supervisor, etc.).

Eight of the table names Redex Education needs (`profiles`, `assignments`, `assessment_attempts`, `training_modules`, plus the four source library tables `source_files / source_file_versions / source_sections / module_source_bindings`) collided with names already present in `public`. Of those eight:

- `profiles` (installer profiles) — completely different shape, fully populated live production data.
- `training_modules` (9 rows) + `user_training_progress` (0 rows) + the supporting view/function — an abandoned earlier attempt by the same owner; deletion authorized 2026-05-23.
- The four source library tables — actually Redex Education's own tables from Slice 2.4 (applied directly via SQL, not tracked in `supabase_migrations`).
- `assignments` / `assessment_attempts` — installer-system tables with installer data.

Because all our migrations used `CREATE TABLE IF NOT EXISTS`, applying them in `public` would have silently skipped each collision, leaving Redex Education's code querying columns that do not exist on the installer's tables — undetected until runtime.

## Decision

All Redex Education tables, enum types, functions, indexes, RLS policies, and triggers live in a dedicated **`redex` schema**. The installer / Victra system keeps `public`. Cross-schema reads do not happen — the two systems are functionally separate.

Concretely:

1. The reconciliation migration `20260521000000_reconcile_redex_schema_and_drop_legacy.sql` creates `redex`, grants usage to `anon / authenticated / service_role`, sets default privileges, moves the existing source library objects from `public` to `redex` via `ALTER TYPE ... SET SCHEMA` and `ALTER TABLE ... SET SCHEMA` (data preserved), and drops the legacy training subsystem from `public`.
2. All subsequent Redex Education migrations create objects in `redex`, never `public`.
3. The browser-side Supabase client passes `db: { schema: 'redex' }` at construction. Every Edge Function's `createClient` call passes the same. No call site references `.schema('public')` — the default schema for all Redex Education code is `redex`.
4. `supabase gen types typescript --linked --schema redex` generates `src/integrations/supabase/types.ts` containing only the `redex` schema's tables. The 334 unrelated `public` tables never appear in our `Database` type.
5. `src/integrations/supabase/db-rows.ts` aliases `Database['redex']['Tables']`, not `Database['public']['Tables']`.

## Consequences

- Zero name collisions between Redex Education and the installer system — they can both grow without touching each other.
- Natural table names (`profiles`, `training_modules`, `assignments`) without `redex_` prefix clutter.
- RLS still applies per table; nothing about the security model changes.
- `supabase gen types` with `--schema redex` produces a small, focused `Database` type (~1,150 lines, 20 tables) rather than the 340-table giant of the shared project.
- Adding a new table requires placing it in `redex` (lower-case `redex.`, not `public.`). The migration template should reflect this.
- One Postgres feature is unavailable cross-schema without explicit `redex.foo` references: `search_path`. The Supabase client's `db.schema: 'redex'` option handles this for the PostgREST API. Direct `psql` sessions should `SET search_path = redex, public;` if they need redex's objects without prefixing.
- The legacy installer table `auth.users` and the `auth.uid()` function continue to be referenced unprefixed — they live in the `auth` schema, not `public`, and apply to every schema.

## Required Data API exposure (gotcha — learned the hard way)

**Postgres schema creation alone is not enough.** Supabase's Data API (PostgREST) must be explicitly configured to expose the schema, otherwise every PostgREST query (every Supabase JS `from()` call, every Edge Function service-role query) returns:

```
PGRST106: The schema must be one of the following: public, graphql_public
```

This applies even when the client correctly passes `db: { schema: 'redex' }` — that option tells PostgREST which schema to route into, but PostgREST only honors schemas on its allowlist.

**Required operator step**:

Supabase Dashboard → Integrations → Data API → Settings → **Exposed schemas** → add `redex`. The full list should be:

```
public, graphql_public, redex
```

**What fails without this step** (silently, until users notice):
- The custom-access-token-hook can't read `redex.profiles.role` → defaults every user to `learner`
- Browser supabase client `.from('training_courses')` etc. return 406 → silent error or empty arrays in UI
- Edge functions (drive-sync, parse-source-file, submit-generation-job, generation-worker) can't read or write any `redex` table → fail with PGRST106

**Why this isn't caught by tests**: Local Vitest tests use mock mode and never hit PostgREST. CI runs the same. The gotcha only surfaces on real production traffic.

**Diagnosis signal**: if you see `PGRST106` in any function log, on any client query, the Exposed Schemas list is missing `redex`. The fix is the Dashboard step above; no code change required.

History: this bit production on 2026-05-24 — `blewis@goredex.com` signed in but JWT defaulted to `learner` because the hook couldn't read the profiles row. Fixed by adding `redex` to Exposed Schemas. See Build Bible "Production JWT Role Fix" entry for the full diagnosis.

## References

- v2 Roadmap Slice 8.5: [`../Redex_Education_Phase10-13_Roadmap_v2_20260523.md`](../Redex_Education_Phase10-13_Roadmap_v2_20260523.md)
- Reconciliation migration: `supabase/migrations/20260521000000_reconcile_redex_schema_and_drop_legacy.sql`
- Generated types: `src/integrations/supabase/types.ts` (regenerated with `--schema redex`)
- Build Bible Slice 8.5 entry: [`../redex_education_build_bible.md`](../redex_education_build_bible.md)
- Related ADRs: [ADR 001](./001-env-driven-supabase-client.md) (env), [ADR 002](./002-domain-types-single-source-of-truth.md) (domain types), [ADR 015](./015-supabase-only-generation-pipeline.md) (no Cloudflare)
