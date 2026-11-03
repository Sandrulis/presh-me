-- Annual price for subscription plans (EUR per year).

alter table public.subscription_plans
  add column if not exists price_amount_annual numeric(12, 2) not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'subscription_plans_price_annual_nonneg'
  ) then
    alter table public.subscription_plans
      add constraint subscription_plans_price_annual_nonneg check (price_amount_annual >= 0);
  end if;
end
$$;
