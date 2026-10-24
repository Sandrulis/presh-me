-- Remove seeded frontend modules; product defaults apply when no row exists.
-- Admins define custom module keys in /admin/modules.

delete from public.site_frontend_modules
where module_key in ('google_sign_in', 'public_claim', 'support_forms');
