-- Drop unused placeholder integrations.

delete from public.site_integrations
where integration_key in ('google_plugin', 'microsoft_oauth');
