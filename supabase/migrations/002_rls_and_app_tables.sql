-- RLS for users/pages + app tables (todos, feedback, site admin). Idempotent.

alter table public.users
  add column if not exists active_page_id uuid;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_active_page_id_fkey'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_active_page_id_fkey
      foreign key (active_page_id) references public.pages (id) on delete set null;
  end if;
end
$$;

create or replace function public.is_system_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select u.is_admin from public.users u where u.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_system_admin() from public;
grant execute on function public.is_system_admin() to authenticated, anon;

-- Replace blanket deny with usable policies
drop policy if exists users_deny_anon on public.users;
drop policy if exists users_deny_authenticated on public.users;
drop policy if exists users_select_own on public.users;
drop policy if exists users_select_admin on public.users;
drop policy if exists users_update_own on public.users;
drop policy if exists users_insert_own on public.users;

create policy users_select_own
  on public.users for select to authenticated
  using (id = auth.uid() or public.is_system_admin());

create policy users_insert_own
  on public.users for insert to authenticated
  with check (id = auth.uid());

create policy users_update_own
  on public.users for update to authenticated
  using (id = auth.uid() or public.is_system_admin())
  with check (id = auth.uid() or public.is_system_admin());

grant select, insert, update on table public.users to authenticated;

drop policy if exists pages_deny_anon on public.pages;
drop policy if exists pages_deny_authenticated on public.pages;
drop policy if exists pages_select_public on public.pages;
drop policy if exists pages_select_own on public.pages;
drop policy if exists pages_insert_own on public.pages;
drop policy if exists pages_update_own on public.pages;
drop policy if exists pages_delete_own on public.pages;

create policy pages_select_public
  on public.pages for select to anon, authenticated
  using (published = true or account_id = auth.uid() or public.is_system_admin());

create policy pages_insert_own
  on public.pages for insert to authenticated
  with check (account_id = auth.uid());

create policy pages_update_own
  on public.pages for update to authenticated
  using (account_id = auth.uid() or public.is_system_admin())
  with check (account_id = auth.uid() or public.is_system_admin());

create policy pages_delete_own
  on public.pages for delete to authenticated
  using (account_id = auth.uid() or public.is_system_admin());

grant select on table public.pages to anon, authenticated;
grant insert, update, delete on table public.pages to authenticated;

-- Admin todos
create table if not exists public.admin_todos (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists admin_todos_account_idx on public.admin_todos (account_id, is_done, sort_order);

alter table public.admin_todos enable row level security;
revoke all on table public.admin_todos from anon, authenticated;

drop policy if exists admin_todos_own on public.admin_todos;
create policy admin_todos_own
  on public.admin_todos for all to authenticated
  using (account_id = auth.uid())
  with check (account_id = auth.uid());

grant select, insert, update, delete on table public.admin_todos to authenticated;

-- User feedback (bug / suggestion / feedback)
create table if not exists public.user_feedback (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('bug', 'suggestion', 'feedback')),
  account_id uuid not null references public.users (id) on delete cascade,
  email text not null default '',
  name text not null default '',
  title text not null default '',
  body text not null default '',
  rating integer check (rating is null or (rating between 1 and 5)),
  images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_feedback_created_idx on public.user_feedback (created_at desc);

alter table public.user_feedback enable row level security;
revoke all on table public.user_feedback from anon, authenticated;

drop policy if exists user_feedback_insert_own on public.user_feedback;
drop policy if exists user_feedback_admin on public.user_feedback;

create policy user_feedback_insert_own
  on public.user_feedback for insert to authenticated
  with check (account_id = auth.uid());

create policy user_feedback_admin
  on public.user_feedback for all to authenticated
  using (public.is_system_admin())
  with check (public.is_system_admin());

grant insert on table public.user_feedback to authenticated;
grant select, update, delete on table public.user_feedback to authenticated;

-- Contact messages
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.users (id) on delete set null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
revoke all on table public.contact_messages from anon, authenticated;

drop policy if exists contact_messages_insert on public.contact_messages;
drop policy if exists contact_messages_admin on public.contact_messages;

create policy contact_messages_insert
  on public.contact_messages for insert to authenticated
  with check (account_id is null or account_id = auth.uid());

create policy contact_messages_admin
  on public.contact_messages for all to authenticated
  using (public.is_system_admin())
  with check (public.is_system_admin());

grant insert on table public.contact_messages to authenticated;
grant select, update, delete on table public.contact_messages to authenticated;

-- Site languages
create table if not exists public.site_languages (
  code text primary key,
  name text not null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0
);

alter table public.site_languages enable row level security;
revoke all on table public.site_languages from anon, authenticated;

drop policy if exists site_languages_read on public.site_languages;
drop policy if exists site_languages_admin on public.site_languages;

create policy site_languages_read
  on public.site_languages for select to anon, authenticated
  using (true);

create policy site_languages_admin
  on public.site_languages for all to authenticated
  using (public.is_system_admin())
  with check (public.is_system_admin());

grant select on table public.site_languages to anon, authenticated;
grant insert, update, delete on table public.site_languages to authenticated;

insert into public.site_languages (code, name, is_active, is_default, sort_order)
values
  ('lv', 'Latviešu', true, true, 0),
  ('en', 'English', true, false, 1)
on conflict (code) do nothing;

-- Site translations
create table if not exists public.site_translations (
  translation_key text primary key,
  values jsonb not null default '{}'::jsonb
);

alter table public.site_translations enable row level security;
revoke all on table public.site_translations from anon, authenticated;

drop policy if exists site_translations_read on public.site_translations;
drop policy if exists site_translations_admin on public.site_translations;

create policy site_translations_read
  on public.site_translations for select to anon, authenticated
  using (true);

create policy site_translations_admin
  on public.site_translations for all to authenticated
  using (public.is_system_admin())
  with check (public.is_system_admin());

grant select on table public.site_translations to anon, authenticated;
grant insert, update, delete on table public.site_translations to authenticated;

-- Site settings (single row)
create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  system_name text not null default 'Presh',
  legal_email text not null default 'hello@presh.me',
  legal_entity_name text not null default '',
  legal_entity_reg_no text not null default '',
  legal_entity_address text not null default '',
  timezone text not null default 'Europe/Riga',
  date_format text not null default 'd.m.Y',
  date_separator text not null default '.',
  time_format text not null default '24',
  week_start_day text not null default 'monday',
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
revoke all on table public.site_settings from anon, authenticated;

drop policy if exists site_settings_read on public.site_settings;
drop policy if exists site_settings_admin on public.site_settings;

create policy site_settings_read
  on public.site_settings for select to anon, authenticated
  using (true);

create policy site_settings_admin
  on public.site_settings for all to authenticated
  using (public.is_system_admin())
  with check (public.is_system_admin());

grant select on table public.site_settings to anon, authenticated;
grant insert, update, delete on table public.site_settings to authenticated;

insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

-- Handle availability for registration (anon-safe)
create or replace function public.is_handle_available(p_handle text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.pages where handle = lower(btrim(p_handle))
  );
$$;

revoke all on function public.is_handle_available(text) from public;
grant execute on function public.is_handle_available(text) to anon, authenticated;
