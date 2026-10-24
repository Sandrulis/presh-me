-- Seed all routine-app integrations as empty shells. Idempotent.
-- Existing google_oauth row is left as-is (on conflict do nothing).

insert into public.site_integrations (integration_key)
values
  ('google_oauth'),
  ('turnstile'),
  ('resend'),
  ('umami'),
  ('sentry'),
  ('stripe')
on conflict (integration_key) do nothing;
