-- AI Slice C: durable staged generation pipeline with cost telemetry.

create table if not exists redex.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,
  job_type text not null check (job_type in ('full','section')),
  target_section_id uuid references redex.source_sections(id),
  status text not null check (status in (
    'queued','running','succeeded','failed','cancelled'
  )) default 'queued',
  stage_map jsonb not null default '{}'::jsonb,
  current_stage text,
  attempt_count integer not null default 0,
  model_used text,
  prompt_version text,
  -- Cost telemetry (Round 2 finding: must exist before real AI turns on)
  estimated_cost_cents integer,
  actual_cost_cents integer not null default 0,
  cost_breakdown jsonb not null default '{}'::jsonb,
  -- Inputs
  input_payload jsonb not null,
  -- Outputs (incrementally populated as stages complete)
  output_payload jsonb not null default '{}'::jsonb,
  -- Errors
  last_error_message text,
  last_error_stage text,
  -- Audit
  submitted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint section_job_requires_target_section
    check (job_type <> 'section' or target_section_id is not null)
);

create index if not exists generation_jobs_module_status_idx
  on redex.generation_jobs (module_id, status);
create index if not exists generation_jobs_status_created_idx
  on redex.generation_jobs (status, created_at desc);
create index if not exists generation_jobs_target_section_idx
  on redex.generation_jobs (target_section_id)
  where target_section_id is not null;

-- Authenticated Foundry authors need only read/insert. Worker updates happen via
-- service-role edge function, which bypasses RLS.
grant select, insert on redex.generation_jobs to authenticated;

-- Updated_at trigger
drop trigger if exists generation_jobs_set_updated_at on redex.generation_jobs;
create trigger generation_jobs_set_updated_at
before update on redex.generation_jobs
for each row execute function redex.set_updated_at();

-- RLS: foundry authors read + submit; admins same; learners no access; service role bypasses RLS.
alter table redex.generation_jobs enable row level security;
drop policy if exists generation_jobs_select on redex.generation_jobs;
create policy generation_jobs_select on redex.generation_jobs
  for select to authenticated
  using (redex.is_foundry_author());
drop policy if exists generation_jobs_insert on redex.generation_jobs;
create policy generation_jobs_insert on redex.generation_jobs
  for insert to authenticated
  with check (redex.is_foundry_author() and submitted_by = auth.uid());
-- Updates only by service role (the worker). No update policy for authenticated.
drop policy if exists generation_jobs_update on redex.generation_jobs;

-- Atomic worker claim helper. PostgREST/Supabase JS cannot express
-- SELECT ... FOR UPDATE SKIP LOCKED directly, so the cron-invoked worker calls
-- this SECURITY DEFINER function with the service-role client.
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
    where status in ('queued', 'running')
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
  returning job.*;
$$;

grant execute on function redex.claim_next_generation_job() to service_role;

comment on table redex.generation_jobs is
  'Durable AI Slice C Course Foundry generation jobs. Cron scheduling is intentionally not stored here because it requires project URL and service-role secret values; see Build Bible Slice C manual steps.';
