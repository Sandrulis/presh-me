-- Block system access without deleting the account. Idempotent.

alter table public.users
  add column if not exists is_blocked boolean not null default false;

create index if not exists users_is_blocked_idx
  on public.users (is_blocked)
  where is_blocked = true;
