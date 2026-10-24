-- Site integrations + frontend modules (routine-style). Idempotent.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

create table if not exists public.site_integrations (
  integration_key text primary key,
  client_id text not null default '',
  client_secret text not null default '',
  is_configured boolean not null default false,
  is_enabled boolean not null default false,
  configured_account_email text not null default '',
  configured_by uuid references public.users (id) on delete set null,
  configured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_integrations_key_check check (integration_key ~ '^[a-z0-9_]+$')
);

drop trigger if exists site_integrations_set_updated_at on public.site_integrations;
create trigger site_integrations_set_updated_at
  before update on public.site_integrations
  for each row execute function public.set_updated_at();

alter table public.site_integrations enable row level security;

revoke all on table public.site_integrations from anon, authenticated;
grant select, insert, update, delete on table public.site_integrations to authenticated;

drop policy if exists site_integrations_deny_anon on public.site_integrations;
create policy site_integrations_deny_anon
  on public.site_integrations for all to anon
  using (false)
  with check (false);

drop policy if exists site_integrations_admin on public.site_integrations;
create policy site_integrations_admin
  on public.site_integrations for all to authenticated
  using (public.is_system_admin())
  with check (public.is_system_admin());

insert into public.site_integrations (integration_key)
values ('google_oauth')
on conflict (integration_key) do nothing;

create or replace function public.is_site_integration_enabled(p_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select i.is_enabled and i.is_configured and nullif(pg_catalog.btrim(i.client_id), '') is not null
      from public.site_integrations i
      where i.integration_key = p_key
    ),
    false
  );
$$;

revoke all on function public.is_site_integration_enabled(text) from public;
grant execute on function public.is_site_integration_enabled(text) to anon, authenticated;

create table if not exists public.site_frontend_modules (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  is_enabled boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_frontend_modules_key_unique unique (module_key),
  constraint site_frontend_modules_key_check check (
    module_key ~ '^[a-z0-9._:-]+$'
    and length(module_key) between 1 and 128
  )
);

drop trigger if exists site_frontend_modules_set_updated_at on public.site_frontend_modules;
create trigger site_frontend_modules_set_updated_at
  before update on public.site_frontend_modules
  for each row execute function public.set_updated_at();

alter table public.site_frontend_modules enable row level security;

revoke all on table public.site_frontend_modules from anon, authenticated;
grant select on table public.site_frontend_modules to anon, authenticated;
grant insert, update, delete on table public.site_frontend_modules to authenticated;

drop policy if exists site_frontend_modules_deny_anon on public.site_frontend_modules;
create policy site_frontend_modules_deny_anon
  on public.site_frontend_modules for all to anon
  using (false)
  with check (false);

drop policy if exists site_frontend_modules_select on public.site_frontend_modules;
create policy site_frontend_modules_select
  on public.site_frontend_modules for select to anon, authenticated
  using (true);

drop policy if exists site_frontend_modules_admin on public.site_frontend_modules;
create policy site_frontend_modules_admin
  on public.site_frontend_modules for all to authenticated
  using (public.is_system_admin())
  with check (public.is_system_admin());

-- Frontend modules are empty by default; admins define keys in /admin/modules.
-- Known product defaults (google_sign_in, public_claim, support_forms) stay on
-- when no row exists — see isGoogleSignInModuleEnabled / GoogleSignInButton.
