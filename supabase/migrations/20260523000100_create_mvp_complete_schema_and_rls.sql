-- Slice 8.2 — Database Schema Migration Draft
-- Date: 2026-05-23
--
-- Adds the MVP learner/admin core tables and completes the Course Foundry / Drive
-- Source Library persistence surface that was not covered by the Slice 2.4 learner
-- schema baseline.
--
-- This migration intentionally DOES NOT recreate or modify the learner-side tables
-- created by 20260522000100_create_training_schema_and_rls.sql:
--   redex.training_courses
--   redex.training_modules
--   redex.training_lessons
--   redex.user_training_enrollments
--   redex.user_training_progress
--
-- It also does not apply to the remote Supabase project in this slice. Remote push
-- requires a separate reconciliation pass because the remote training_modules shape
-- is known to differ from the local migration history.

create extension if not exists pgcrypto;

-- Shared updated_at trigger helper.
create or replace function redex.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. profiles — unlocks role-aware admin RLS in a later hardening slice.
-- -----------------------------------------------------------------------------
create table if not exists redex.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  -- MISMATCH: roadmap draft omitted org_id, but src/types/training.ts User requires it.
  org_id uuid not null,
  email text unique not null,
  display_name text not null,
  role text not null check (role in ('admin', 'foundry_author', 'manager', 'learner')),
  department text,
  manager_id uuid references redex.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'profiles_set_updated_at'
  ) then
    create trigger profiles_set_updated_at
    before update on redex.profiles
    for each row
    execute function redex.set_updated_at();
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2–4 + 6. Source Library tables already landed in
-- 20260522220557_source_library_v1.sql. Slice 8.2 reuses that TS-aligned shape
-- instead of recreating colliding tables.
--
-- Existing canonical tables:
--   redex.source_files
--   redex.source_file_versions
--   redex.source_sections
--   redex.module_source_bindings
--
-- MISMATCH: the roadmap draft used source_files.name / authority_level values
-- ('authoritative','reference','draft'), but src/types/training.ts uses
-- source_files.title / authority values ('authoritative','supporting','context'),
-- already implemented by source_library_v1.
--
-- MISMATCH: the roadmap draft used source_sections.section_id/order_index, but
-- current TS/source_library_v1 use slug/position_index.
-- -----------------------------------------------------------------------------
comment on table redex.source_files is
  'Slice 8.2 reuses the Slice 8.1/source_library_v1 source_files shape aligned to SourceFile in src/types/training.ts.';

comment on table redex.source_file_versions is
  'Slice 8.2 reuses the source_library_v1 source_file_versions shape aligned to SourceFileVersion in src/types/training.ts.';

comment on table redex.source_sections is
  'Slice 8.2 reuses the source_library_v1 source_sections shape aligned to SourceSection in src/types/training.ts.';

-- Add CHECK constraints for TypeScript unions that source_library_v1 documented in
-- comments/defaults but did not constrain.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'source_files_authority_source_chk'
  ) then
    alter table redex.source_files
      add constraint source_files_authority_source_chk
      check (authority_source in ('frontmatter', 'meta_md', 'default'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'module_source_bindings_binding_kind_chk'
  ) then
    alter table redex.module_source_bindings
      add constraint module_source_bindings_binding_kind_chk
      check (binding_kind in ('whole_file', 'section'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'module_source_bindings_flag_reason_chk'
  ) then
    alter table redex.module_source_bindings
      add constraint module_source_bindings_flag_reason_chk
      check (flag_reason is null or flag_reason in ('equal_authority_conflict', 'stale'));
  end if;
end;
$$;

-- Roadmap-compatible additions on existing source tables. These are additive only;
-- source_library_v1 remains the canonical base shape.
alter table redex.source_file_versions
  add column if not exists is_current boolean not null default false;

update redex.source_file_versions v
set is_current = true
from redex.source_files f
where f.current_version_id = v.id;

create unique index if not exists source_file_versions_one_current_per_source_idx
  on redex.source_file_versions (source_file_id)
  where is_current;

-- MISMATCH: source_library_v1 models module_source_bindings by module_id +
-- source_file_version_id. Slice 8.2 adds nullable module_version_id/bound_revision_id/
-- lesson_ids for the requested Course Foundry impact-review shape without removing
-- the existing TS-aligned columns.
alter table redex.module_source_bindings
  add column if not exists module_version_id uuid,
  add column if not exists bound_revision_id text,
  add column if not exists lesson_ids text[];

-- -----------------------------------------------------------------------------
-- SourceBinder support for src/types/training.ts SourceBinder.
-- -----------------------------------------------------------------------------
create table if not exists redex.source_binders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  title text not null,
  version_number integer not null check (version_number > 0),
  created_by uuid references redex.profiles(id),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 5. module_versions
-- -----------------------------------------------------------------------------
create table if not exists redex.module_versions (
  id uuid primary key default gen_random_uuid(),
  -- FK intentionally omitted for now. The local baseline has redex.training_modules,
  -- but remote training_modules has a known shape collision. Phase 8.3/8.4 should
  -- add the FK after remote/local reconciliation.
  module_id uuid not null,
  -- MISMATCH: roadmap draft omitted module_title; src/types/training.ts ModuleVersion requires it.
  module_title text not null,
  version_number integer not null check (version_number > 0),
  -- MISMATCH: roadmap draft listed only draft/published/archived; canonical ModuleVersion includes in_review and approved.
  status text not null check (status in ('draft', 'in_review', 'approved', 'published', 'archived')) default 'draft',
  approval_state text check (
    approval_state in (
      'draft',
      'source_added',
      'questions_complete',
      'outline_approved',
      'generated',
      'self_critiqued',
      'needs_review',
      'blocked',
      'approved',
      'published',
      'archived'
    )
  ) default 'draft',
  published_at timestamptz,
  published_by uuid references redex.profiles(id),
  approved_by uuid references redex.profiles(id),
  -- MISMATCH: roadmap draft used TEXT; canonical ModuleVersion uses UUID aliases.
  source_binder_version uuid references redex.source_binders(id),
  assessment_version uuid,
  source_stale boolean not null default false,
  stale_since timestamptz,
  completed_count integer check (completed_count is null or completed_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint module_versions_module_version_number_uniq unique (module_id, version_number)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'module_source_bindings_module_version_fk'
  ) then
    alter table redex.module_source_bindings
      add constraint module_source_bindings_module_version_fk
      foreign key (module_version_id) references redex.module_versions(id) on delete cascade;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'module_versions_set_updated_at'
  ) then
    create trigger module_versions_set_updated_at
    before update on redex.module_versions
    for each row
    execute function redex.set_updated_at();
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. source_change_events
-- -----------------------------------------------------------------------------
create table if not exists redex.source_change_events (
  id uuid primary key default gen_random_uuid(),
  -- MISMATCH: roadmap draft requested UUID FK, but SourceChangeEvent and current
  -- Drive sync code use stable string source IDs (usually source_files.drive_file_id).
  -- Keep the event contract string-shaped and resolve to source_files.id in adapters
  -- when a DB UUID relationship is needed.
  source_file_id text not null,
  source_file_name text not null,
  section_ids_changed text[] not null,
  old_revision_id text not null,
  new_revision_id text not null,
  detected_at timestamptz not null default now(),
  status text not null check (status in ('unreviewed', 'reviewed', 'resolved')) default 'unreviewed',
  constraint source_change_events_revision_uniq unique (source_file_id, old_revision_id, new_revision_id)
);

-- -----------------------------------------------------------------------------
-- 8. assessments
-- -----------------------------------------------------------------------------
create table if not exists redex.assessments (
  id uuid primary key default gen_random_uuid(),
  -- MISMATCH: canonical Assessment is lesson-scoped; roadmap draft is module-version-scoped.
  -- Keep both anchors so the schema can satisfy current learner quiz reads and Foundry versioning.
  lesson_id uuid not null references redex.training_lessons(id) on delete cascade,
  module_version_id uuid references redex.module_versions(id) on delete cascade,
  title text not null,
  passing_threshold integer not null check (passing_threshold between 0 and 100),
  question_count integer not null default 0 check (question_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'assessments_set_updated_at'
  ) then
    create trigger assessments_set_updated_at
    before update on redex.assessments
    for each row
    execute function redex.set_updated_at();
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- 9. assessment_questions
-- -----------------------------------------------------------------------------
create table if not exists redex.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references redex.assessments(id) on delete cascade,
  prompt text not null,
  options jsonb not null,
  correct_index integer not null check (correct_index >= 0),
  explanation text,
  order_index integer not null check (order_index >= 0),
  constraint assessment_questions_options_array_chk check (jsonb_typeof(options) = 'array')
);

-- -----------------------------------------------------------------------------
-- 10. assignments
-- -----------------------------------------------------------------------------
create table if not exists redex.assignments (
  id uuid primary key default gen_random_uuid(),
  module_version_id uuid not null references redex.module_versions(id),
  assignee_user_id uuid references redex.profiles(id),
  assignee_role text check (assignee_role in ('admin', 'foundry_author', 'manager', 'learner')),
  assigned_by uuid not null references redex.profiles(id),
  assigned_at timestamptz not null default now(),
  due_at timestamptz,
  status text not null check (status in ('pending', 'in_progress', 'completed', 'overdue')) default 'pending',
  constraint assignments_exactly_one_assignee_chk check (
    (assignee_user_id is not null and assignee_role is null)
    or (assignee_user_id is null and assignee_role is not null)
  )
);

-- -----------------------------------------------------------------------------
-- 11. assessment_attempts
-- -----------------------------------------------------------------------------
create table if not exists redex.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  -- MISMATCH: roadmap draft said enrollments(id); existing Slice 2.4 table is user_training_enrollments.
  enrollment_id uuid not null references redex.user_training_enrollments(id) on delete cascade,
  lesson_id uuid not null references redex.training_lessons(id) on delete cascade,
  attempted_at timestamptz not null default now(),
  score_percent integer not null check (score_percent between 0 and 100),
  passed boolean not null,
  answers jsonb not null,
  constraint assessment_attempts_answers_object_chk check (jsonb_typeof(answers) = 'object')
);

-- -----------------------------------------------------------------------------
-- 12. acknowledgments
-- -----------------------------------------------------------------------------
create table if not exists redex.acknowledgments (
  id uuid primary key default gen_random_uuid(),
  -- MISMATCH: roadmap draft said enrollments(id); existing Slice 2.4 table is user_training_enrollments.
  enrollment_id uuid not null references redex.user_training_enrollments(id) on delete cascade,
  lesson_id uuid not null references redex.training_lessons(id) on delete cascade,
  acknowledged_at timestamptz not null default now(),
  statement_text text not null,
  constraint acknowledgments_enrollment_lesson_uniq unique (enrollment_id, lesson_id)
);

-- -----------------------------------------------------------------------------
-- 13. audit_logs
-- -----------------------------------------------------------------------------
create table if not exists redex.audit_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (
    event_type in (
      'module_created',
      'source_uploaded',
      'outline_generated',
      'outline_approved',
      'module_generated',
      'self_critique_completed',
      'lesson_approved',
      'module_published',
      'module_version_forked',
      'assignment_created',
      'employee_completed_module',
      'quiz_attempted',
      'source_change_detected',
      'stale_lesson_regenerated'
    )
  ),
  -- MISMATCH: src/types/training.ts AuditLog.actor_user_id is UUID, but the slice
  -- requires TEXT so the audit stream can represent the 'system' sentinel.
  actor_user_id text not null,
  actor_name text not null,
  entity_type text not null check (entity_type in ('module', 'module_version', 'source_file', 'assignment', 'lesson', 'quiz')),
  entity_id text not null,
  entity_label text not null,
  occurred_at timestamptz not null default now(),
  metadata jsonb,
  constraint audit_logs_metadata_object_chk check (metadata is null or jsonb_typeof(metadata) = 'object')
);

-- -----------------------------------------------------------------------------
-- 14. generated_content_reviews
-- -----------------------------------------------------------------------------
create table if not exists redex.generated_content_reviews (
  id uuid primary key default gen_random_uuid(),
  module_version_id uuid not null references redex.module_versions(id) on delete cascade,
  lesson_id uuid references redex.training_lessons(id),
  -- MISMATCH: roadmap draft omitted review_type/reviewer_id/created_at; canonical GeneratedContentReview requires them.
  reviewer_id uuid references redex.profiles(id),
  review_type text not null check (review_type in ('outline', 'lesson', 'assessment', 'side_by_side')),
  status text not null check (status in ('pending', 'approved', 'rejected')) default 'pending',
  confidence text check (confidence in ('supported', 'partial', 'unsupported')),
  has_unsupported_claim boolean not null default false,
  has_placeholders boolean not null default false,
  -- MISMATCH: roadmap draft allowed needs_review; canonical GeneratedContentReview.status does not.
  reviewer_user_id uuid references redex.profiles(id),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
create index if not exists idx_profiles_role
  on redex.profiles (role);

create index if not exists idx_profiles_manager_id
  on redex.profiles (manager_id);

create index if not exists idx_source_files_drive_file_id
  on redex.source_files (drive_file_id);

create index if not exists idx_source_file_versions_source_file_id_current
  on redex.source_file_versions (source_file_id, is_current);

create index if not exists idx_module_versions_module_id_status
  on redex.module_versions (module_id, status);

create index if not exists idx_module_source_bindings_module_version_id
  on redex.module_source_bindings (module_version_id);

create index if not exists idx_source_change_events_status_detected_at
  on redex.source_change_events (status, detected_at desc);

create index if not exists idx_assignments_assignee_user_id_status
  on redex.assignments (assignee_user_id, status);

create index if not exists idx_assessment_attempts_lesson_id_attempted_at
  on redex.assessment_attempts (lesson_id, attempted_at desc);

create index if not exists idx_audit_logs_occurred_at
  on redex.audit_logs (occurred_at desc);

create index if not exists idx_audit_logs_event_type_occurred_at
  on redex.audit_logs (event_type, occurred_at desc);

create index if not exists idx_source_binders_org_id_version_number
  on redex.source_binders (org_id, version_number);

create index if not exists idx_assessments_lesson_id
  on redex.assessments (lesson_id);

create index if not exists idx_assessment_questions_assessment_id_order_index
  on redex.assessment_questions (assessment_id, order_index);

create index if not exists idx_acknowledgments_enrollment_id
  on redex.acknowledgments (enrollment_id);

create index if not exists idx_generated_content_reviews_module_version_id
  on redex.generated_content_reviews (module_version_id);

-- -----------------------------------------------------------------------------
-- RLS
--
-- PERMISSIVE RLS WARNING: Demo-phase policies. Tighten before any production
-- rollout. Role-gated policies require the profiles table to be populated and
-- queryable via a SECURITY DEFINER function (Slice 8.x).
-- -----------------------------------------------------------------------------
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles',
    'source_files',
    'source_file_versions',
    'source_sections',
    'module_source_bindings',
    'source_binders',
    'module_versions',
    'source_change_events',
    'assessments',
    'assessment_questions',
    'assignments',
    'assessment_attempts',
    'acknowledgments',
    'generated_content_reviews'
  ] loop
    execute format('alter table redex.%I enable row level security', table_name);

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = table_name || '_authenticated_read'
    ) then
      execute format(
        'create policy %I on redex.%I for select to authenticated using (true)',
        table_name || '_authenticated_read',
        table_name
      );
    end if;

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = table_name || '_authenticated_write'
    ) then
      execute format(
        'create policy %I on redex.%I for all to authenticated using (true) with check (true)',
        table_name || '_authenticated_write',
        table_name
      );
    end if;
  end loop;
end;
$$;

alter table redex.audit_logs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_logs'
      and policyname = 'audit_logs_authenticated_read'
  ) then
    execute 'create policy audit_logs_authenticated_read on redex.audit_logs for select to authenticated using (true)';
  end if;
end;
$$;
