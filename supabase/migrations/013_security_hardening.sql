-- H1: block privilege escalation on users.is_admin / is_blocked
-- M4: admin audit log
-- M6: feedback / contact length checks
-- L6: revoke is_system_admin from anon

create or replace function public.users_protect_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.is_admin is distinct from old.is_admin
       or new.is_blocked is distinct from old.is_blocked then
      if not public.is_system_admin() then
        raise exception 'Only system admins can change is_admin or is_blocked'
          using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists users_protect_privileged_columns on public.users;
create trigger users_protect_privileged_columns
  before update on public.users
  for each row
  execute function public.users_protect_privileged_columns();

revoke all on function public.users_protect_privileged_columns() from public;

-- Audit events (admin actions)
create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users (id) on delete set null,
  action text not null,
  target_type text not null default '',
  target_id text not null default '',
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_events_created_at_idx
  on public.admin_audit_events (created_at desc);

alter table public.admin_audit_events enable row level security;

drop policy if exists admin_audit_deny_anon on public.admin_audit_events;
create policy admin_audit_deny_anon
  on public.admin_audit_events for all to anon
  using (false) with check (false);

drop policy if exists admin_audit_admin_all on public.admin_audit_events;
create policy admin_audit_admin_all
  on public.admin_audit_events for all to authenticated
  using (public.is_system_admin())
  with check (public.is_system_admin());

grant select, insert on table public.admin_audit_events to authenticated;

-- Feedback / contact size guards
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_feedback_title_len'
  ) then
    alter table public.user_feedback
      add constraint user_feedback_title_len check (char_length(title) <= 200);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'user_feedback_body_len'
  ) then
    alter table public.user_feedback
      add constraint user_feedback_body_len check (char_length(body) <= 8000);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'contact_messages_subject_len'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_subject_len check (char_length(subject) <= 200);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'contact_messages_message_len'
  ) then
    alter table public.contact_messages
      add constraint contact_messages_message_len check (char_length(message) <= 8000);
  end if;
end
$$;

-- Anon does not need is_system_admin execute
revoke execute on function public.is_system_admin() from anon;
grant execute on function public.is_system_admin() to authenticated;
