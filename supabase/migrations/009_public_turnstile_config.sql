-- Public Turnstile site key for auth forms (no secret). Idempotent.

create or replace function public.public_turnstile_config()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'enabled', exists (
      select 1
      from public.site_integrations
      where integration_key = 'turnstile'
        and is_configured
        and is_enabled
        and nullif(pg_catalog.btrim(client_id), '') is not null
        and nullif(pg_catalog.btrim(client_secret), '') is not null
    ),
    'siteKey', coalesce(
      (
        select pg_catalog.btrim(client_id)
        from public.site_integrations
        where integration_key = 'turnstile'
          and is_configured
          and is_enabled
        limit 1
      ),
      ''
    )
  );
$$;

revoke all on function public.public_turnstile_config() from public;
grant execute on function public.public_turnstile_config() to anon, authenticated;
