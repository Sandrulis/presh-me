-- Per-user upload ledger (page-assets) + totals for future quotas.

alter table public.users
  add column if not exists storage_bytes_used bigint not null default 0;

alter table public.site_settings
  add column if not exists user_storage_quota_bytes bigint;

alter table public.site_settings
  drop constraint if exists site_settings_user_storage_quota_bytes_nonneg;

alter table public.site_settings
  add constraint site_settings_user_storage_quota_bytes_nonneg
  check (user_storage_quota_bytes is null or user_storage_quota_bytes >= 0);

create table if not exists public.user_storage_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  bucket text not null default 'page-assets',
  object_path text not null,
  byte_size bigint not null,
  mime_type text not null default '',
  file_extension text not null default '',
  original_name text,
  created_at timestamptz not null default now(),
  constraint user_storage_files_byte_size_positive check (byte_size > 0),
  constraint user_storage_files_bucket_path_unique unique (bucket, object_path)
);

create index if not exists user_storage_files_user_id_idx
  on public.user_storage_files (user_id, created_at desc);

alter table public.user_storage_files enable row level security;
revoke all on table public.user_storage_files from anon, authenticated;

drop policy if exists user_storage_files_deny_anon on public.user_storage_files;
drop policy if exists user_storage_files_deny_authenticated on public.user_storage_files;
create policy user_storage_files_deny_anon on public.user_storage_files for all to anon using (false) with check (false);
create policy user_storage_files_deny_authenticated on public.user_storage_files for all to authenticated using (false) with check (false);

create or replace function public.user_storage_files_sync_totals()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.users
    set storage_bytes_used = storage_bytes_used + new.byte_size
    where id = new.user_id;
    return new;
  end if;
  if tg_op = 'DELETE' then
    update public.users
    set storage_bytes_used = greatest(0, storage_bytes_used - old.byte_size)
    where id = old.user_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists user_storage_files_sync_totals on public.user_storage_files;
create trigger user_storage_files_sync_totals
  after insert or delete on public.user_storage_files
  for each row
  execute function public.user_storage_files_sync_totals();

revoke all on function public.user_storage_files_sync_totals() from public;

create or replace function public.record_user_storage_file(
  p_bucket text,
  p_object_path text,
  p_byte_size bigint,
  p_mime_type text,
  p_file_extension text,
  p_original_name text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_prefix text;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  if p_byte_size is null or p_byte_size <= 0 then
    raise exception 'Invalid byte size' using errcode = '22023';
  end if;
  v_prefix := v_uid::text || '/';
  if p_object_path is null or p_object_path = '' or left(p_object_path, length(v_prefix)) <> v_prefix then
    raise exception 'Invalid object path' using errcode = '22023';
  end if;

  insert into public.user_storage_files (
    user_id,
    bucket,
    object_path,
    byte_size,
    mime_type,
    file_extension,
    original_name
  )
  values (
    v_uid,
    coalesce(nullif(trim(p_bucket), ''), 'page-assets'),
    p_object_path,
    p_byte_size,
    coalesce(p_mime_type, ''),
    coalesce(nullif(trim(p_file_extension), ''), 'bin'),
    nullif(trim(p_original_name), '')
  )
  on conflict (bucket, object_path) do nothing;
end;
$$;

revoke all on function public.record_user_storage_file(text, text, bigint, text, text, text) from public;
grant execute on function public.record_user_storage_file(text, text, bigint, text, text, text) to authenticated;

create or replace function public.get_my_storage_usage()
returns json
language sql
security definer
set search_path = ''
stable
as $$
  select json_build_object(
    'bytes_used', coalesce(u.storage_bytes_used, 0),
    'quota_bytes', s.user_storage_quota_bytes
  )
  from public.users u
  cross join public.site_settings s
  where u.id = auth.uid()
    and s.id = 1;
$$;

revoke all on function public.get_my_storage_usage() from public;
grant execute on function public.get_my_storage_usage() to authenticated;
