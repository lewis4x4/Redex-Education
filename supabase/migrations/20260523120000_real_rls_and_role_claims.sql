-- Slice 8.6 — Profiles, Roles & Real RLS
--
-- Replaces placeholder authenticated-wide policies with role-aware RLS for the
-- redex schema. The Redex org id below is a deterministic bootstrap org used by
-- the auth.users trigger until a future org-management slice adds real tenants.
-- Admin bootstrap after first sign-in:
--   update redex.profiles set role = 'admin' where email = '<admin email>';

create extension if not exists pgcrypto;

grant usage on schema redex to authenticated;
grant select, insert, update, delete on all tables in schema redex to authenticated;

-- -----------------------------------------------------------------------------
-- Drop placeholder / permissive policies from earlier slices.
-- -----------------------------------------------------------------------------
drop policy if exists source_files_authenticated on redex.source_files;
drop policy if exists source_file_versions_authenticated on redex.source_file_versions;
drop policy if exists source_sections_authenticated on redex.source_sections;
drop policy if exists module_source_bindings_authenticated on redex.module_source_bindings;

drop policy if exists training_courses_select_published_authenticated on redex.training_courses;
drop policy if exists training_modules_select_published_authenticated on redex.training_modules;
drop policy if exists training_lessons_select_published_authenticated on redex.training_lessons;
drop policy if exists user_training_enrollments_select_own on redex.user_training_enrollments;
drop policy if exists user_training_enrollments_insert_own on redex.user_training_enrollments;
drop policy if exists user_training_enrollments_update_own on redex.user_training_enrollments;
drop policy if exists user_training_progress_select_own on redex.user_training_progress;
drop policy if exists user_training_progress_insert_own on redex.user_training_progress;
drop policy if exists user_training_progress_update_own on redex.user_training_progress;

drop policy if exists profiles_authenticated_read on redex.profiles;
drop policy if exists profiles_authenticated_write on redex.profiles;
drop policy if exists source_files_authenticated_read on redex.source_files;
drop policy if exists source_files_authenticated_write on redex.source_files;
drop policy if exists source_file_versions_authenticated_read on redex.source_file_versions;
drop policy if exists source_file_versions_authenticated_write on redex.source_file_versions;
drop policy if exists source_sections_authenticated_read on redex.source_sections;
drop policy if exists source_sections_authenticated_write on redex.source_sections;
drop policy if exists module_source_bindings_authenticated_read on redex.module_source_bindings;
drop policy if exists module_source_bindings_authenticated_write on redex.module_source_bindings;
drop policy if exists source_binders_authenticated_read on redex.source_binders;
drop policy if exists source_binders_authenticated_write on redex.source_binders;
drop policy if exists module_versions_authenticated_read on redex.module_versions;
drop policy if exists module_versions_authenticated_write on redex.module_versions;
drop policy if exists source_change_events_authenticated_read on redex.source_change_events;
drop policy if exists source_change_events_authenticated_write on redex.source_change_events;
drop policy if exists assessments_authenticated_read on redex.assessments;
drop policy if exists assessments_authenticated_write on redex.assessments;
drop policy if exists assessment_questions_authenticated_read on redex.assessment_questions;
drop policy if exists assessment_questions_authenticated_write on redex.assessment_questions;
drop policy if exists assignments_authenticated_read on redex.assignments;
drop policy if exists assignments_authenticated_write on redex.assignments;
drop policy if exists assessment_attempts_authenticated_read on redex.assessment_attempts;
drop policy if exists assessment_attempts_authenticated_write on redex.assessment_attempts;
drop policy if exists acknowledgments_authenticated_read on redex.acknowledgments;
drop policy if exists acknowledgments_authenticated_write on redex.acknowledgments;
drop policy if exists audit_logs_authenticated_read on redex.audit_logs;
drop policy if exists audit_logs_authenticated_write on redex.audit_logs;
drop policy if exists generated_content_reviews_authenticated_read on redex.generated_content_reviews;
drop policy if exists generated_content_reviews_authenticated_write on redex.generated_content_reviews;

-- -----------------------------------------------------------------------------
-- Role helpers. SECURITY DEFINER keeps RLS policy checks from recursing on
-- profiles while still exposing only boolean/text answers to authenticated users.
-- -----------------------------------------------------------------------------
create or replace function redex.current_role()
returns text
language sql
stable
security definer
set search_path = redex, public, pg_catalog
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'redex_role', ''),
    (select p.role from redex.profiles p where p.id = auth.uid()),
    'learner'
  );
$$;

create or replace function redex.is_admin()
returns boolean
language sql
stable
security definer
set search_path = redex, public, pg_catalog
as $$
  select redex.current_role() = 'admin';
$$;

create or replace function redex.is_foundry_author()
returns boolean
language sql
stable
security definer
set search_path = redex, public, pg_catalog
as $$
  select redex.current_role() in ('admin', 'foundry_author');
$$;

create or replace function redex.is_manager()
returns boolean
language sql
stable
security definer
set search_path = redex, public, pg_catalog
as $$
  select redex.current_role() = 'manager' or redex.is_admin();
$$;

create or replace function redex.is_manager_of(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = redex, public, pg_catalog
as $$
  with recursive managed_profiles(id) as (
    select p.id
    from redex.profiles p
    where p.manager_id = auth.uid()

    union all

    select child.id
    from redex.profiles child
    join managed_profiles parent on parent.id = child.manager_id
  )
  select redex.is_admin()
    or (
      redex.current_role() = 'manager'
      and exists (select 1 from managed_profiles m where m.id = target_user_id)
    );
$$;

create or replace function redex.is_learner()
returns boolean
language sql
stable
security definer
set search_path = redex, public, pg_catalog
as $$
  select redex.current_role() = 'learner';
$$;

create or replace function redex.enrollment_user_id(target_enrollment_id uuid)
returns uuid
language sql
stable
security definer
set search_path = redex, public, pg_catalog
as $$
  select e.user_id
  from redex.user_training_enrollments e
  where e.id = target_enrollment_id;
$$;

grant execute on function redex.current_role() to authenticated;
grant execute on function redex.is_admin() to authenticated;
grant execute on function redex.is_foundry_author() to authenticated;
grant execute on function redex.is_manager() to authenticated;
grant execute on function redex.is_manager_of(uuid) to authenticated;
grant execute on function redex.is_learner() to authenticated;
grant execute on function redex.enrollment_user_id(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Profile provisioning and self-update hardening.
-- -----------------------------------------------------------------------------
create or replace function redex.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = redex, public, pg_catalog
as $$
declare
  redex_org_id constant uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  profile_email text := coalesce(new.email, new.id::text || '@unknown.redex.local');
begin
  insert into redex.profiles (id, org_id, email, display_name, role)
  values (
    new.id,
    redex_org_id,
    profile_email,
    coalesce(nullif(split_part(profile_email, '@', 1), ''), 'Redex learner'),
    'learner'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function redex.handle_new_user();

create or replace function redex.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = redex, public, pg_catalog
as $$
begin
  -- Direct SQL/admin jobs and the service role may repair/bootstrap profiles.
  -- Authenticated client self-updates may not change security-sensitive columns.
  if auth.uid() is null then
    return new;
  end if;

  if redex.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role
    or new.org_id is distinct from old.org_id
    or new.manager_id is distinct from old.manager_id
  then
    raise exception 'Only admins can update profile role, org_id, or manager_id';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_privilege_escalation on redex.profiles;
create trigger profiles_prevent_privilege_escalation
  before update on redex.profiles
  for each row execute function redex.prevent_profile_privilege_escalation();

create or replace function redex.prevent_assignment_non_foundry_update()
returns trigger
language plpgsql
security definer
set search_path = redex, public, pg_catalog
as $$
begin
  -- Service role / direct SQL and Foundry authors own full assignment mutation.
  if auth.uid() is null or redex.is_foundry_author() then
    return new;
  end if;

  -- Learners may only advance their own assignment status from the app.
  if old.assignee_user_id = auth.uid() then
    if new.module_version_id is distinct from old.module_version_id
      or new.assignee_user_id is distinct from old.assignee_user_id
      or new.assignee_role is distinct from old.assignee_role
      or new.assigned_by is distinct from old.assigned_by
      or new.assigned_at is distinct from old.assigned_at
      or new.due_at is distinct from old.due_at
    then
      raise exception 'Only Foundry authors can update assignment details';
    end if;

    return new;
  end if;

  raise exception 'Only Foundry authors or the assigned learner can update assignments';
end;
$$;

drop trigger if exists assignments_prevent_non_foundry_update on redex.assignments;
create trigger assignments_prevent_non_foundry_update
  before update on redex.assignments
  for each row execute function redex.prevent_assignment_non_foundry_update();

-- -----------------------------------------------------------------------------
-- Ensure RLS is enabled on every Redex table governed by this slice.
-- -----------------------------------------------------------------------------
alter table redex.profiles enable row level security;
alter table redex.training_courses enable row level security;
alter table redex.training_modules enable row level security;
alter table redex.training_lessons enable row level security;
alter table redex.user_training_enrollments enable row level security;
alter table redex.user_training_progress enable row level security;
alter table redex.source_files enable row level security;
alter table redex.source_file_versions enable row level security;
alter table redex.source_sections enable row level security;
alter table redex.module_source_bindings enable row level security;
alter table redex.source_binders enable row level security;
alter table redex.module_versions enable row level security;
alter table redex.source_change_events enable row level security;
alter table redex.assessments enable row level security;
alter table redex.assessment_questions enable row level security;
alter table redex.assignments enable row level security;
alter table redex.assessment_attempts enable row level security;
alter table redex.acknowledgments enable row level security;
alter table redex.audit_logs enable row level security;
alter table redex.generated_content_reviews enable row level security;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy profiles_select_visible
  on redex.profiles
  for select
  to authenticated
  using (id = auth.uid() or redex.is_manager_of(id) or redex.is_foundry_author());

create policy profiles_update_self
  on redex.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_update_admin
  on redex.profiles
  for update
  to authenticated
  using (redex.is_admin())
  with check (redex.is_admin());

create policy profiles_delete_admin
  on redex.profiles
  for delete
  to authenticated
  using (redex.is_admin());

-- -----------------------------------------------------------------------------
-- Published learner catalog + Foundry authoring.
-- -----------------------------------------------------------------------------
create policy training_courses_select_published_or_foundry
  on redex.training_courses
  for select
  to authenticated
  using (status = 'published' or redex.is_foundry_author());

create policy training_courses_insert_foundry
  on redex.training_courses
  for insert
  to authenticated
  with check (redex.is_foundry_author());

create policy training_courses_update_foundry
  on redex.training_courses
  for update
  to authenticated
  using (redex.is_foundry_author())
  with check (redex.is_foundry_author());

create policy training_courses_delete_foundry
  on redex.training_courses
  for delete
  to authenticated
  using (redex.is_foundry_author());

create policy training_modules_select_published_or_foundry
  on redex.training_modules
  for select
  to authenticated
  using (
    redex.is_foundry_author()
    or exists (
      select 1 from redex.training_courses c
      where c.id = training_modules.course_id
        and c.status = 'published'
    )
  );

create policy training_modules_insert_foundry
  on redex.training_modules
  for insert
  to authenticated
  with check (redex.is_foundry_author());

create policy training_modules_update_foundry
  on redex.training_modules
  for update
  to authenticated
  using (redex.is_foundry_author())
  with check (redex.is_foundry_author());

create policy training_modules_delete_foundry
  on redex.training_modules
  for delete
  to authenticated
  using (redex.is_foundry_author());

create policy training_lessons_select_published_or_foundry
  on redex.training_lessons
  for select
  to authenticated
  using (
    redex.is_foundry_author()
    or exists (
      select 1
      from redex.training_modules m
      join redex.training_courses c on c.id = m.course_id
      where m.id = training_lessons.module_id
        and c.status = 'published'
    )
  );

create policy training_lessons_insert_foundry
  on redex.training_lessons
  for insert
  to authenticated
  with check (redex.is_foundry_author());

create policy training_lessons_update_foundry
  on redex.training_lessons
  for update
  to authenticated
  using (redex.is_foundry_author())
  with check (redex.is_foundry_author());

create policy training_lessons_delete_foundry
  on redex.training_lessons
  for delete
  to authenticated
  using (redex.is_foundry_author());

-- -----------------------------------------------------------------------------
-- Learner-owned enrollments and progress.
-- -----------------------------------------------------------------------------
create policy user_training_enrollments_select_visible
  on redex.user_training_enrollments
  for select
  to authenticated
  using (user_id = auth.uid() or redex.is_manager_of(user_id) or redex.is_admin());

create policy user_training_enrollments_insert_self_or_admin
  on redex.user_training_enrollments
  for insert
  to authenticated
  with check (user_id = auth.uid() or redex.is_admin());

create policy user_training_enrollments_update_self_or_admin
  on redex.user_training_enrollments
  for update
  to authenticated
  using (user_id = auth.uid() or redex.is_admin())
  with check (user_id = auth.uid() or redex.is_admin());

create policy user_training_progress_select_visible
  on redex.user_training_progress
  for select
  to authenticated
  using (user_id = auth.uid() or redex.is_manager_of(user_id) or redex.is_admin());

create policy user_training_progress_insert_self
  on redex.user_training_progress
  for insert
  to authenticated
  with check (user_id = auth.uid() and redex.enrollment_user_id(enrollment_id) = auth.uid());

create policy user_training_progress_update_self
  on redex.user_training_progress
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and redex.enrollment_user_id(enrollment_id) = auth.uid());

-- -----------------------------------------------------------------------------
-- Assignments.
-- -----------------------------------------------------------------------------
create policy assignments_select_visible
  on redex.assignments
  for select
  to authenticated
  using (
    redex.is_foundry_author()
    or assignee_user_id = auth.uid()
    or assignee_role = redex.current_role()
    or redex.is_manager_of(assignee_user_id)
    or redex.is_admin()
  );

create policy assignments_insert_foundry
  on redex.assignments
  for insert
  to authenticated
  with check (redex.is_foundry_author());

create policy assignments_update_foundry
  on redex.assignments
  for update
  to authenticated
  using (redex.is_foundry_author())
  with check (redex.is_foundry_author());

create policy assignments_update_own_status
  on redex.assignments
  for update
  to authenticated
  using (assignee_user_id = auth.uid())
  with check (assignee_user_id = auth.uid());

create policy assignments_delete_foundry
  on redex.assignments
  for delete
  to authenticated
  using (redex.is_foundry_author());

-- -----------------------------------------------------------------------------
-- Assessment attempts and acknowledgments are learner-owned through enrollment.
-- -----------------------------------------------------------------------------
create policy assessment_attempts_select_visible
  on redex.assessment_attempts
  for select
  to authenticated
  using (
    redex.enrollment_user_id(enrollment_id) = auth.uid()
    or redex.is_manager_of(redex.enrollment_user_id(enrollment_id))
    or redex.is_admin()
  );

create policy assessment_attempts_insert_self
  on redex.assessment_attempts
  for insert
  to authenticated
  with check (redex.enrollment_user_id(enrollment_id) = auth.uid());

create policy acknowledgments_select_visible
  on redex.acknowledgments
  for select
  to authenticated
  using (redex.enrollment_user_id(enrollment_id) = auth.uid() or redex.is_admin());

create policy acknowledgments_insert_self
  on redex.acknowledgments
  for insert
  to authenticated
  with check (redex.enrollment_user_id(enrollment_id) = auth.uid());

-- -----------------------------------------------------------------------------
-- Privileged audit/event streams.
-- -----------------------------------------------------------------------------
create policy audit_logs_select_admin
  on redex.audit_logs
  for select
  to authenticated
  using (redex.is_admin());

create policy source_change_events_select_foundry
  on redex.source_change_events
  for select
  to authenticated
  using (redex.is_foundry_author());

-- -----------------------------------------------------------------------------
-- Foundry content tables. Published module versions and their assessment content
-- are learner-visible; draft/review internals require Foundry role.
-- -----------------------------------------------------------------------------
create policy source_binders_select_foundry
  on redex.source_binders
  for select
  to authenticated
  using (redex.is_foundry_author());

create policy source_binders_insert_foundry
  on redex.source_binders
  for insert
  to authenticated
  with check (redex.is_foundry_author());

create policy source_binders_update_foundry
  on redex.source_binders
  for update
  to authenticated
  using (redex.is_foundry_author())
  with check (redex.is_foundry_author());

create policy source_binders_delete_foundry
  on redex.source_binders
  for delete
  to authenticated
  using (redex.is_foundry_author());

create policy module_versions_select_published_or_foundry
  on redex.module_versions
  for select
  to authenticated
  using (status = 'published' or redex.is_foundry_author());

create policy module_versions_insert_foundry
  on redex.module_versions
  for insert
  to authenticated
  with check (redex.is_foundry_author());

create policy module_versions_update_foundry
  on redex.module_versions
  for update
  to authenticated
  using (redex.is_foundry_author())
  with check (redex.is_foundry_author());

create policy module_versions_delete_foundry
  on redex.module_versions
  for delete
  to authenticated
  using (redex.is_foundry_author());

create policy assessments_select_published_or_foundry
  on redex.assessments
  for select
  to authenticated
  using (
    redex.is_foundry_author()
    or exists (
      select 1 from redex.module_versions mv
      where mv.id = assessments.module_version_id
        and mv.status = 'published'
    )
    or exists (
      select 1
      from redex.training_lessons l
      join redex.training_modules m on m.id = l.module_id
      join redex.training_courses c on c.id = m.course_id
      where l.id = assessments.lesson_id
        and c.status = 'published'
    )
  );

create policy assessments_insert_foundry
  on redex.assessments
  for insert
  to authenticated
  with check (redex.is_foundry_author());

create policy assessments_update_foundry
  on redex.assessments
  for update
  to authenticated
  using (redex.is_foundry_author())
  with check (redex.is_foundry_author());

create policy assessments_delete_foundry
  on redex.assessments
  for delete
  to authenticated
  using (redex.is_foundry_author());

create policy assessment_questions_select_published_or_foundry
  on redex.assessment_questions
  for select
  to authenticated
  using (
    redex.is_foundry_author()
    or exists (
      select 1
      from redex.assessments a
      left join redex.module_versions mv on mv.id = a.module_version_id
      join redex.training_lessons l on l.id = a.lesson_id
      join redex.training_modules m on m.id = l.module_id
      join redex.training_courses c on c.id = m.course_id
      where a.id = assessment_questions.assessment_id
        and (mv.status = 'published' or c.status = 'published')
    )
  );

create policy assessment_questions_insert_foundry
  on redex.assessment_questions
  for insert
  to authenticated
  with check (redex.is_foundry_author());

create policy assessment_questions_update_foundry
  on redex.assessment_questions
  for update
  to authenticated
  using (redex.is_foundry_author())
  with check (redex.is_foundry_author());

create policy assessment_questions_delete_foundry
  on redex.assessment_questions
  for delete
  to authenticated
  using (redex.is_foundry_author());

create policy generated_content_reviews_select_foundry
  on redex.generated_content_reviews
  for select
  to authenticated
  using (redex.is_foundry_author());

create policy generated_content_reviews_insert_foundry
  on redex.generated_content_reviews
  for insert
  to authenticated
  with check (redex.is_foundry_author());

create policy generated_content_reviews_update_foundry
  on redex.generated_content_reviews
  for update
  to authenticated
  using (redex.is_foundry_author())
  with check (redex.is_foundry_author());

create policy generated_content_reviews_delete_foundry
  on redex.generated_content_reviews
  for delete
  to authenticated
  using (redex.is_foundry_author());

-- -----------------------------------------------------------------------------
-- Source Binder internals: Foundry only.
-- -----------------------------------------------------------------------------
create policy source_files_select_foundry
  on redex.source_files
  for select
  to authenticated
  using (redex.is_foundry_author());

create policy source_files_insert_foundry
  on redex.source_files
  for insert
  to authenticated
  with check (redex.is_foundry_author());

create policy source_files_update_foundry
  on redex.source_files
  for update
  to authenticated
  using (redex.is_foundry_author())
  with check (redex.is_foundry_author());

create policy source_files_delete_foundry
  on redex.source_files
  for delete
  to authenticated
  using (redex.is_foundry_author());

create policy source_file_versions_select_foundry
  on redex.source_file_versions
  for select
  to authenticated
  using (redex.is_foundry_author());

create policy source_file_versions_insert_foundry
  on redex.source_file_versions
  for insert
  to authenticated
  with check (redex.is_foundry_author());

create policy source_file_versions_update_foundry
  on redex.source_file_versions
  for update
  to authenticated
  using (redex.is_foundry_author())
  with check (redex.is_foundry_author());

create policy source_file_versions_delete_foundry
  on redex.source_file_versions
  for delete
  to authenticated
  using (redex.is_foundry_author());

create policy source_sections_select_foundry
  on redex.source_sections
  for select
  to authenticated
  using (redex.is_foundry_author());

create policy source_sections_insert_foundry
  on redex.source_sections
  for insert
  to authenticated
  with check (redex.is_foundry_author());

create policy source_sections_update_foundry
  on redex.source_sections
  for update
  to authenticated
  using (redex.is_foundry_author())
  with check (redex.is_foundry_author());

create policy source_sections_delete_foundry
  on redex.source_sections
  for delete
  to authenticated
  using (redex.is_foundry_author());

create policy module_source_bindings_select_foundry
  on redex.module_source_bindings
  for select
  to authenticated
  using (redex.is_foundry_author());

create policy module_source_bindings_insert_foundry
  on redex.module_source_bindings
  for insert
  to authenticated
  with check (redex.is_foundry_author());

create policy module_source_bindings_update_foundry
  on redex.module_source_bindings
  for update
  to authenticated
  using (redex.is_foundry_author())
  with check (redex.is_foundry_author());

create policy module_source_bindings_delete_foundry
  on redex.module_source_bindings
  for delete
  to authenticated
  using (redex.is_foundry_author());
