-- One early offer for every paid plan. Can be switched off.

create table if not exists public.subscription_early_offer (
  id integer primary key,
  is_enabled boolean not null default false,
  user_limit integer not null default 0,
  free_months integer not null default 0,
  extendable boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint subscription_early_offer_singleton check (id = 1),
  constraint subscription_early_offer_user_limit_range check (user_limit >= 0 and user_limit <= 100000),
  constraint subscription_early_offer_free_months_range check (free_months >= 0 and free_months <= 24)
);

insert into public.subscription_early_offer (id)
values (1)
on conflict (id) do nothing;

drop trigger if exists subscription_early_offer_set_updated_at on public.subscription_early_offer;
create trigger subscription_early_offer_set_updated_at
  before update on public.subscription_early_offer
  for each row execute function public.set_updated_at();

create table if not exists public.subscription_early_offer_i18n (
  language_code text not null references public.site_languages (code) on delete cascade,
  note text not null default '',
  primary key (language_code)
);

create table if not exists public.subscription_early_claims (
  user_id uuid primary key references public.users (id) on delete cascade,
  free_months integer not null,
  status text not null default 'reserved',
  stripe_session_id text not null default '',
  created_at timestamptz not null default now(),
  constraint subscription_early_claims_months_check check (free_months >= 1 and free_months <= 24),
  constraint subscription_early_claims_status_check check (status in ('reserved', 'kept'))
);

create index if not exists subscription_early_claims_session_idx
  on public.subscription_early_claims (stripe_session_id)
  where stripe_session_id <> '';

-- Carry a per-plan offer into the global row when the global row is still empty.
update public.subscription_early_offer as offer
set
  is_enabled = true,
  user_limit = picked.early_user_limit,
  free_months = picked.early_free_months,
  extendable = picked.early_extendable
from (
  select early_user_limit, early_free_months, early_extendable, id
  from public.subscription_plans
  where early_user_limit > 0 and early_free_months > 0
  order by early_user_limit desc, sort_order asc
  limit 1
) as picked
where offer.id = 1
  and offer.user_limit = 0
  and offer.is_enabled = false;

insert into public.subscription_early_offer_i18n (language_code, note)
select i18n.language_code, i18n.note
from public.subscription_plan_i18n as i18n
where i18n.plan_id = (
  select id
  from public.subscription_plans
  where early_user_limit > 0 and early_free_months > 0
  order by early_user_limit desc, sort_order asc
  limit 1
)
  and length(trim(i18n.note)) > 0
on conflict (language_code) do nothing;

insert into public.subscription_early_claims (user_id, free_months, status, stripe_session_id, created_at)
select distinct on (user_id) user_id, free_months, status, stripe_session_id, created_at
from public.subscription_plan_early_claims
order by user_id, created_at
on conflict (user_id) do nothing;

update public.subscription_plans
set early_user_limit = 0,
    early_free_months = 0,
    early_extendable = false
where early_user_limit <> 0
   or early_free_months <> 0
   or early_extendable;

update public.subscription_plan_i18n
set note = ''
where note <> '';

alter table public.subscription_early_offer enable row level security;
alter table public.subscription_early_offer_i18n enable row level security;
alter table public.subscription_early_claims enable row level security;

revoke all on table public.subscription_early_offer from anon, authenticated;
revoke all on table public.subscription_early_offer_i18n from anon, authenticated;
revoke all on table public.subscription_early_claims from anon, authenticated;

grant select, insert, update, delete on table public.subscription_early_offer to authenticated;
grant select, insert, update, delete on table public.subscription_early_offer_i18n to authenticated;
grant select on table public.subscription_early_claims to authenticated;

drop policy if exists subscription_early_offer_deny_anon on public.subscription_early_offer;
create policy subscription_early_offer_deny_anon
  on public.subscription_early_offer for all to anon
  using (false)
  with check (false);

drop policy if exists subscription_early_offer_admin on public.subscription_early_offer;
create policy subscription_early_offer_admin
  on public.subscription_early_offer for all to authenticated
  using (public.is_system_admin())
  with check (public.is_system_admin());

drop policy if exists subscription_early_offer_i18n_deny_anon on public.subscription_early_offer_i18n;
create policy subscription_early_offer_i18n_deny_anon
  on public.subscription_early_offer_i18n for all to anon
  using (false)
  with check (false);

drop policy if exists subscription_early_offer_i18n_admin on public.subscription_early_offer_i18n;
create policy subscription_early_offer_i18n_admin
  on public.subscription_early_offer_i18n for all to authenticated
  using (public.is_system_admin())
  with check (public.is_system_admin());

drop policy if exists subscription_early_claims_deny_anon on public.subscription_early_claims;
create policy subscription_early_claims_deny_anon
  on public.subscription_early_claims for all to anon
  using (false)
  with check (false);

drop policy if exists subscription_early_claims_admin_select on public.subscription_early_claims;
create policy subscription_early_claims_admin_select
  on public.subscription_early_claims for select to authenticated
  using (public.is_system_admin());

drop policy if exists subscription_early_claims_deny_write on public.subscription_early_claims;
create policy subscription_early_claims_deny_write
  on public.subscription_early_claims for insert to authenticated
  with check (false);

drop policy if exists subscription_early_claims_deny_update on public.subscription_early_claims;
create policy subscription_early_claims_deny_update
  on public.subscription_early_claims for update to authenticated
  using (false)
  with check (false);

drop policy if exists subscription_early_claims_deny_delete on public.subscription_early_claims;
create policy subscription_early_claims_deny_delete
  on public.subscription_early_claims for delete to authenticated
  using (false);

create or replace function public.claim_early_offer(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enabled boolean;
  v_limit integer;
  v_months integer;
  v_existing integer;
  v_used integer;
begin
  if p_user_id is null then
    return 0;
  end if;

  select is_enabled, user_limit, free_months
    into v_enabled, v_limit, v_months
  from public.subscription_early_offer
  where id = 1
  for update;

  if v_enabled is not true or v_limit is null or v_limit <= 0 or v_months is null or v_months <= 0 then
    return 0;
  end if;

  select free_months
    into v_existing
  from public.subscription_early_claims
  where user_id = p_user_id;

  if v_existing is not null then
    return v_existing;
  end if;

  select count(*)::integer
    into v_used
  from public.subscription_early_claims;

  if v_used >= v_limit then
    return 0;
  end if;

  insert into public.subscription_early_claims (user_id, free_months, status)
  values (p_user_id, v_months, 'reserved');

  return v_months;
end;
$$;

revoke all on function public.claim_early_offer(uuid) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.claim_early_offer(uuid) to service_role;
  end if;
end
$$;
