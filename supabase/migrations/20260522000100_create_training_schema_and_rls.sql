-- Redex Education training schema baseline
-- Creates training tables expected by app row/domain contracts
-- and applies RLS for authenticated content access and per-user progress writes.

create extension if not exists pgcrypto;

create table if not exists public.training_courses (
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

create table if not exists public.training_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_courses(id) on delete cascade,
  title text not null,
  order_index integer not null check (order_index >= 0),
  criticality text not null check (criticality in ('required', 'recommended', 'optional', 'bonus')),
  estimated_minutes integer not null default 0 check (estimated_minutes >= 0),
  unlock_rule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.training_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.training_modules(id) on delete cascade,
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

create table if not exists public.user_training_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'active', 'completed', 'dropped')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  progress_percentage numeric(5,2) not null default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_training_enrollments_user_course_uniq unique (user_id, course_id)
);

create table if not exists public.user_training_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.user_training_enrollments(id) on delete cascade,
  lesson_id uuid not null references public.training_lessons(id) on delete cascade,
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
  on public.training_modules (course_id, order_index);

create index if not exists training_lessons_module_order_idx
  on public.training_lessons (module_id, order_index);

create index if not exists user_training_enrollments_user_idx
  on public.user_training_enrollments (user_id);

create index if not exists user_training_enrollments_course_idx
  on public.user_training_enrollments (course_id);

create index if not exists user_training_progress_enrollment_idx
  on public.user_training_progress (enrollment_id);

create index if not exists user_training_progress_lesson_idx
  on public.user_training_progress (lesson_id);

create index if not exists user_training_progress_user_idx
  on public.user_training_progress (user_id);

-- RLS
alter table public.training_courses enable row level security;
alter table public.training_modules enable row level security;
alter table public.training_lessons enable row level security;
alter table public.user_training_enrollments enable row level security;
alter table public.user_training_progress enable row level security;

-- Published catalog read access for authenticated users
create policy training_courses_select_published_authenticated
  on public.training_courses
  for select
  to authenticated
  using (status = 'published');

create policy training_modules_select_published_authenticated
  on public.training_modules
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.training_courses c
      where c.id = training_modules.course_id
        and c.status = 'published'
    )
  );

create policy training_lessons_select_published_authenticated
  on public.training_lessons
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.training_modules m
      join public.training_courses c on c.id = m.course_id
      where m.id = training_lessons.module_id
        and c.status = 'published'
    )
  );

-- Enrollment ownership policies
create policy user_training_enrollments_select_own
  on public.user_training_enrollments
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy user_training_enrollments_insert_own
  on public.user_training_enrollments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy user_training_enrollments_update_own
  on public.user_training_enrollments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Progress ownership policies
create policy user_training_progress_select_own
  on public.user_training_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy user_training_progress_insert_own
  on public.user_training_progress
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.user_training_enrollments e
      where e.id = user_training_progress.enrollment_id
        and e.user_id = auth.uid()
    )
  );

create policy user_training_progress_update_own
  on public.user_training_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.user_training_enrollments e
      where e.id = user_training_progress.enrollment_id
        and e.user_id = auth.uid()
    )
  );
