-- Booked time slots per page booking block (public API reads via service role).

create table if not exists public.page_booking_reservations (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  block_id text not null,
  booking_date date not null,
  booking_time text not null,
  guest_email text not null default '',
  comment text not null default '',
  created_at timestamptz not null default now(),
  constraint page_booking_reservations_time_format check (booking_time ~ '^\d{2}:\d{2}$'),
  constraint page_booking_reservations_unique_slot unique (page_id, block_id, booking_date, booking_time)
);

create index if not exists page_booking_reservations_page_block_date_idx
  on public.page_booking_reservations (page_id, block_id, booking_date);

alter table public.page_booking_reservations enable row level security;

revoke all on table public.page_booking_reservations from anon, authenticated;

drop policy if exists page_booking_reservations_deny_anon on public.page_booking_reservations;
drop policy if exists page_booking_reservations_deny_authenticated on public.page_booking_reservations;

create policy page_booking_reservations_deny_anon
  on public.page_booking_reservations for all to anon
  using (false) with check (false);

create policy page_booking_reservations_deny_authenticated
  on public.page_booking_reservations for all to authenticated
  using (false) with check (false);
