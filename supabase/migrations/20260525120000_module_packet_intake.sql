-- Slice 1 — module packet intake persistence and Drive job queue.
--
-- Adds the durable database layer for Option B topic-to-packet intake without
-- implementing Drive write functions, frontend integration, or generation
-- behavior. Brainstormed packet files remain context-only until an explicit
-- human review/promote action in a later slice.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Source authority provenance for brainstormed / human-authored / imported rows.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'redex'
      and t.typname = 'source_authority_provenance'
  ) then
    create type redex.source_authority_provenance as enum (
      'brainstormed',
      'human_authored',
      'imported'
    );
  end if;
end $$;

alter table redex.source_files
  add column if not exists authority_provenance redex.source_authority_provenance
    not null default 'imported';

create index if not exists source_files_authority_provenance_idx
  on redex.source_files (authority_provenance);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'source_files_brainstormed_context_only_chk'
      and conrelid = 'redex.source_files'::regclass
  ) then
    alter table redex.source_files
      add constraint source_files_brainstormed_context_only_chk
      check (authority_provenance <> 'brainstormed' or authority = 'context');
  end if;
end $$;

comment on column redex.source_files.authority_provenance is
  'Whether authority came from imported source material, human authorship, or AI brainstorming. Brainstormed rows must remain authority=context until explicitly promoted.';

create or replace function redex.block_unaudited_brainstormed_source_promotion()
returns trigger
language plpgsql
security definer
set search_path = redex, public, pg_catalog
as $$
begin
  if old.authority_provenance = 'brainstormed'
     and (
       new.authority_provenance is distinct from old.authority_provenance
       or new.authority is distinct from old.authority
     )
     and current_setting('redex.allow_brainstormed_source_promotion', true) is distinct from 'on'
  then
    raise exception 'Brainstormed source files cannot be promoted by direct update'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke all on function redex.block_unaudited_brainstormed_source_promotion() from public;

drop trigger if exists source_files_block_unaudited_brainstormed_source_promotion on redex.source_files;
create trigger source_files_block_unaudited_brainstormed_source_promotion
  before update on redex.source_files
  for each row execute function redex.block_unaudited_brainstormed_source_promotion();

-- -----------------------------------------------------------------------------
-- Packet proposals: human-gated intake records, not module/source generation.
-- -----------------------------------------------------------------------------
create table if not exists redex.module_intake_proposals (
  id uuid primary key default gen_random_uuid(),
  client_idempotency_key text not null unique,

  proposed_module_slug text not null,
  proposed_module_title text not null,
  library_topic text not null,
  library_topic_slug text not null,
  module_folder_slug text not null,
  audience_hint text,

  status text not null default 'drafting',
  packet_payload jsonb not null default '{}'::jsonb,
  proposed_entries jsonb not null default '[]'::jsonb,
  manifest_snapshot jsonb,

  -- Populated by the Drive-write worker after folder creation. Nullable so the
  -- proposal row can exist before the first upload attempt; unique when present
  -- to make retry/upsert paths drive-folder-id based.
  drive_folder_id text,
  library_drive_folder_id text,
  module_drive_folder_id text,
  manifest_drive_file_id text,

  module_id uuid,
  module_version_id uuid references redex.module_versions(id) on delete set null,

  created_by uuid not null references redex.profiles(id),
  reviewer_id uuid references redex.profiles(id),
  reviewed_at timestamptz,

  last_error_code text,
  last_error_message text,
  superseded_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,

  constraint module_intake_proposals_status_chk check (status in (
    'drafting',
    'queued',
    'uploading_to_drive',
    'drive_uploaded',
    'registering',
    'registered',
    'syncing',
    'ready_for_outline',
    'pending_review',
    'accepted',
    'rejected',
    'discarded',
    'upload_failed',
    'registration_failed',
    'sync_failed',
    'superseded'
  )),
  constraint module_intake_proposals_packet_payload_object_chk
    check (jsonb_typeof(packet_payload) = 'object'),
  constraint module_intake_proposals_proposed_entries_array_chk
    check (jsonb_typeof(proposed_entries) = 'array'),
  constraint module_intake_proposals_manifest_snapshot_object_chk
    check (manifest_snapshot is null or jsonb_typeof(manifest_snapshot) = 'object'),
  constraint module_intake_proposals_review_actor_chk
    check (reviewed_at is null or reviewer_id is not null),
  constraint module_intake_proposals_failure_error_chk
    check (
      status not in ('upload_failed', 'registration_failed', 'sync_failed', 'superseded')
      or last_error_code is not null
      or superseded_reason is not null
    )
);

create unique index if not exists module_intake_proposals_drive_folder_uidx
  on redex.module_intake_proposals (drive_folder_id)
  where drive_folder_id is not null;

create unique index if not exists module_intake_proposals_library_module_folder_uidx
  on redex.module_intake_proposals (library_topic_slug, module_folder_slug)
  where status not in ('discarded', 'rejected', 'superseded');

create index if not exists module_intake_proposals_status_created_idx
  on redex.module_intake_proposals (status, created_at desc);

create index if not exists module_intake_proposals_created_by_idx
  on redex.module_intake_proposals (created_by, created_at desc);

create index if not exists module_intake_proposals_module_version_idx
  on redex.module_intake_proposals (module_version_id)
  where module_version_id is not null;

-- -----------------------------------------------------------------------------
-- Drive folder registry: stable Drive IDs are the idempotency boundary.
-- -----------------------------------------------------------------------------
create table if not exists redex.module_drive_folders (
  id uuid primary key default gen_random_uuid(),
  module_intake_proposal_id uuid not null references redex.module_intake_proposals(id) on delete cascade,
  module_id uuid,
  module_version_id uuid references redex.module_versions(id) on delete set null,

  folder_kind text not null,
  drive_folder_id text not null,
  parent_drive_folder_id text,
  folder_name text not null,
  folder_slug text,
  manifest_drive_file_id text,

  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz,
  archived_at timestamptz,

  created_by uuid references redex.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint module_drive_folders_kind_chk check (folder_kind in (
    'library_topic',
    'module_packet'
  )),
  constraint module_drive_folders_archive_seen_chk
    check (archived_at is null or last_seen_at is not null)
);

alter table redex.module_drive_folders
  drop constraint if exists module_drive_folders_drive_folder_id_key;

create unique index if not exists module_drive_folders_proposal_kind_uidx
  on redex.module_drive_folders (module_intake_proposal_id, folder_kind);

create unique index if not exists module_drive_folders_module_packet_drive_folder_uidx
  on redex.module_drive_folders (drive_folder_id)
  where folder_kind = 'module_packet' and archived_at is null;

create index if not exists module_drive_folders_library_topic_drive_folder_idx
  on redex.module_drive_folders (drive_folder_id)
  where folder_kind = 'library_topic' and archived_at is null;

create index if not exists module_drive_folders_module_version_idx
  on redex.module_drive_folders (module_version_id)
  where module_version_id is not null;

create index if not exists module_drive_folders_kind_seen_idx
  on redex.module_drive_folders (folder_kind, first_seen_at desc);

-- -----------------------------------------------------------------------------
-- Drive sync/upload/register jobs with generation-job-style lease semantics.
-- -----------------------------------------------------------------------------
create table if not exists redex.drive_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  module_intake_proposal_id uuid references redex.module_intake_proposals(id) on delete set null,

  job_type text not null,
  status text not null default 'queued',
  dedupe_key text not null unique,

  drive_folder_id text,
  library_drive_folder_id text,
  module_drive_folder_id text,
  target_payload jsonb not null default '{}'::jsonb,
  checkpoint_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,

  attempt_count integer not null default 0,
  max_attempts integer not null default 3,
  next_run_at timestamptz not null default now(),
  lease_token uuid,
  locked_at timestamptz,
  lease_expires_at timestamptz,
  worker_id text,

  last_failure_class text,
  last_error_code text,
  last_error_message text,
  last_error_stage text,

  submitted_by uuid references redex.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,

  constraint drive_sync_jobs_type_chk check (job_type in (
    'folder_sync',
    'packet_upload',
    'packet_register',
    'packet_upload_register'
  )),
  constraint drive_sync_jobs_status_chk check (status in (
    'queued',
    'running',
    'succeeded',
    'failed',
    'cancelled'
  )),
  constraint drive_sync_jobs_max_attempts_positive_chk check (max_attempts > 0),
  constraint drive_sync_jobs_attempt_count_nonnegative_chk check (attempt_count >= 0),
  constraint drive_sync_jobs_target_payload_object_chk check (jsonb_typeof(target_payload) = 'object'),
  constraint drive_sync_jobs_checkpoint_payload_object_chk check (jsonb_typeof(checkpoint_payload) = 'object'),
  constraint drive_sync_jobs_result_payload_object_chk check (jsonb_typeof(result_payload) = 'object'),
  constraint drive_sync_jobs_completed_terminal_chk check (
    completed_at is null or status in ('succeeded', 'failed', 'cancelled')
  ),
  constraint drive_sync_jobs_lease_running_chk check (
    status = 'running'
    or (lease_token is null and locked_at is null and lease_expires_at is null)
  )
);

create index if not exists drive_sync_jobs_proposal_status_idx
  on redex.drive_sync_jobs (module_intake_proposal_id, status)
  where module_intake_proposal_id is not null;

create index if not exists drive_sync_jobs_ready_queue_idx
  on redex.drive_sync_jobs (next_run_at asc, created_at asc)
  where status = 'queued';

create index if not exists drive_sync_jobs_expired_running_lease_idx
  on redex.drive_sync_jobs (lease_expires_at asc, locked_at asc)
  where status = 'running' and lease_expires_at is not null;

create index if not exists drive_sync_jobs_drive_folder_idx
  on redex.drive_sync_jobs (drive_folder_id)
  where drive_folder_id is not null;

comment on column redex.drive_sync_jobs.dedupe_key is
  'Logical idempotency key. Retry updates the same row instead of enqueueing duplicate Drive folder/file work.';
comment on column redex.drive_sync_jobs.checkpoint_payload is
  'Worker checkpoint state such as Drive page tokens or uploaded file cursors for resumable intake.';

-- -----------------------------------------------------------------------------
-- Intake events: append-only observability/audit trail for proposal and Drive IO.
-- -----------------------------------------------------------------------------
create table if not exists redex.intake_events (
  id uuid primary key default gen_random_uuid(),
  module_intake_proposal_id uuid references redex.module_intake_proposals(id) on delete set null,
  drive_sync_job_id uuid references redex.drive_sync_jobs(id) on delete set null,

  event_kind text not null,
  drive_id text,
  ok boolean not null default true,
  error_class text,
  error_code text,
  error_message text,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  sha256 text,
  actor text,
  actor_id uuid references redex.profiles(id),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint intake_events_payload_object_chk check (jsonb_typeof(payload) = 'object'),
  constraint intake_events_error_shape_chk check (
    ok or error_class is not null or error_code is not null or error_message is not null
  )
);

create index if not exists intake_events_proposal_created_idx
  on redex.intake_events (module_intake_proposal_id, created_at desc)
  where module_intake_proposal_id is not null;

create index if not exists intake_events_job_created_idx
  on redex.intake_events (drive_sync_job_id, created_at desc)
  where drive_sync_job_id is not null;

create index if not exists intake_events_kind_created_idx
  on redex.intake_events (event_kind, created_at desc);

create index if not exists intake_events_drive_id_idx
  on redex.intake_events (drive_id)
  where drive_id is not null;

comment on table redex.intake_events is
  'Append-only intake audit and observability stream. Service-role workers append Drive IO/proposal events; Foundry authors can read them.';

-- -----------------------------------------------------------------------------
-- updated_at triggers.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'module_intake_proposals_set_updated_at') then
    create trigger module_intake_proposals_set_updated_at
    before update on redex.module_intake_proposals
    for each row execute function redex.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'module_drive_folders_set_updated_at') then
    create trigger module_drive_folders_set_updated_at
    before update on redex.module_drive_folders
    for each row execute function redex.set_updated_at();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'drive_sync_jobs_set_updated_at') then
    create trigger drive_sync_jobs_set_updated_at
    before update on redex.drive_sync_jobs
    for each row execute function redex.set_updated_at();
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Worker claim helper. Mirrors generation job hardening: service-role only,
-- queued jobs only, no automatic reclaim of in-flight provider work.
-- -----------------------------------------------------------------------------
create or replace function redex.claim_next_drive_sync_job(p_worker_id text default null)
returns setof redex.drive_sync_jobs
language sql
volatile
security definer
set search_path = redex, public, pg_catalog
as $$
  with next_job as (
    select id
    from redex.drive_sync_jobs
    where status = 'queued'
      and next_run_at <= now()
      and attempt_count < max_attempts
    order by next_run_at asc, created_at asc
    for update skip locked
    limit 1
  )
  update redex.drive_sync_jobs job
  set status = 'running',
      lease_token = gen_random_uuid(),
      locked_at = now(),
      lease_expires_at = now() + interval '15 minutes',
      worker_id = coalesce(nullif(p_worker_id, ''), 'drive-sync-worker'),
      attempt_count = job.attempt_count + 1,
      updated_at = now()
  from next_job
  where job.id = next_job.id
    and auth.role() = 'service_role'
  returning job.*;
$$;

revoke all on function redex.claim_next_drive_sync_job(text) from public;
revoke all on function redex.claim_next_drive_sync_job(text) from anon;
revoke all on function redex.claim_next_drive_sync_job(text) from authenticated;
grant execute on function redex.claim_next_drive_sync_job(text) to service_role;

comment on function redex.claim_next_drive_sync_job(text) is
  'Claims one queued Drive sync/intake job for a service-role worker with a 15-minute lease.';

-- -----------------------------------------------------------------------------
-- Grants and RLS. Browser clients can read Foundry-visible rows. Direct writes
-- are Foundry-gated only where useful; worker mutation is expected to happen via
-- service-role Edge Function contexts in later slices.
-- -----------------------------------------------------------------------------
revoke insert, update, delete on redex.module_intake_proposals from authenticated, anon;
revoke insert, update, delete on redex.module_drive_folders from authenticated, anon;
revoke insert, update, delete on redex.drive_sync_jobs from authenticated, anon;
revoke insert, update, delete on redex.intake_events from authenticated, anon;

grant select on redex.module_intake_proposals to authenticated;
grant select on redex.module_drive_folders to authenticated;
grant select on redex.drive_sync_jobs to authenticated;
grant select on redex.intake_events to authenticated;

grant select, insert, update, delete on redex.module_intake_proposals to service_role;
grant select, insert, update, delete on redex.module_drive_folders to service_role;
grant select, insert, update, delete on redex.drive_sync_jobs to service_role;
grant select, insert, update, delete on redex.intake_events to service_role;

alter table redex.module_intake_proposals enable row level security;
alter table redex.module_drive_folders enable row level security;
alter table redex.drive_sync_jobs enable row level security;
alter table redex.intake_events enable row level security;

drop policy if exists module_intake_proposals_select_foundry on redex.module_intake_proposals;
create policy module_intake_proposals_select_foundry
  on redex.module_intake_proposals
  for select
  to authenticated
  using (redex.is_foundry_author());

drop policy if exists module_intake_proposals_insert_foundry on redex.module_intake_proposals;
drop policy if exists module_intake_proposals_update_foundry on redex.module_intake_proposals;

drop policy if exists module_drive_folders_select_foundry on redex.module_drive_folders;
create policy module_drive_folders_select_foundry
  on redex.module_drive_folders
  for select
  to authenticated
  using (redex.is_foundry_author());

drop policy if exists module_drive_folders_insert_foundry on redex.module_drive_folders;
drop policy if exists module_drive_folders_update_foundry on redex.module_drive_folders;

drop policy if exists drive_sync_jobs_select_foundry on redex.drive_sync_jobs;
create policy drive_sync_jobs_select_foundry
  on redex.drive_sync_jobs
  for select
  to authenticated
  using (redex.is_foundry_author());

-- Intentionally no authenticated insert/update/delete policies for drive_sync_jobs;
-- Slice 2 submit/worker functions should verify Foundry auth, then write jobs via
-- service-role contexts so queue mutation cannot be forged from the browser.

drop policy if exists intake_events_select_foundry on redex.intake_events;
create policy intake_events_select_foundry
  on redex.intake_events
  for select
  to authenticated
  using (redex.is_foundry_author());

-- Intentionally no authenticated insert/update/delete policies for intake_events.
-- Events are append-only from service-role intake workers.
