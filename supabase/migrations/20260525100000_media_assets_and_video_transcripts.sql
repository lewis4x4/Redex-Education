-- Slice 10.6 — Media assets and video transcript provenance.
--
-- Additive persistence for async video renders and transcript-derived source
-- corpus rows. This migration intentionally does not add worker stages or Edge
-- Functions; those later slices can write through service-role contexts.

create table if not exists redex.media_assets (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,
  module_version_id uuid references redex.module_versions(id) on delete set null,
  training_lesson_id uuid references redex.training_lessons(id) on delete set null,
  lesson_index integer check (lesson_index is null or lesson_index >= 0),
  lesson_title text,

  provider text not null check (provider in ('heygen')),
  heygen_video_id text,
  avatar_id text,

  status text not null default 'queued' check (
    status in ('queued', 'submitted', 'rendering', 'succeeded', 'failed', 'cancelled', 'stale')
  ),

  storage_bucket text,
  storage_path text,
  mime_type text,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  cost_credits numeric not null default 0 check (cost_credits >= 0),

  transcript_source_file_id uuid references redex.source_files(id) on delete set null,
  render_attempt_count integer not null default 0 check (render_attempt_count >= 0),
  max_render_attempts integer not null default 2 check (max_render_attempts > 0),

  last_error_message text,
  stale_since timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,

  constraint media_assets_storage_pair_chk check (
    (storage_bucket is null and storage_path is null)
    or (storage_bucket is not null and storage_path is not null)
  )
);

create index if not exists media_assets_module_version_status_idx
  on redex.media_assets (module_version_id, status);

create index if not exists media_assets_training_lesson_idx
  on redex.media_assets (training_lesson_id);

create index if not exists media_assets_heygen_video_idx
  on redex.media_assets (heygen_video_id);

create index if not exists media_assets_status_updated_at_idx
  on redex.media_assets (status, updated_at);

create index if not exists media_assets_transcript_source_file_idx
  on redex.media_assets (transcript_source_file_id);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'media_assets_set_updated_at'
  ) then
    create trigger media_assets_set_updated_at
    before update on redex.media_assets
    for each row
    execute function redex.set_updated_at();
  end if;
end;
$$;

alter table redex.source_files
  add column if not exists source_kind text not null default 'drive',
  add column if not exists media_asset_id uuid references redex.media_assets(id) on delete set null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'source_files_source_kind_chk'
      and conrelid = 'redex.source_files'::regclass
  ) then
    alter table redex.source_files
      add constraint source_files_source_kind_chk
      check (source_kind in ('drive', 'synthetic_video_transcript'));
  end if;
end;
$$;

create index if not exists source_files_media_asset_idx
  on redex.source_files (media_asset_id);

alter table redex.source_sections
  add column if not exists start_seconds integer,
  add column if not exists end_seconds integer,
  add column if not exists derived_from_section_ids uuid[] not null default '{}'::uuid[];

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'source_sections_transcript_time_range_chk'
      and conrelid = 'redex.source_sections'::regclass
  ) then
    alter table redex.source_sections
      add constraint source_sections_transcript_time_range_chk
      check (
        (start_seconds is null and end_seconds is null)
        or (
          start_seconds is not null
          and end_seconds is not null
          and start_seconds >= 0
          and end_seconds >= start_seconds
        )
      );
  end if;
end;
$$;

create index if not exists source_sections_derived_from_section_ids_idx
  on redex.source_sections using gin (derived_from_section_ids);

create index if not exists source_sections_version_start_seconds_idx
  on redex.source_sections (source_file_version_id, start_seconds);

alter table redex.media_assets enable row level security;

drop policy if exists media_assets_select_foundry on redex.media_assets;
create policy media_assets_select_foundry
  on redex.media_assets
  for select
  to authenticated
  using (redex.is_foundry_author());

-- Intentionally no authenticated insert/update/delete policies: media rows are
-- written by service-role worker/Edge Function contexts in later Slice 10.6 work.
