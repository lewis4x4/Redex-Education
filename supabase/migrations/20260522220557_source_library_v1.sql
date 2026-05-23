-- Redex Education source library v1 — schema-isolated to `redex`.
--
-- This migration was originally applied directly via SQL on 2026-05-22 into
-- the `public` schema. The 20260521000000 reconciliation migration moves
-- those objects from public to redex; this rewrite re-asserts the redex
-- shape idempotently so a from-scratch replay produces the same end state.

-- Authority levels for source files
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'redex' and t.typname = 'source_authority_level'
  ) then
    create type redex.source_authority_level as enum ('authoritative', 'supporting', 'context');
  end if;
end $$;

-- Status of source-file ingestion
do $$
begin
  if not exists (
    select 1 from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'redex' and t.typname = 'source_file_processing_status'
  ) then
    create type redex.source_file_processing_status as enum ('pending', 'processing', 'processed', 'failed');
  end if;
end $$;

-- A source file tracked by stable Drive file ID
create table if not exists redex.source_files (
  id uuid primary key default gen_random_uuid(),
  drive_file_id text not null unique,           -- stable Google Drive file ID
  drive_path text,                              -- display only; can change without affecting bindings
  title text not null,
  mime_type text not null,
  authority redex.source_authority_level not null default 'context',
  authority_source text not null default 'default',  -- 'frontmatter' | 'meta_md' | 'default'
  topic text,                                   -- optional Drive subfolder name within _library/
  current_version_id uuid,                      -- FK to source_file_versions (set after first sync)
  last_synced_at timestamptz,
  processing_status redex.source_file_processing_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists source_files_topic_idx on redex.source_files(topic);
create index if not exists source_files_authority_idx on redex.source_files(authority);

-- A snapshot of a source file at a specific Drive revision
create table if not exists redex.source_file_versions (
  id uuid primary key default gen_random_uuid(),
  source_file_id uuid not null references redex.source_files(id) on delete cascade,
  head_revision_id text not null,               -- Drive's headRevisionId at sync time
  content_hash text,                            -- SHA-256 of the file bytes (for binaries; nullable for very large files)
  size_bytes bigint,
  modified_time timestamptz,                    -- Drive modifiedTime
  raw_text text,                                -- full extracted text (markdown body etc.); nullable for non-text
  raw_text_preview text,                        -- first 500 chars
  parse_status redex.source_file_processing_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (source_file_id, head_revision_id)
);
create index if not exists source_file_versions_source_idx on redex.source_file_versions(source_file_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'source_files_current_version_fk'
      and conrelid = 'redex.source_files'::regclass
  ) then
    alter table redex.source_files
      add constraint source_files_current_version_fk
      foreign key (current_version_id) references redex.source_file_versions(id) on delete set null;
  end if;
end $$;

-- Parsed sections of a source-file version (markdown heading-driven; matches the SourceSection TS type)
create table if not exists redex.source_sections (
  id uuid primary key default gen_random_uuid(),
  source_file_version_id uuid not null references redex.source_file_versions(id) on delete cascade,
  level smallint not null check (level between 0 and 6),
  heading text not null default '',
  body text not null default '',
  position_index integer not null,
  has_placeholders boolean not null default false,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (source_file_version_id, position_index)
);
create index if not exists source_sections_version_idx on redex.source_sections(source_file_version_id);

-- Which source files (and versions, and sections) a module is bound to
-- (For Slice 2.4: file-level bindings. Section-level granularity is captured by the section_id column,
-- nullable for whole-file bindings; Slice 7.3 uses section_id for precise staleness.)
create table if not exists redex.module_source_bindings (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,                     -- TODO: FK to modules(id) once that table lands in Slice 8.2
  source_file_id uuid not null references redex.source_files(id) on delete restrict,
  source_file_version_id uuid not null references redex.source_file_versions(id) on delete restrict,
  source_section_id uuid references redex.source_sections(id) on delete set null,
  binding_kind text not null default 'whole_file',  -- 'whole_file' | 'section'
  flagged_for_review boolean not null default false,
  flag_reason text,                            -- 'equal_authority_conflict' | 'stale' | null
  created_at timestamptz not null default now(),
  unique (module_id, source_file_id, source_section_id)
);
create index if not exists module_source_bindings_module_idx on redex.module_source_bindings(module_id);
create index if not exists module_source_bindings_source_idx on redex.module_source_bindings(source_file_id);

-- RLS: enable on all; admin-only for v1 (no learner reads to these tables)
alter table redex.source_files enable row level security;
alter table redex.source_file_versions enable row level security;
alter table redex.source_sections enable row level security;
alter table redex.module_source_bindings enable row level security;

-- For v1 (no profiles table yet), permit authenticated full access. RLS tightens to admin role
-- once profiles + role-checking land in a later slice.
drop policy if exists source_files_authenticated on redex.source_files;
create policy source_files_authenticated on redex.source_files
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists source_file_versions_authenticated on redex.source_file_versions;
create policy source_file_versions_authenticated on redex.source_file_versions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists source_sections_authenticated on redex.source_sections;
create policy source_sections_authenticated on redex.source_sections
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists module_source_bindings_authenticated on redex.module_source_bindings;
create policy module_source_bindings_authenticated on redex.module_source_bindings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
