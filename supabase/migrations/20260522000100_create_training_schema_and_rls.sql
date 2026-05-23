-- Redex Education training schema baseline.
-- Creates training tables expected by app row/domain contracts
-- and applies RLS for authenticated content access and per-user progress writes.
--
-- All Redex Education tables live in the `redex` schema (created by the
-- 20260521000000 reconciliation migration). See ADR 017 for rationale.

create extension if not exists pgcrypto;

create table if not exists redex.training_courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid,
  title text not null,
  slug text not null unique,
  description text,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'published', 'archived')),
  level text not null default 'foundational',
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  learning_objectives jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_courses_learning_objectives_array_chk check (jsonb_typeof(learning_objectives) = 'array')
);

create table if not exists redex.training_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references redex.training_courses(id) on delete cascade,
  title text not null,
  order_index integer not null check (order_index >= 0),
  criticality text not null check (criticality in ('required', 'recommended', 'optional', 'bonus')),
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  unlock_rule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists redex.training_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references redex.training_modules(id) on delete cascade,
  title text not null,
  lesson_type text not null check (lesson_type in ('text', 'checklist', 'acknowledgment', 'quiz', 'scenario', 'video', 'coach', 'assignment', 'reflection_prompt')),
  criticality text not null check (criticality in ('required', 'recommended', 'optional', 'bonus')),
  order_index integer not null check (order_index >= 0),
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  content jsonb not null,
  resources jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_lessons_content_object_chk check (jsonb_typeof(content) = 'object')
);

create table if not exists redex.user_training_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references redex.training_courses(id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'active', 'completed', 'dropped')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  progress_percentage numeric(5,2) not null default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_training_enrollments_user_course_uniq unique (user_id, course_id)
);

create table if not exists redex.user_training_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references redex.user_training_enrollments(id) on delete cascade,
  lesson_id uuid not null references redex.training_lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed', 'skipped', 'failed')),
  time_spent_seconds integer not null default 0 check (time_spent_seconds >= 0),
  completed_at timestamptz,
  acknowledgment_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_training_progress_enrollment_lesson_uniq unique (enrollment_id, lesson_id)
);

-- FK/order/user lookup indexes
create index if not exists training_modules_course_order_idx
  on redex.training_modules (course_id, order_index);

create index if not exists training_lessons_module_order_idx
  on redex.training_lessons (module_id, order_index);

create index if not exists user_training_enrollments_user_idx
  on redex.user_training_enrollments (user_id);

create index if not exists user_training_enrollments_course_idx
  on redex.user_training_enrollments (course_id);

create index if not exists user_training_progress_enrollment_idx
  on redex.user_training_progress (enrollment_id);

create index if not exists user_training_progress_lesson_idx
  on redex.user_training_progress (lesson_id);

create index if not exists user_training_progress_user_idx
  on redex.user_training_progress (user_id);

-- RLS
alter table redex.training_courses enable row level security;
alter table redex.training_modules enable row level security;
alter table redex.training_lessons enable row level security;
alter table redex.user_training_enrollments enable row level security;
alter table redex.user_training_progress enable row level security;

-- Published catalog read access for authenticated users (drop-then-create
-- for idempotent replay; pre-PG17 CREATE POLICY does not support IF NOT EXISTS).
drop policy if exists training_courses_select_published_authenticated on redex.training_courses;
create policy training_courses_select_published_authenticated
  on redex.training_courses
  for select
  to authenticated
  using (status = 'published');

drop policy if exists training_modules_select_published_authenticated on redex.training_modules;
create policy training_modules_select_published_authenticated
  on redex.training_modules
  for select
  to authenticated
  using (
    exists (
      select 1
      from redex.training_courses c
      where c.id = training_modules.course_id
        and c.status = 'published'
    )
  );

drop policy if exists training_lessons_select_published_authenticated on redex.training_lessons;
create policy training_lessons_select_published_authenticated
  on redex.training_lessons
  for select
  to authenticated
  using (
    exists (
      select 1
      from redex.training_modules m
      join redex.training_courses c on c.id = m.course_id
      where m.id = training_lessons.module_id
        and c.status = 'published'
    )
  );

-- Enrollment ownership policies
drop policy if exists user_training_enrollments_select_own on redex.user_training_enrollments;
create policy user_training_enrollments_select_own
  on redex.user_training_enrollments
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists user_training_enrollments_insert_own on redex.user_training_enrollments;
create policy user_training_enrollments_insert_own
  on redex.user_training_enrollments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists user_training_enrollments_update_own on redex.user_training_enrollments;
create policy user_training_enrollments_update_own
  on redex.user_training_enrollments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Progress ownership policies
drop policy if exists user_training_progress_select_own on redex.user_training_progress;
create policy user_training_progress_select_own
  on redex.user_training_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists user_training_progress_insert_own on redex.user_training_progress;
create policy user_training_progress_insert_own
  on redex.user_training_progress
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from redex.user_training_enrollments e
      where e.id = user_training_progress.enrollment_id
        and e.user_id = auth.uid()
    )
  );

drop policy if exists user_training_progress_update_own on redex.user_training_progress;
create policy user_training_progress_update_own
  on redex.user_training_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from redex.user_training_enrollments e
      where e.id = user_training_progress.enrollment_id
        and e.user_id = auth.uid()
    )
  );
