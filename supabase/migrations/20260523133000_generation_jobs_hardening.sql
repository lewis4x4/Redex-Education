-- AI Slice C hardening: secure worker RPC, active-job idempotency, and single-stage leasing.

alter table redex.generation_jobs
  add column if not exists operation text,
  add column if not exists idempotency_key text;

update redex.generation_jobs
set operation = coalesce(operation, input_payload ->> 'operation')
where operation is null;

update redex.generation_jobs
set idempotency_key = coalesce(
  idempotency_key,
  module_id || ':' || job_type || ':' || coalesce(target_section_id::text, 'full') || ':' || coalesce(operation, 'unknown') || ':' || coalesce(prompt_version, 'unknown')
)
where idempotency_key is null;

create unique index if not exists generation_jobs_active_idempotency_idx
  on redex.generation_jobs (idempotency_key)
  where status in ('queued', 'running') and idempotency_key is not null;

revoke all on function redex.claim_next_generation_job() from public;
revoke all on function redex.claim_next_generation_job() from anon;
revoke all on function redex.claim_next_generation_job() from authenticated;

create or replace function redex.claim_next_generation_job()
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
    order by created_at asc
    for update skip locked
    limit 1
  )
  update redex.generation_jobs job
  set status = 'running',
      attempt_count = job.attempt_count + 1,
      updated_at = now()
  from next_job
  where job.id = next_job.id
    and auth.role() = 'service_role'
  returning job.*;
$$;

revoke all on function redex.claim_next_generation_job() from public;
revoke all on function redex.claim_next_generation_job() from anon;
revoke all on function redex.claim_next_generation_job() from authenticated;
grant execute on function redex.claim_next_generation_job() to service_role;
