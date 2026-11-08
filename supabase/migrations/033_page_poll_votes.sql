-- Poll votes per page block (public vote API uses service role).

create table if not exists public.page_poll_votes (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  block_id text not null,
  option_id text not null,
  voter_key text not null,
  created_at timestamptz not null default now(),
  constraint page_poll_votes_voter_key_len check (char_length(voter_key) between 8 and 128),
  constraint page_poll_votes_unique_voter unique (page_id, block_id, voter_key)
);

create index if not exists page_poll_votes_page_block_idx
  on public.page_poll_votes (page_id, block_id);

alter table public.page_poll_votes enable row level security;

revoke all on table public.page_poll_votes from anon, authenticated;

drop policy if exists page_poll_votes_deny_anon on public.page_poll_votes;
drop policy if exists page_poll_votes_deny_authenticated on public.page_poll_votes;

create policy page_poll_votes_deny_anon
  on public.page_poll_votes for all to anon
  using (false) with check (false);

create policy page_poll_votes_deny_authenticated
  on public.page_poll_votes for all to authenticated
  using (false) with check (false);
