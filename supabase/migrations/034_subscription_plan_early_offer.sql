-- Early offer: first N users of a plan get M free months, with a footnote and an extendable limit.

alter table public.subscription_plans
  add column if not exists early_user_limit integer not null default 0,
  add column if not exists early_free_months integer not null default 0,
  add column if not exists early_extendable boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'subscription_plans_early_user_limit_range'
  ) then
    alter table public.subscription_plans
      add constraint subscription_plans_early_user_limit_range
      check (early_user_limit >= 0 and early_user_limit <= 100000);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'subscription_plans_early_free_months_range'
  ) then
    alter table public.subscription_plans
      add constraint subscription_plans_early_free_months_range
      check (early_free_months >= 0 and early_free_months <= 24);
  end if;
end
$$;

alter table public.subscription_plan_i18n
  add column if not exists note text not null default '';

create table if not exists public.subscription_plan_early_claims (
  plan_id uuid not null references public.subscription_plans (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  free_months integer not null,
  status text not null default 'reserved',
  stripe_session_id text not null default '',
  created_at timestamptz not null default now(),
  primary key (plan_id, user_id),
  constraint subscription_plan_early_claims_months_check check (free_months >= 1 and free_months <= 24),
  constraint subscription_plan_early_claims_status_check check (status in ('reserved', 'kept'))
);

create index if not exists subscription_plan_early_claims_session_idx
  on public.subscription_plan_early_claims (stripe_session_id)
  where stripe_session_id <> '';

alter table public.subscription_plan_early_claims enable row level security;

revoke all on table public.subscription_plan_early_claims from anon, authenticated;
grant select on table public.subscription_plan_early_claims to authenticated;

drop policy if exists subscription_plan_early_claims_deny_anon on public.subscription_plan_early_claims;
create policy subscription_plan_early_claims_deny_anon
  on public.subscription_plan_early_claims for all to anon
  using (false)
  with check (false);

drop policy if exists subscription_plan_early_claims_admin_select on public.subscription_plan_early_claims;
create policy subscription_plan_early_claims_admin_select
  on public.subscription_plan_early_claims for select to authenticated
  using (public.is_system_admin());

drop policy if exists subscription_plan_early_claims_deny_write on public.subscription_plan_early_claims;
create policy subscription_plan_early_claims_deny_write
  on public.subscription_plan_early_claims for insert to authenticated
  with check (false);

drop policy if exists subscription_plan_early_claims_deny_update on public.subscription_plan_early_claims;
create policy subscription_plan_early_claims_deny_update
  on public.subscription_plan_early_claims for update to authenticated
  using (false)
  with check (false);

drop policy if exists subscription_plan_early_claims_deny_delete on public.subscription_plan_early_claims;
create policy subscription_plan_early_claims_deny_delete
  on public.subscription_plan_early_claims for delete to authenticated
  using (false);

create or replace function public.claim_plan_early_offer(p_plan_id uuid, p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer;
  v_months integer;
  v_existing integer;
  v_used integer;
begin
  if p_plan_id is null or p_user_id is null then
    return 0;
  end if;

  select early_user_limit, early_free_months
    into v_limit, v_months
  from public.subscription_plans
  where id = p_plan_id
  for update;

  select free_months
    into v_existing
  from public.subscription_plan_early_claims
  where plan_id = p_plan_id
    and user_id = p_user_id;

  if v_existing is not null then
    return v_existing;
  end if;

  if v_limit is null or v_limit <= 0 or v_months is null or v_months <= 0 then
    return 0;
  end if;

  select count(*)::integer
    into v_used
  from public.subscription_plan_early_claims
  where plan_id = p_plan_id;

  if v_used >= v_limit then
    return 0;
  end if;

  insert into public.subscription_plan_early_claims (plan_id, user_id, free_months, status)
  values (p_plan_id, p_user_id, v_months, 'reserved');

  return v_months;
end;
$$;

revoke all on function public.claim_plan_early_offer(uuid, uuid) from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.claim_plan_early_offer(uuid, uuid) to service_role;
  end if;
end
$$;
