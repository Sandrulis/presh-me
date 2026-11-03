-- Self-service account deletion: email confirm → inactive grace period → purge.

alter table public.users
  add column if not exists deletion_confirm_token_hash text,
  add column if not exists deletion_confirm_token_expires_at timestamptz,
  add column if not exists deletion_confirmed_at timestamptz,
  add column if not exists deletion_purge_at timestamptz;

create index if not exists users_deletion_purge_at_idx
  on public.users (deletion_purge_at)
  where deletion_purge_at is not null;

-- Service role (auth.uid() null) may update privileged columns; signed-in users may not.
create or replace function public.users_protect_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.is_admin is distinct from old.is_admin
       or new.is_blocked is distinct from old.is_blocked
       or new.deletion_confirm_token_hash is distinct from old.deletion_confirm_token_hash
       or new.deletion_confirm_token_expires_at is distinct from old.deletion_confirm_token_expires_at
       or new.deletion_confirmed_at is distinct from old.deletion_confirmed_at
       or new.deletion_purge_at is distinct from old.deletion_purge_at then
      if auth.uid() is not null and not public.is_system_admin() then
        raise exception 'Only system admins can change protected user columns'
          using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

insert into public.site_translations (translation_key, values)
values
  (
    'email.account_deletion_confirm.subject',
    '{"lv": "Apstiprini konta dzēšanu — {system}", "en": "Confirm account deletion — {system}"}'::jsonb
  ),
  (
    'email.account_deletion_confirm.body',
    '{"lv": "Sveiki, {name}!\n\nTu pieprasīji dzēst savu kontu sistēmā {system}.\n\nNospied pogu zemāk, lai apstiprinātu. Pēc apstiprināšanas konts kļūs neaktīvs. Ja {days} dienu laikā neienāksi atkārtoti, konts un dati tiks neatgriezeniski dzēsti. Ja ienāksi šajā periodā, dzēšana tiks atcelta.", "en": "Hello, {name}!\n\nYou requested to delete your account on {system}.\n\nPress the button below to confirm. After confirmation your account becomes inactive. If you do not sign in again within {days} days, your account and data will be permanently deleted. Signing in during this period cancels deletion."}'::jsonb
  ),
  (
    'email.account_deletion_confirm.button',
    '{"lv": "Apstiprināt dzēšanu", "en": "Confirm deletion"}'::jsonb
  ),
  (
    'email.account_deletion_completed.subject',
    '{"lv": "Tavs konts ir dzēsts — {system}", "en": "Your account was deleted — {system}"}'::jsonb
  ),
  (
    'email.account_deletion_completed.body',
    '{"lv": "Sveiki, {name}!\n\nTavs konts sistēmā {system} ir neatgriezeniski dzēsts, jo {days} dienu laikā pēc apstiprināšanas neienāci atkārtoti.\n\nJa domā, ka tā ir kļūda, sazinies ar atbalstu.", "en": "Hello, {name}!\n\nYour {system} account was permanently deleted because you did not sign in again within {days} days after confirming deletion.\n\nIf you think this is a mistake, contact support."}'::jsonb
  ),
  (
    'email.account_deletion_completed.button',
    '{"lv": "", "en": ""}'::jsonb
  ),
  (
    'email.account_deletion_cancelled.subject',
    '{"lv": "Konta dzēšana atcelta — {system}", "en": "Account deletion cancelled — {system}"}'::jsonb
  ),
  (
    'email.account_deletion_cancelled.body',
    '{"lv": "Sveiki, {name}!\n\nTu ienāci savā kontā sistēmā {system}, tāpēc plānotā konta dzēšana ir atcelta. Tavs konts atkal ir aktīvs.", "en": "Hello, {name}!\n\nYou signed in to your {system} account, so the scheduled account deletion was cancelled. Your account is active again."}'::jsonb
  ),
  (
    'email.account_deletion_cancelled.button',
    '{"lv": "", "en": ""}'::jsonb
  )
on conflict (translation_key) do update
set values = public.site_translations.values || excluded.values;
