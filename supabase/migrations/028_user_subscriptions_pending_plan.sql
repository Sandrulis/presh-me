-- Pending plan change (downgrade at period end).

alter table public.user_subscriptions
  add column if not exists pending_plan_id uuid references public.subscription_plans (id) on delete set null;

alter table public.user_subscriptions
  add column if not exists pending_plan_effective_at timestamptz;

alter table public.user_subscriptions
  add column if not exists billing_interval text not null default 'month';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_subscriptions_billing_interval_check'
  ) then
    alter table public.user_subscriptions
      add constraint user_subscriptions_billing_interval_check
      check (billing_interval in ('month', 'year'));
  end if;
end $$;
