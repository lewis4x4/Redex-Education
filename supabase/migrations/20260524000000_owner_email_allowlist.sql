-- Operator Readiness — Owner email allowlist and profile backfill
--
-- Makes first-time operator sign-in self-service: any auth user whose email is
-- present in redex.allowed_owner_emails receives an admin profile at creation.
-- This migration is intentionally idempotent and safe to re-run.

create table if not exists redex.allowed_owner_emails (
  email text primary key,
  created_at timestamptz not null default now(),
  constraint allowed_owner_emails_email_nonempty_chk check (length(btrim(email)) > 0)
);

comment on table redex.allowed_owner_emails is
  'Email allowlist for Redex project owners who should be auto-elevated to admin during profile provisioning.';

create unique index if not exists allowed_owner_emails_lower_email_idx
  on redex.allowed_owner_emails (lower(email));

insert into redex.allowed_owner_emails (email)
values
  (lower('brian.lewis@goredex.com')),
  (lower('blewis@lewisinsurance.com')),
  (lower('blewis@goredex.com'))
on conflict do nothing;

-- Keep the allowlist as server-side configuration. The SECURITY DEFINER auth
-- trigger and migration backfills can read it; browser roles do not need access.
revoke all on table redex.allowed_owner_emails from anon, authenticated;

create or replace function redex.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = redex, public, pg_catalog
as $$
declare
  redex_org_id constant uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  profile_email text := coalesce(new.email, new.id::text || '@unknown.redex.local');
  profile_role text := 'learner';
begin
  if exists (
    select 1
    from redex.allowed_owner_emails owner_email
    where lower(owner_email.email) = lower(profile_email)
  ) then
    profile_role := 'admin';
  end if;

  insert into redex.profiles (id, org_id, email, display_name, role)
  values (
    new.id,
    redex_org_id,
    profile_email,
    coalesce(nullif(split_part(profile_email, '@', 1), ''), 'Redex learner'),
    profile_role
  )
  on conflict (id) do update
    set role = case
      when exists (
        select 1
        from redex.allowed_owner_emails owner_email
        where lower(owner_email.email) = lower(excluded.email)
      ) then 'admin'
      else redex.profiles.role
    end;

  return new;
end;
$$;

-- Recreate the trigger idempotently so it always points at the current function.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function redex.handle_new_user();

-- Backfill profiles for every existing auth user. Missing rows are inserted;
-- existing allowlisted owner rows are promoted without demoting anyone else.
insert into redex.profiles (id, org_id, email, display_name, role)
select
  au.id,
  '00000000-0000-0000-0000-000000000001'::uuid as org_id,
  coalesce(au.email, au.id::text || '@unknown.redex.local') as email,
  coalesce(nullif(split_part(au.email, '@', 1), ''), 'Redex User') as display_name,
  case
    when exists (
      select 1
      from redex.allowed_owner_emails owner_email
      where lower(owner_email.email) = lower(coalesce(au.email, ''))
    ) then 'admin'
    else 'learner'
  end as role
from auth.users au
left join redex.profiles p on p.id = au.id
where p.id is null
on conflict (id) do update
  set role = case
    when exists (
      select 1
      from redex.allowed_owner_emails owner_email
      where lower(owner_email.email) = lower(excluded.email)
    ) then 'admin'
    else redex.profiles.role
  end;

update redex.profiles p
set role = 'admin'
where exists (
  select 1
  from redex.allowed_owner_emails owner_email
  where lower(owner_email.email) = lower(p.email)
);
