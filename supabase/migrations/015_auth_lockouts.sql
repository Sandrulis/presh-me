-- Durable auth lockouts + rate limit buckets (service role only; RLS deny clients).

create extension if not exists pgcrypto;

create table if not exists public.rate_limit_buckets (
  bucket_key text primary key,
  hit_count integer not null default 1,
  reset_at timestamptz not null
);

create table if not exists public.auth_lockouts (
  email_hash text primary key,
  failure_count integer not null default 0,
  locked_until timestamptz
);

alter table public.rate_limit_buckets enable row level security;
alter table public.auth_lockouts enable row level security;

revoke all on table public.rate_limit_buckets from anon, authenticated;
revoke all on table public.auth_lockouts from anon, authenticated;

drop policy if exists rate_limit_buckets_deny_anon on public.rate_limit_buckets;
create policy rate_limit_buckets_deny_anon
  on public.rate_limit_buckets for all to anon
  using (false) with check (false);

drop policy if exists rate_limit_buckets_deny_authenticated on public.rate_limit_buckets;
create policy rate_limit_buckets_deny_authenticated
  on public.rate_limit_buckets for all to authenticated
  using (false) with check (false);

drop policy if exists auth_lockouts_deny_anon on public.auth_lockouts;
create policy auth_lockouts_deny_anon
  on public.auth_lockouts for all to anon
  using (false) with check (false);

drop policy if exists auth_lockouts_deny_authenticated on public.auth_lockouts;
create policy auth_lockouts_deny_authenticated
  on public.auth_lockouts for all to authenticated
  using (false) with check (false);
