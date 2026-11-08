-- Admin-granted access tiers: off (default), semi_vip (paid modules except multisites), vip (all paid modules).

alter table public.users
  add column if not exists vip_tier text not null default 'off';

alter table public.users drop constraint if exists users_vip_tier_check;
alter table public.users
  add constraint users_vip_tier_check check (vip_tier in ('off', 'semi_vip', 'vip'));
