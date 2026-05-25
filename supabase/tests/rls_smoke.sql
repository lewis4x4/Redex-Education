-- Redex linked-project RLS/policy smoke checks (Phase 5 governance).
--
-- Run after applying migrations to a linked Supabase project:
--   supabase db query --linked --file supabase/tests/rls_smoke.sql
--
-- These assertions intentionally use plain SQL instead of pgTAP so the release
-- gate does not depend on the target project having the pgtap extension enabled.

do $$
declare
  direct_generation_mutations integer;
  authenticated_replace_binding_execute boolean;
  authenticated_claim_execute boolean;
  service_replace_binding_execute boolean;
  service_claim_execute boolean;
  current_role_def text;
begin
  select count(*)::integer
  into direct_generation_mutations
  from information_schema.role_table_grants
  where table_schema = 'redex'
    and table_name = 'generation_jobs'
    and grantee = 'authenticated'
    and privilege_type in ('INSERT', 'UPDATE', 'DELETE');

  if direct_generation_mutations <> 0 then
    raise exception 'RLS smoke failed: authenticated can directly mutate redex.generation_jobs';
  end if;

  select pg_get_functiondef(to_regprocedure('redex.current_role()'))
  into current_role_def;

  if current_role_def is null or position('redex.profiles' in current_role_def) = 0 then
    raise exception 'RLS smoke failed: redex.current_role() is not profile-first';
  end if;

  if not exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'redex'
      and table_name = 'generation_jobs'
      and grantee = 'authenticated'
      and privilege_type = 'SELECT'
  ) then
    raise exception 'RLS smoke failed: authenticated cannot read generation job status';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'redex'
      and table_name = 'assignments'
      and column_name = 'assigned_by'
      and is_nullable <> 'NO'
  ) then
    raise exception 'RLS smoke failed: redex.assignments.assigned_by is nullable';
  end if;

  if exists (
    select 1
    from redex.assignments
    where assigned_by is null
  ) then
    raise exception 'RLS smoke failed: redex.assignments contains null assigned_by rows';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'redex'
      and table_name = 'module_source_bindings'
      and column_name = 'module_version_id'
  ) then
    raise exception 'RLS smoke failed: module_source_bindings.module_version_id is missing';
  end if;

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'redex'
      and tablename = 'module_source_bindings'
      and indexname = 'module_source_bindings_module_version_source_section_key'
  ) then
    raise exception 'RLS smoke failed: module-version-scoped source binding uniqueness index is missing';
  end if;

  select has_function_privilege(
    'authenticated',
    'redex.replace_module_source_bindings(text, uuid, jsonb, uuid, uuid, text)',
    'EXECUTE'
  )
  into authenticated_replace_binding_execute;

  if authenticated_replace_binding_execute then
    raise exception 'RLS smoke failed: authenticated can execute replace_module_source_bindings';
  end if;

  select has_function_privilege(
    'authenticated',
    'redex.claim_next_generation_job(text)',
    'EXECUTE'
  )
  into authenticated_claim_execute;

  if authenticated_claim_execute then
    raise exception 'RLS smoke failed: authenticated can execute claim_next_generation_job';
  end if;

  select has_function_privilege(
    'service_role',
    'redex.replace_module_source_bindings(text, uuid, jsonb, uuid, uuid, text)',
    'EXECUTE'
  )
  into service_replace_binding_execute;

  if not service_replace_binding_execute then
    raise exception 'RLS smoke failed: service_role cannot execute replace_module_source_bindings';
  end if;

  select has_function_privilege(
    'service_role',
    'redex.claim_next_generation_job(text)',
    'EXECUTE'
  )
  into service_claim_execute;

  if not service_claim_execute then
    raise exception 'RLS smoke failed: service_role cannot execute claim_next_generation_job';
  end if;
end $$;

select 'redex_rls_smoke_passed' as status;
