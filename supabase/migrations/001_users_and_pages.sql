-- Presh core schema. Idempotent. RLS deny for anon / authenticated (service role bypasses).
-- First registered user → is_admin = true; later inserts stay false.

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  name text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists users_is_admin_idx
  on public.users (is_admin)
  where is_admin = true;

create index if not exists users_email_idx
  on public.users (email);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.users (id) on delete cascade,
  handle text not null,
  display_name text not null default '',
  published boolean not null default false,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pages_handle_format check (handle ~ '^[a-z0-9](?:[a-z0-9-]{1,22}[a-z0-9])$')
);

create unique index if not exists pages_handle_unique
  on public.pages (handle);

create index if not exists pages_account_id_idx
  on public.pages (account_id);

alter table public.users enable row level security;
alter table public.pages enable row level security;

revoke all on table public.users from anon, authenticated;
revoke all on table public.pages from anon, authenticated;

drop policy if exists users_deny_anon on public.users;
drop policy if exists users_deny_authenticated on public.users;
create policy users_deny_anon on public.users for all to anon using (false) with check (false);
create policy users_deny_authenticated on public.users for all to authenticated using (false) with check (false);

drop policy if exists pages_deny_anon on public.pages;
drop policy if exists pages_deny_authenticated on public.pages;
create policy pages_deny_anon on public.pages for all to anon using (false) with check (false);
create policy pages_deny_authenticated on public.pages for all to authenticated using (false) with check (false);

-- First user becomes system admin; everyone after stays non-admin.
create or replace function public.users_assign_first_admin()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('public.users.first_admin')
  );

  if not exists (select 1 from public.users) then
    new.is_admin := true;
  else
    new.is_admin := false;
  end if;

  return new;
end;
$$;

drop trigger if exists users_assign_first_admin on public.users;
create trigger users_assign_first_admin
  before insert on public.users
  for each row
  execute function public.users_assign_first_admin();

-- Create / refresh profile row for the signed-in auth user.
create or replace function public.ensure_user_profile(
  p_name text default ''
)
returns public.users
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  display_name text;
  result public.users;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  display_name := nullif(pg_catalog.btrim(coalesce(p_name, '')), '');
  if display_name is null then
    display_name := coalesce(auth.jwt() ->> 'email', 'User');
  end if;

  insert into public.users (id, email, name)
  values (
    uid,
    coalesce(auth.jwt() ->> 'email', ''),
    display_name
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name = case
      when nullif(pg_catalog.btrim(excluded.name), '') is null then public.users.name
      else excluded.name
    end
  returning * into result;

  return result;
end;
$$;

revoke all on function public.ensure_user_profile(text) from public, anon;
grant execute on function public.ensure_user_profile(text) to authenticated;

create or replace function public.touch_pages_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists pages_touch_updated_at on public.pages;
create trigger pages_touch_updated_at
  before update on public.pages
  for each row
  execute function public.touch_pages_updated_at();
