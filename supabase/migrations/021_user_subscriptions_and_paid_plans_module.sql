-- User Stripe subscriptions + module_paid_plans seed.

insert into public.site_frontend_modules (module_key, is_enabled, is_paid, sort_order)
values ('module_paid_plans', false, false, 35)
on conflict (module_key) do nothing;

create table if not exists public.user_subscriptions (
  user_id uuid primary key references public.users (id) on delete cascade,
  plan_id uuid references public.subscription_plans (id) on delete set null,
  stripe_customer_id text not null default '',
  stripe_subscription_id text,
  status text not null default 'none',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_subscriptions_status_check check (
    status in (
      'none',
      'active',
      'trialing',
      'past_due',
      'canceled',
      'unpaid',
      'incomplete',
      'incomplete_expired',
      'paused'
    )
  )
);

create unique index if not exists user_subscriptions_stripe_subscription_id_unique
  on public.user_subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null and stripe_subscription_id <> '';

drop trigger if exists user_subscriptions_set_updated_at on public.user_subscriptions;
create trigger user_subscriptions_set_updated_at
  before update on public.user_subscriptions
  for each row execute function public.set_updated_at();

alter table public.user_subscriptions enable row level security;

revoke all on table public.user_subscriptions from anon, authenticated;

drop policy if exists user_subscriptions_deny_anon on public.user_subscriptions;
create policy user_subscriptions_deny_anon
  on public.user_subscriptions for all to anon
  using (false)
  with check (false);

drop policy if exists user_subscriptions_deny_authenticated on public.user_subscriptions;
create policy user_subscriptions_deny_authenticated
  on public.user_subscriptions for all to authenticated
  using (false)
  with check (false);
