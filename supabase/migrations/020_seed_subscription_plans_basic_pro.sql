-- Default subscription tiers: Basic and Pro (names per site language; modules added in admin).

insert into public.subscription_plans (plan_key, price_amount, sort_order, is_active)
values
  ('basic', 0, 0, true),
  ('pro', 0, 1, true)
on conflict (plan_key) do update
set
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.subscription_plan_i18n (plan_id, language_code, name)
select p.id, x.language_code, x.name
from public.subscription_plans p
inner join (
  values
    ('basic', 'lv', 'Pamata'),
    ('basic', 'en', 'Basic'),
    ('basic', 'ru', 'Базовый'),
    ('basic', 'de', 'Basis'),
    ('basic', 'fr', 'Basique'),
    ('basic', 'es', 'Básico'),
    ('basic', 'nl', 'Basis'),
    ('basic', 'da', 'Basis'),
    ('basic', 'no', 'Grunnleggende'),
    ('basic', 'fi', 'Perus'),
    ('basic', 'pl', 'Podstawowy'),
    ('basic', 'lt', 'Bazinis'),
    ('basic', 'et', 'Põhi'),
    ('basic', 'it', 'Base'),
    ('basic', 'sv', 'Bas'),
    ('pro', 'lv', 'Pro'),
    ('pro', 'en', 'Pro'),
    ('pro', 'ru', 'Про'),
    ('pro', 'de', 'Pro'),
    ('pro', 'fr', 'Pro'),
    ('pro', 'es', 'Pro'),
    ('pro', 'nl', 'Pro'),
    ('pro', 'da', 'Pro'),
    ('pro', 'no', 'Pro'),
    ('pro', 'fi', 'Pro'),
    ('pro', 'pl', 'Pro'),
    ('pro', 'lt', 'Pro'),
    ('pro', 'et', 'Pro'),
    ('pro', 'it', 'Pro'),
    ('pro', 'sv', 'Pro')
) as x (plan_key, language_code, name)
  on p.plan_key = x.plan_key
on conflict (plan_id, language_code) do update
set name = excluded.name;
