-- S2/S3: length guards on public booking reservation rows.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'page_booking_reservations_guest_email_len'
  ) then
    alter table public.page_booking_reservations
      add constraint page_booking_reservations_guest_email_len
      check (char_length(guest_email) <= 254);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'page_booking_reservations_comment_len'
  ) then
    alter table public.page_booking_reservations
      add constraint page_booking_reservations_comment_len
      check (char_length(comment) <= 2000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'page_booking_reservations_block_id_len'
  ) then
    alter table public.page_booking_reservations
      add constraint page_booking_reservations_block_id_len
      check (char_length(block_id) <= 64);
  end if;
end
$$;
