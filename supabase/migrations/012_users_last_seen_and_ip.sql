-- Track last activity + IP/country for admin presence UI. Idempotent.

alter table public.users
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_ip text,
  add column if not exists last_country text;

create index if not exists users_last_seen_at_idx
  on public.users (last_seen_at desc nulls last);

-- Update presence for the signed-in user (throttled to ~2 minutes unless IP changes).
create or replace function public.touch_user_presence(
  p_ip text default null,
  p_country text default null
)
returns public.users
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  ip_value text := nullif(pg_catalog.btrim(coalesce(p_ip, '')), '');
  country_value text := nullif(pg_catalog.upper(pg_catalog.btrim(coalesce(p_country, ''))), '');
  result public.users;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if country_value is not null and pg_catalog.length(country_value) > 2 then
    country_value := pg_catalog.left(country_value, 2);
  end if;

  update public.users u
  set
    last_seen_at = now(),
    last_ip = coalesce(ip_value, u.last_ip),
    last_country = coalesce(country_value, u.last_country)
  where u.id = uid
    and (
      u.last_seen_at is null
      or u.last_seen_at < now() - interval '2 minutes'
      or (ip_value is not null and u.last_ip is distinct from ip_value)
      or (country_value is not null and u.last_country is distinct from country_value)
    )
  returning * into result;

  if result.id is null then
    select * into result from public.users where id = uid;
  end if;

  return result;
end;
$$;

revoke all on function public.touch_user_presence(text, text) from public;
grant execute on function public.touch_user_presence(text, text) to authenticated;
