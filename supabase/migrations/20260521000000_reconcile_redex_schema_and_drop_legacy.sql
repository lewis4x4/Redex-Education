-- =============================================================================
-- Slice 8.5 — Schema reconciliation & legacy cleanup.
-- Authored: 2026-05-23. Timestamp 20260521000000 deliberately precedes the
-- other local migrations so this runs FIRST during `supabase db push`.
--
-- This migration does three things, in order:
--
--   1) Create the `redex` schema. All Redex Education tables live here from
--      now on. Co-tenant installer/Victra tables remain in `public`. See
--      ADR 017 for the schema-isolation rationale.
--
--   2) Move the already-existing Slice 2.4 source library objects from
--      `public` to `redex`. These tables were applied via direct SQL on
--      2026-05-22 (not tracked in supabase_migrations); data — if any —
--      is preserved by `ALTER ... SET SCHEMA`.
--
--   3) Drop the legacy training subsystem from `public` per user
--      authorization 2026-05-23. Subsystem objects:
--        - view  public.training_module_metrics
--        - fn    public.get_user_training_status(uuid)
--        - table public.user_training_progress  (0 rows)
--        - table public.training_modules        (9 rows, never used —
--                                                user_training_progress
--                                                empty proves no learner
--                                                ever touched them)
--      and their indexes/triggers/RLS policies/GRANTs (which Postgres
--      drops automatically with the table).
--
-- Idempotent: safe to re-run. Every step is guarded with IF EXISTS /
-- IF NOT EXISTS or wrapped in a DO block.
-- =============================================================================

-- 1. Create the redex schema and grant access.
create schema if not exists redex;

grant usage on schema redex to anon, authenticated, service_role;

alter default privileges in schema redex
  grant select, insert, update, delete on tables to authenticated, service_role;

alter default privileges in schema redex
  grant usage, select on sequences to authenticated, service_role;

alter default privileges in schema redex
  grant execute on functions to authenticated, service_role;

-- 2. Move source library enum types from public to redex.
do $$
begin
  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'source_authority_level'
  ) then
    alter type public.source_authority_level set schema redex;
  end if;

  if exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'source_file_processing_status'
  ) then
    alter type public.source_file_processing_status set schema redex;
  end if;
end $$;

-- 3. Move source library tables from public to redex.
--    Order matters only when FKs cross schemas during move; here all FKs are
--    intra-table and Postgres relocates them with the table.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'module_source_bindings') then
    alter table public.module_source_bindings set schema redex;
  end if;

  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'source_sections') then
    alter table public.source_sections set schema redex;
  end if;

  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'source_file_versions') then
    alter table public.source_file_versions set schema redex;
  end if;

  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'source_files') then
    alter table public.source_files set schema redex;
  end if;
end $$;

-- 4. Drop the legacy training subsystem from public.
--    View -> function -> child table -> parent table (FK order).
drop view if exists public.training_module_metrics;
drop function if exists public.get_user_training_status(uuid);
drop table if exists public.user_training_progress;
drop table if exists public.training_modules;

-- =============================================================================
-- End of reconciliation. After this migration runs, the next three migrations
-- (20260522000100 training schema, 20260522220557 source library, 20260523000100
-- MVP schema) install everything else into `redex`. Those migrations are
-- idempotent against an already-populated redex schema.
-- =============================================================================
