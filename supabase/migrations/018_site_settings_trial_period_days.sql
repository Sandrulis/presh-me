-- Trial period length (days) for future billing. Idempotent.

alter table public.site_settings
  add column if not exists trial_period_days integer not null default 14;

alter table public.site_settings
  drop constraint if exists site_settings_trial_period_days_range;

alter table public.site_settings
  add constraint site_settings_trial_period_days_range
  check (trial_period_days >= 1 and trial_period_days <= 365);
