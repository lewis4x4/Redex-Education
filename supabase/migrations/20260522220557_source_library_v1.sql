-- Authority levels for source files
create type source_authority_level as enum ('authoritative', 'supporting', 'context');

-- Status of source-file ingestion
create type source_file_processing_status as enum ('pending', 'processing', 'processed', 'failed');

-- A source file tracked by stable Drive file ID
create table public.source_files (
  id uuid primary key default gen_random_uuid(),
  drive_file_id text not null unique,           -- stable Google Drive file ID
  drive_path text,                              -- display only; can change without affecting bindings
  title text not null,
  mime_type text not null,
  authority source_authority_level not null default 'context',
  authority_source text not null default 'default',  -- 'frontmatter' | 'meta_md' | 'default'
  topic text,                                   -- optional Drive subfolder name within _library/
  current_version_id uuid,                      -- FK to source_file_versions (set after first sync)
  last_synced_at timestamptz,
  processing_status source_file_processing_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index source_files_topic_idx on public.source_files(topic);
create index source_files_authority_idx on public.source_files(authority);

-- A snapshot of a source file at a specific Drive revision
create table public.source_file_versions (
  id uuid primary key default gen_random_uuid(),
  source_file_id uuid not null references public.source_files(id) on delete cascade,
  head_revision_id text not null,               -- Drive's headRevisionId at sync time
  content_hash text,                            -- SHA-256 of the file bytes (for binaries; nullable for very large files)
  size_bytes bigint,
  modified_time timestamptz,                    -- Drive modifiedTime
  raw_text text,                                -- full extracted text (markdown body etc.); nullable for non-text
  raw_text_preview text,                        -- first 500 chars
  parse_status source_file_processing_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (source_file_id, head_revision_id)
);
create index source_file_versions_source_idx on public.source_file_versions(source_file_id);

alter table public.source_files
  add constraint source_files_current_version_fk
  foreign key (current_version_id) references public.source_file_versions(id) on delete set null;

-- Parsed sections of a source-file version (markdown heading-driven; matches the SourceSection TS type)
create table public.source_sections (
  id uuid primary key default gen_random_uuid(),
  source_file_version_id uuid not null references public.source_file_versions(id) on delete cascade,
  level smallint not null check (level between 0 and 6),
  heading text not null default '',
  body text not null default '',
  position_index integer not null,
  has_placeholders boolean not null default false,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (source_file_version_id, position_index)
);
create index source_sections_version_idx on public.source_sections(source_file_version_id);

-- Which source files (and versions, and sections) a module is bound to
-- (For Slice 2.4: file-level bindings. Section-level granularity is captured by the section_id column,
-- nullable for whole-file bindings; Slice 7.3 uses section_id for precise staleness.)
create table public.module_source_bindings (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,                     -- TODO: FK to modules(id) once that table lands in Slice 8.2
  source_file_id uuid not null references public.source_files(id) on delete restrict,
  source_file_version_id uuid not null references public.source_file_versions(id) on delete restrict,
  source_section_id uuid references public.source_sections(id) on delete set null,
  binding_kind text not null default 'whole_file',  -- 'whole_file' | 'section'
  flagged_for_review boolean not null default false,
  flag_reason text,                            -- 'equal_authority_conflict' | 'stale' | null
  created_at timestamptz not null default now(),
  unique (module_id, source_file_id, source_section_id)
);
create index module_source_bindings_module_idx on public.module_source_bindings(module_id);
create index module_source_bindings_source_idx on public.module_source_bindings(source_file_id);

-- RLS: enable on all; admin-only for v1 (no learner reads to these tables)
alter table public.source_files enable row level security;
alter table public.source_file_versions enable row level security;
alter table public.source_sections enable row level security;
alter table public.module_source_bindings enable row level security;

-- For v1 (no profiles table yet), permit authenticated full access. RLS tightens to admin role
-- once profiles + role-checking land in a later slice.
create policy source_files_authenticated on public.source_files
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy source_file_versions_authenticated on public.source_file_versions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy source_sections_authenticated on public.source_sections
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy module_source_bindings_authenticated on public.module_source_bindings
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
