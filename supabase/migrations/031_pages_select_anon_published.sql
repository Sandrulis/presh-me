-- Anon SELECT on pages failed after 013 revoked execute on is_system_admin() from anon,
-- while pages_select_public still referenced public.is_system_admin() in USING.

drop policy if exists pages_select_public on public.pages;

drop policy if exists pages_select_published_anon on public.pages;
create policy pages_select_published_anon
  on public.pages
  for select
  to anon
  using (published = true);

drop policy if exists pages_select_authenticated on public.pages;
create policy pages_select_authenticated
  on public.pages
  for select
  to authenticated
  using (published = true or account_id = auth.uid() or public.is_system_admin());
