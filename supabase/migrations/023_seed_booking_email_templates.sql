-- Booking notification email templates (owner + guest).

insert into public.site_translations (translation_key, values)
values
  (
    'email.booking_owner.subject',
    '{"lv": "Jauns pieteikums — {page}", "en": "New booking request — {page}"}'::jsonb
  ),
  (
    'email.booking_owner.body',
    '{"lv": "Sveiki!\n\nKāds iesniedza pieteikumu tavā lapā {page}.\n\nPārskatī detaļas zemāk un sazinies ar pieteicēju, ja vajag.", "en": "Hello!\n\nSomeone submitted a booking request on your page {page}.\n\nReview the details below and reach out to the guest if needed."}'::jsonb
  ),
  (
    'email.booking_owner.button',
    '{"lv": "", "en": ""}'::jsonb
  ),
  (
    'email.booking_guest.subject',
    '{"lv": "Pieteikums saņemts — {page}", "en": "Request received — {page}"}'::jsonb
  ),
  (
    'email.booking_guest.body',
    '{"lv": "Sveiki!\n\nTavs pieteikums uz {date} plkst. {time} ir nosūtīts {page}.\n\n{comment_line}\n\nJa vajag ko mainīt, sazinies ar lapas īpašnieku.", "en": "Hello!\n\nYour request for {date} at {time} was sent to {page}.\n\n{comment_line}\n\nIf you need to change anything, contact the page owner."}'::jsonb
  ),
  (
    'email.booking_guest.button',
    '{"lv": "", "en": ""}'::jsonb
  )
on conflict (translation_key) do update
set values = public.site_translations.values || excluded.values;
