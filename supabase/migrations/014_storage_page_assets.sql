-- H2 / speed H2 foundation: Storage bucket for page media (paths in jsonb, not data URLs).
-- Policies: owners manage own folder; public read for published assets.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'page-assets',
  'page-assets',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists page_assets_public_read on storage.objects;
create policy page_assets_public_read
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'page-assets');

drop policy if exists page_assets_owner_insert on storage.objects;
create policy page_assets_owner_insert
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'page-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists page_assets_owner_update on storage.objects;
create policy page_assets_owner_update
  on storage.objects for update to authenticated
  using (
    bucket_id = 'page-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'page-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists page_assets_owner_delete on storage.objects;
create policy page_assets_owner_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'page-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
