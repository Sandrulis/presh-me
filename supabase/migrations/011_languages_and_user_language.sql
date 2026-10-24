-- Seed all UI languages (same set as routine-app) and persist signed-in preference.

alter table public.users
  add column if not exists language_code text references public.site_languages (code) on delete set null;

create index if not exists users_language_code_idx
  on public.users (language_code);

insert into public.site_languages (code, name, is_active, is_default, sort_order)
values
  ('lv', 'Latviešu', true, true, 0),
  ('en', 'English', true, false, 1),
  ('ru', 'Русский', true, false, 2),
  ('de', 'Deutsch', true, false, 3),
  ('fr', 'Français', true, false, 4),
  ('es', 'Español', true, false, 5),
  ('nl', 'Nederlands', true, false, 6),
  ('da', 'Dansk', true, false, 7),
  ('no', 'Norsk bokmål', true, false, 8),
  ('fi', 'Suomi', true, false, 9),
  ('pl', 'Polski', true, false, 10),
  ('lt', 'Lietuvių', true, false, 11),
  ('et', 'Eesti', true, false, 12),
  ('it', 'Italiano', true, false, 13),
  ('sv', 'Svenska', true, false, 14)
on conflict (code) do update
set
  name = excluded.name,
  is_active = true,
  sort_order = excluded.sort_order;

-- Keep a single default (lv) if somehow multiple were set.
update public.site_languages set is_default = (code = 'lv');

create or replace function public.set_current_user_language(p_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.site_languages as lang
    where lang.code = p_code
      and lang.is_active = true
  ) then
    raise exception 'Language is not available';
  end if;

  update public.users
  set language_code = p_code
  where id = uid;
end;
$$;

revoke all on function public.set_current_user_language(text) from public, anon;
grant execute on function public.set_current_user_language(text) to authenticated;
