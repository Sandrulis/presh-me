-- Per-page Umami analytics (module_umami).

insert into public.site_frontend_modules (module_key, is_enabled, is_paid, sort_order)
values ('module_umami', false, false, 40)
on conflict (module_key) do nothing;
