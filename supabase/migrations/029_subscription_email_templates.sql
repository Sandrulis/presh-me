-- Subscription billing notification email templates (lv + en in DB; other langs use code fallbacks).

insert into public.site_translations (translation_key, values)
values
  (
    'email.subscription_purchased.subject',
    '{"lv": "Abonements aktivizēts — {system}", "en": "Subscription active — {system}"}'::jsonb
  ),
  (
    'email.subscription_purchased.body',
    '{"lv": "Sveiki, {name}!\n\nPaldies, ka abonējies {system}.\n\nPlāns: {plan}\nCena: {price} ({period})\n\nNospied pogu zemāk, lai atvērtu studiju.", "en": "Hello, {name}!\n\nThank you for subscribing to {system}.\n\nPlan: {plan}\nPrice: {price} ({period})\n\nPress the button below to open the studio."}'::jsonb
  ),
  (
    'email.subscription_purchased.button',
    '{"lv": "Atvērt studiju", "en": "Open studio"}'::jsonb
  ),
  (
    'email.subscription_plan_upgraded.subject',
    '{"lv": "Plāns paaugstināts — {system}", "en": "Plan upgraded — {system}"}'::jsonb
  ),
  (
    'email.subscription_plan_upgraded.body',
    '{"lv": "Sveiki, {name}!\n\nTavs abonementa plāns ir paaugstināts.\n\nIepriekšējais: {previous_plan}\nJaunais: {plan}\nCena: {price} ({period})\n\nStripe iekasēs proporcionālu starpību par atlikušo norēķinu periodu.", "en": "Hello, {name}!\n\nYour subscription plan was upgraded.\n\nPrevious: {previous_plan}\nNew: {plan}\nPrice: {price} ({period})\n\nStripe will charge a prorated amount for the rest of the billing period."}'::jsonb
  ),
  (
    'email.subscription_plan_upgraded.button',
    '{"lv": "Atvērt studiju", "en": "Open studio"}'::jsonb
  ),
  (
    'email.subscription_plan_downgraded.subject',
    '{"lv": "Plāns tiks pazemināts — {system}", "en": "Plan downgrade scheduled — {system}"}'::jsonb
  ),
  (
    'email.subscription_plan_downgraded.body',
    '{"lv": "Sveiki, {name}!\n\nTavs plāns tiks pazemināts perioda beigās.\n\nPašreizējais: {previous_plan}\nJaunais no {effective_date}: {plan}\nCena: {price} ({period})\n\nLīdz {effective_date} paliek spēkā pašreizējais plāns un piekļuve.", "en": "Hello, {name}!\n\nYour plan will downgrade at the end of the current billing period.\n\nCurrent: {previous_plan}\nNew from {effective_date}: {plan}\nPrice: {price} ({period})\n\nUntil {effective_date} your current plan and access stay active."}'::jsonb
  ),
  (
    'email.subscription_plan_downgraded.button',
    '{"lv": "Atvērt studiju", "en": "Open studio"}'::jsonb
  )
on conflict (translation_key) do update
set values = public.site_translations.values || excluded.values;
