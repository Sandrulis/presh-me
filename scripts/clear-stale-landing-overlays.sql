-- Clear stale DB overlays that override code catalog for landing / brand / SEO.
-- Safe to re-run. Intentional custom overlays outside these prefixes are kept.
-- Run: via admin "Reset landing overlays" or npm run db:migrate companion / psql.

delete from public.site_translations
where translation_key = 'app.name'
   or translation_key like 'landing.%'
   or translation_key like 'site.meta.%'
   or translation_key like 'seo.%';
