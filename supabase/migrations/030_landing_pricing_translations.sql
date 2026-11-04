-- Refresh landing pricing copy in DB overlay (stale rows showed "Start for free" / beta badges).

insert into public.site_translations (translation_key, values)
values
  (
    'landing.pricing.cta',
    '{"lv": "Izmēģini bez maksas {days} dienas", "en": "Try for free {days} days"}'::jsonb
  ),
  (
    'landing.pricing.subtitle',
    '{"lv": "Saliec lapu un publicē. Maksas plāni ar {days} dienu izmēģinājumu — pirmā maksa tikai pēc tā.", "en": "Build your page and publish. Paid plans include a {days}-day trial — first charge only after that."}'::jsonb
  ),
  (
    'landing.pricing.free.badge',
    '{"lv": "Basic", "en": "Basic"}'::jsonb
  ),
  (
    'landing.pricing.pro.badge',
    '{"lv": "Pro", "en": "Pro"}'::jsonb
  ),
  (
    'landing.pricing.pro.body',
    '{"lv": "Dziļāka analitika, vairāki profili un komandas opcijas.", "en": "Deeper analytics, multiple profiles, and team options."}'::jsonb
  )
on conflict (translation_key) do update
set values = coalesce(public.site_translations.values, '{}'::jsonb) || excluded.values;
