-- Module paid flag + subscription plans (admin-defined tiers).

alter table public.site_frontend_modules
  add column if not exists is_paid boolean not null default false;

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null,
  price_amount numeric(12, 2) not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plans_key_unique unique (plan_key),
  constraint subscription_plans_key_check check (
    plan_key ~ '^[a-z0-9._:-]+$'
    and length(plan_key) between 1 and 64
  ),
  constraint subscription_plans_price_nonneg check (price_amount >= 0)
);

drop trigger if exists subscription_plans_set_updated_at on public.subscription_plans;
create trigger subscription_plans_set_updated_at
  before update on public.subscription_plans
  for each row execute function public.set_updated_at();

create table if not exists public.subscription_plan_i18n (
  plan_id uuid not null references public.subscription_plans (id) on delete cascade,
  language_code text not null references public.site_languages (code) on delete cascade,
  name text not null default '',
  primary key (plan_id, language_code)
);

create table if not exists public.subscription_plan_modules (
  plan_id uuid not null references public.subscription_plans (id) on delete cascade,
  module_key text not null,
  primary key (plan_id, module_key),
  constraint subscription_plan_modules_key_check check (
    module_key ~ '^[a-z0-9._:-]+$'
    and length(module_key) between 1 and 128
  )
);

alter table public.subscription_plans enable row level security;
alter table public.subscription_plan_i18n enable row level security;
alter table public.subscription_plan_modules enable row level security;

revoke all on table public.subscription_plans from anon, authenticated;
revoke all on table public.subscription_plan_i18n from anon, authenticated;
revoke all on table public.subscription_plan_modules from anon, authenticated;

grant select on table public.subscription_plans to anon, authenticated;
grant select on table public.subscription_plan_i18n to anon, authenticated;
grant select on table public.subscription_plan_modules to anon, authenticated;

grant insert, update, delete on table public.subscription_plans to authenticated;
grant insert, update, delete on table public.subscription_plan_i18n to authenticated;
grant insert, update, delete on table public.subscription_plan_modules to authenticated;

drop policy if exists subscription_plans_deny_anon on public.subscription_plans;
create policy subscription_plans_deny_anon
  on public.subscription_plans for all to anon
  using (false)
  with check (false);

drop policy if exists subscription_plans_select on public.subscription_plans;
create policy subscription_plans_select
  on public.subscription_plans for select to authenticated
  using (true);

drop policy if exists subscription_plans_admin on public.subscription_plans;
create policy subscription_plans_admin
  on public.subscription_plans for all to authenticated
  using (public.is_system_admin())
  with check (public.is_system_admin());

drop policy if exists subscription_plan_i18n_deny_anon on public.subscription_plan_i18n;
create policy subscription_plan_i18n_deny_anon
  on public.subscription_plan_i18n for all to anon
  using (false)
  with check (false);

drop policy if exists subscription_plan_i18n_select on public.subscription_plan_i18n;
create policy subscription_plan_i18n_select
  on public.subscription_plan_i18n for select to authenticated
  using (true);

drop policy if exists subscription_plan_i18n_admin on public.subscription_plan_i18n;
create policy subscription_plan_i18n_admin
  on public.subscription_plan_i18n for all to authenticated
  using (public.is_system_admin())
  with check (public.is_system_admin());

drop policy if exists subscription_plan_modules_deny_anon on public.subscription_plan_modules;
create policy subscription_plan_modules_deny_anon
  on public.subscription_plan_modules for all to anon
  using (false)
  with check (false);

drop policy if exists subscription_plan_modules_select on public.subscription_plan_modules;
create policy subscription_plan_modules_select
  on public.subscription_plan_modules for select to authenticated
  using (true);

drop policy if exists subscription_plan_modules_admin on public.subscription_plan_modules;
create policy subscription_plan_modules_admin
  on public.subscription_plan_modules for all to authenticated
  using (public.is_system_admin())
  with check (public.is_system_admin());
