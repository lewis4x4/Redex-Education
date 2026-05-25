-- Phase 3/4 backend hardening: generation job leases/retries plus enqueue security.

-- -----------------------------------------------------------------------------
-- Generation job reliability columns.
-- -----------------------------------------------------------------------------
alter table redex.generation_jobs
  add column if not exists lease_token uuid,
  add column if not exists locked_at timestamptz,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists next_run_at timestamptz not null default now(),
  add column if not exists max_attempts integer not null default 3,
  add column if not exists last_failure_class text,
  add column if not exists worker_id text;

alter table redex.generation_jobs
  drop constraint if exists generation_jobs_max_attempts_positive_chk,
  add constraint generation_jobs_max_attempts_positive_chk check (max_attempts > 0);

create index if not exists generation_jobs_ready_queue_idx
  on redex.generation_jobs (next_run_at asc, created_at asc)
  where status = 'queued';

create index if not exists generation_jobs_expired_running_lease_idx
  on redex.generation_jobs (lease_expires_at asc, locked_at asc)
  where status = 'running' and lease_expires_at is not null;

comment on column redex.generation_jobs.lease_token is
  'Opaque worker lease token used for compare-and-set updates by the edge worker.';
comment on column redex.generation_jobs.lease_expires_at is
  'Visibility timestamp for stale running jobs. Workers do not automatically reclaim running rows in this phase.';
comment on index redex.generation_jobs_expired_running_lease_idx is
  'Makes stale running jobs visible without blindly reclaiming in-progress provider work.';

-- Browser clients may poll generation jobs but must enqueue only through the
-- submit-generation-job edge function, which uses the service-role key.
revoke insert, update, delete on redex.generation_jobs from authenticated;
grant select on redex.generation_jobs to authenticated;

drop policy if exists generation_jobs_insert on redex.generation_jobs;
drop policy if exists generation_jobs_update on redex.generation_jobs;
drop policy if exists generation_jobs_delete on redex.generation_jobs;

-- Atomic worker claim helper. Claim queued, ready jobs only; do not reclaim
-- running rows automatically because a provider call may still be in flight.
revoke all on function redex.claim_next_generation_job() from public;
revoke all on function redex.claim_next_generation_job() from anon;
revoke all on function redex.claim_next_generation_job() from authenticated;
drop function if exists redex.claim_next_generation_job();

create or replace function redex.claim_next_generation_job(p_worker_id text default null)
returns setof redex.generation_jobs
language sql
volatile
security definer
set search_path = redex, public, pg_catalog
as $$
  with next_job as (
    select id
    from redex.generation_jobs
    where status = 'queued'
      and next_run_at <= now()
      and attempt_count < max_attempts
    order by next_run_at asc, created_at asc
    for update skip locked
    limit 1
  )
  update redex.generation_jobs job
  set status = 'running',
      lease_token = gen_random_uuid(),
      locked_at = now(),
      lease_expires_at = now() + interval '15 minutes',
      worker_id = coalesce(nullif(p_worker_id, ''), 'generation-worker'),
      attempt_count = job.attempt_count + 1,
      updated_at = now()
  from next_job
  where job.id = next_job.id
    and auth.role() = 'service_role'
  returning job.*;
$$;

revoke all on function redex.claim_next_generation_job(text) from public;
revoke all on function redex.claim_next_generation_job(text) from anon;
revoke all on function redex.claim_next_generation_job(text) from authenticated;
grant execute on function redex.claim_next_generation_job(text) to service_role;

-- Conservative stale-job recovery helper. The worker fails expired leases instead
-- of reclaiming them because a provider request may still be in flight.
create or replace function redex.fail_stale_generation_jobs(p_worker_id text default null)
returns integer
language plpgsql
volatile
security definer
set search_path = redex, public, pg_catalog
as $$
declare
  failed_count integer := 0;
begin
  if auth.role() <> 'service_role' then
    raise exception 'fail_stale_generation_jobs requires service_role' using errcode = '42501';
  end if;

  with stale_jobs as (
    select id
    from redex.generation_jobs
    where status = 'running'
      and lease_expires_at is not null
      and lease_expires_at < now()
    for update skip locked
  )
  update redex.generation_jobs job
  set status = 'failed',
      last_failure_class = 'manual_recovery_required',
      last_error_message = 'Generation job lease expired before worker completion; manual recovery required before retry.',
      last_error_stage = coalesce(job.current_stage, job.last_error_stage),
      completed_at = now(),
      updated_at = now(),
      lease_token = null,
      locked_at = null,
      lease_expires_at = null,
      worker_id = coalesce(nullif(p_worker_id, ''), 'generation-worker')
  from stale_jobs
  where job.id = stale_jobs.id
    and auth.role() = 'service_role';

  get diagnostics failed_count = row_count;
  return failed_count;
end;
$$;

revoke all on function redex.fail_stale_generation_jobs(text) from public;
revoke all on function redex.fail_stale_generation_jobs(text) from anon;
revoke all on function redex.fail_stale_generation_jobs(text) from authenticated;
grant execute on function redex.fail_stale_generation_jobs(text) to service_role;

comment on function redex.fail_stale_generation_jobs(text) is
  'Marks expired running generation jobs failed/manual_recovery_required without retrying provider work.';

-- -----------------------------------------------------------------------------
-- Source binding replacement: the worker needs stale binding pruning to be atomic
-- with replacement rows so a failed write cannot leave a module unbound.
-- -----------------------------------------------------------------------------
alter table redex.module_source_bindings
  add column if not exists module_version_id uuid;

alter table redex.module_source_bindings
  drop constraint if exists module_source_bindings_module_id_source_file_id_source_section_id_key;

create unique index if not exists module_source_bindings_module_version_source_section_key
  on redex.module_source_bindings (module_version_id, source_file_id, source_section_id);

comment on index redex.module_source_bindings_module_version_source_section_key is
  'Scopes source binding replacement/upsert uniqueness to one module version so replacing v2 cannot prune or conflict with v1.';

drop function if exists redex.replace_module_source_bindings(text, jsonb);
drop function if exists redex.replace_module_source_bindings(text, uuid, jsonb);
drop function if exists redex.replace_module_source_bindings(text, uuid, jsonb, uuid, uuid, text);

create or replace function redex.replace_module_source_bindings(
  p_module_id text,
  p_module_version_id uuid,
  p_bindings jsonb,
  p_job_id uuid default null,
  p_lease_token uuid default null,
  p_expected_stage text default null
)
returns integer
language plpgsql
volatile
security definer
set search_path = redex, public, pg_catalog
as $$
declare
  inserted_count integer := 0;
begin
  if auth.role() <> 'service_role' then
    raise exception 'replace_module_source_bindings requires service_role' using errcode = '42501';
  end if;

  if p_module_version_id is null then
    raise exception 'replace_module_source_bindings requires p_module_version_id' using errcode = '23502';
  end if;

  if p_job_id is not null then
    if p_lease_token is null or p_expected_stage is null then
      raise exception 'replace_module_source_bindings lease guard requires p_lease_token and p_expected_stage' using errcode = '23502';
    end if;

    if not exists (
      select 1
      from redex.generation_jobs job
      where job.id = p_job_id
        and job.lease_token = p_lease_token
        and job.status = 'running'
        and job.current_stage = p_expected_stage
        and (job.lease_expires_at is null or job.lease_expires_at > now())
    ) then
      raise exception 'replace_module_source_bindings job lease is no longer active' using errcode = '40001';
    end if;
  end if;

  delete from redex.module_source_bindings
  where module_id = p_module_id
    and module_version_id = p_module_version_id;

  if jsonb_array_length(coalesce(p_bindings, '[]'::jsonb)) = 0 then
    return 0;
  end if;

  insert into redex.module_source_bindings (
    module_id,
    module_version_id,
    source_file_id,
    source_file_version_id,
    source_section_id,
    binding_kind,
    flagged_for_review,
    flag_reason
  )
  select
    p_module_id,
    p_module_version_id,
    binding.source_file_id::uuid,
    binding.source_file_version_id::uuid,
    nullif(binding.source_section_id, '')::uuid,
    binding.binding_kind,
    binding.flagged_for_review,
    binding.flag_reason
  from jsonb_to_recordset(p_bindings) as binding(
    module_version_id text,
    source_file_id text,
    source_file_version_id text,
    source_section_id text,
    binding_kind text,
    flagged_for_review boolean,
    flag_reason text
  );

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function redex.replace_module_source_bindings(text, uuid, jsonb, uuid, uuid, text) from public;
revoke all on function redex.replace_module_source_bindings(text, uuid, jsonb, uuid, uuid, text) from anon;
revoke all on function redex.replace_module_source_bindings(text, uuid, jsonb, uuid, uuid, text) from authenticated;
grant execute on function redex.replace_module_source_bindings(text, uuid, jsonb, uuid, uuid, text) to service_role;

-- -----------------------------------------------------------------------------
-- Role authority: privileged RLS reads current profile role first. Missing
-- profiles default to learner; stale JWT role claims must not preserve elevated
-- privileges after a profile downgrade.
-- -----------------------------------------------------------------------------
create or replace function redex.current_role()
returns text
language sql
stable
security definer
set search_path = redex, public, pg_catalog
as $$
  select coalesce(
    (select p.role from redex.profiles p where p.id = auth.uid()),
    'learner'
  );
$$;

grant execute on function redex.current_role() to authenticated;

-- -----------------------------------------------------------------------------
-- Assignment delete/nullability correction: preserve assignment history by
-- restricting profile deletes instead of tombstoning assignment actors.
-- -----------------------------------------------------------------------------
alter table redex.assignments
  drop constraint if exists assignments_assignee_user_id_fkey,
  add constraint assignments_assignee_user_id_fkey
    foreign key (assignee_user_id) references redex.profiles(id) on delete restrict;

alter table redex.assignments
  drop constraint if exists assignments_assigned_by_fkey,
  add constraint assignments_assigned_by_fkey
    foreign key (assigned_by) references redex.profiles(id) on delete restrict;

do $$
begin
  if exists (select 1 from redex.assignments where assigned_by is null) then
    raise exception 'Cannot enforce assignments.assigned_by NOT NULL while NULL rows exist; backfill assignment actor history before applying this migration.'
      using errcode = '23502';
  end if;
end;
$$;

alter table redex.assignments alter column assigned_by set not null;
