# Presh - izstrādātāja dokumentācija

Link-in-bio / portfolio lapas. Lietotājs reģistrējas, paņem `presh.me/{handle}` un studijā saliek profilu, saites, blokus un izskatu.

**Current version:** skatīt `package.json` / `README.md` / `CHANGELOG.md`.

## Tech stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4 (`app/globals.css`)
- Ports: **3130** (`npm run dev` / `npm start`)
- Dati: **Supabase** (Auth + Postgres). UI caur `app/lib/store.ts` (atmiņas kešs + Supabase klientu).
- UI: `t()` + `app/lib/i18n/messages.ts` (lv/en kanons, `_catalog` pārējām valodām); `npm run i18n:check`; `site_translations` overlay + `npm run i18n:seed-db`

## Supabase

- Env: `.env.local` (gitignored) — URL, anon, service_role, `SUPABASE_DB_PASSWORD`, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, optional `INTEGRATION_SECRETS_KEY` (AES key material for encrypting `site_integrations.client_secret` at rest; rotate by re-saving secrets in admin)
- Service role (`SUPABASE_SERVICE_ROLE_KEY`) is server-only via `createAdminClient()` — never import in client components
- Production: set `NEXT_PUBLIC_SITE_URL` to `https://…` (enables HSTS)
- Migrācijas: `supabase/migrations/*.sql` → `npm run db:migrate`
- Tests: `npm run db:test`
- Klienti: `app/lib/supabase/{client,server,admin,env}.ts` + `middleware.ts` sesijas atsvaidzināšanai
- Auth: `signUp` / `signInWithPassword` / `signOut`; profils `ensure_user_profile`
- **MFA (TOTP):** Supabase Dashboard → Authentication → Multi-Factor → enable **TOTP**. Without this, `mfa.enroll` fails with “Could not set up MFA”. Settings UI uses a right `SideDrawer` for QR + OTP. Admins cannot disable MFA (disabled button in UI; server policy unchanged).
- **Branding:** `Logo` / studio sidebar share `BrandMarkIcon` (`app/components/logo.tsx`). Tab icon `/brand/icon` → `siteHeadIconUrl`: admin favicon, else admin logo, else default P SVG (`defaultBrandMarkFaviconDataUrl`). Layout `getCachedSiteBranding` is per-request (`React cache()`), not cross-request `unstable_cache`, so public Header picks up admin logo/name immediately; client store overrides only after a successful DB hydrate.
- **Backup / PITR:** Supabase Dashboard → Project Settings → Database → enable **Point-in-Time Recovery** (Pro+) for production. Schedule weekly logical backups (or rely on PITR window). Document restore owner + RPO/RTO in the team runbook. Never store DB dumps in the git repo.
- Media: new uploads go to Storage bucket `page-assets` (paths in jsonb); legacy `data:image/…` may still exist until re-saved in studio
- Google: pašu OAuth (`app/lib/auth/google-oauth.ts`) — `/auth/google/sign-in` → Google → `/auth/callback`; lietotājs caur admin `createUser` + magiclink `verifyOtp` (ne Supabase Google provider)
- `public.users`: **pirmais** ieraksts → `is_admin = true`; pārējie `false`
- `public.pages`: handle + jsonb `content`; publiski `published`; īpašnieks CRUD; admin redz visu
- Arī: `admin_todos`, `user_feedback`, `contact_messages`, `site_languages`, `site_translations`, `site_settings` (t.sk. `maintenance`, `trial_period_days`), `auth_lockouts`, storage usage kolonnas; abonementi (`subscription_plans`, `user_subscriptions`, Stripe webhook, gada cena, pending downgrade; agrīnais piedāvājums `subscription_early_offer` + `subscription_early_claims`, `claim_early_offer`, migrācija `035`); **`page_booking_reservations`**; konta dzēšanas plānošana (`users` deletion kolonnas, cron purge)
- Labā admin josla tikai `is_admin = true`; navigācijas badge: `fetchAdminNavCounts()` (`app/lib/admin-nav-counts.ts`), refresh ~45s + focus (`admin-sidebar.tsx`); Settings bez badge
- Marketing top nav: `Header` slēpj tikai ar apstiprinātu sesiju (`sessionId` vai SSR `hideMarketingHeader`); novecojusi `presh_session` tiek notīrīta (`resolveSessionHintForRequest`)

## Dati un sesija

Sesija: Supabase Auth cookies. Aktīvā lapa: `users.active_page_id`. UI kešs: `app/lib/store.ts` + `AuthProvider` (`hydrateSession` / `bindAuthListener`).

Paroles: Supabase Auth (nevis localStorage hash).

Aizsargātās lapas (`/start`, `/studio`, …): redirect uz `/login` tikai pēc `isStoreReady()` — nevis tūlīt pēc mount (citādi OAuth redirect zaudē sacensību ar hydrate). Kamēr store nav gatavs: `LoadingScreen` (`app/components/loading-screen.tsx`).

Admin josla: tikai `isSessionAdmin()` (`users.is_admin`).

`useSyncExternalStore` snapshotiem: `readSessionPages` / `readSessionPage` / `readSessionAccount` (stabilas references).

## Publiskie ceļi

| Ceļš | Saturs |
|---|---|
| `/` | Landing; ielogotam redirect → `/studio` vai `/start` |
| `/login`, `/register`, `/forgot-password`, `/update-password` | Auth formas (+ Google). Labajā pusē (`lg+`) nejauša publicēto lapu kolāža (`loadAuthShowcasePages`); zem 1024 px kolāža ir paslēpta |
| `/auth/google/sign-in`, `/auth/callback` | Pašu Google OAuth |
| `/start` | Onboarding (6 soļi) pēc reģistrācijas vai „Jauns links” |
| `/studio` | Redaktors (Pamati / Skats / Izskats) |
| `/settings` | Konta uzstādījumi (t.sk. konta dzēšana, abonements) |
| `/bug`, `/suggestions`, `/feedback`, `/contact` | Atbalsta formas (arī dialogi no kreisās joslas); bug/suggestion — neobligāti attēli |
| `/admin/*` | Admin josla: Todo → Lietotāji → Linki → Ziņojumi → Integrācijas → Moduļi → Valodas → Tulkojumi → Uzstādījumi; `isAdmin` gate; Valodas/Tulkojumi: `+ Pievienot` + side drawer |
| `/` (viesim) | Claim + soļi + features/pricing/FAQ; JSON-LD; header: logo + valoda + login |
| `/link-in-bio` | SEO intent lapa (`IntentLanding` + `seo.link_in_bio.*`); rezervēts `SYSTEM_LINKS`; publiskais URL ar lokalizētu segmentu (`app/lib/seo/localized-slugs.ts`, middleware rewrite) |
| Intent lapas (`/portfolio-website`, `/for/*`, …) | `MarketingIntentPage` + `intent.*` atslēgas (`messages.ts` + `_catalog`); metadata caur `buildIntentPageMetadata`; landing profesijas — `landing-professions.ts`, demo — `demo-profiles.ts` + `demos.ts` |
| `/compare/*` | Noņemts; `retired-compare-paths.ts` + middleware 302 (rezervēts `compare` handle nākotnei) |
| `/robots.txt`, `/sitemap.xml` | Crawl + published profiles (skat. `SEO_AUDIT.md`) |
| `/terms`, `/privacy`, `/cookies` | Juridiskās lapas (EN ceļi); `/rules` → `/terms` |
| `/{handle}` | Publiskā lapa — **SSR** metadata + `PageView`; **nepublisks** vai beidzies `module_trail` trial → redirect `/` |
| `/paraugs` u.c. | Demo piemēri (`app/lib/examples.ts`) |

### Rezervētie handle

`SYSTEM_LINKS` + `EXTRA_RESERVED` → `RESERVED_HANDLES` (`app/lib/handles.ts`). Jauna sistēmas lapa / API / `public/` fails → pievieno pirmo segmentu `SYSTEM_LINKS` (skatīt `.cursor/rules/reserved-system-links.mdc`). `admin` ir `SYSTEM_LINKS`.

## Ielogota čaula

Kad ir sesija:

- Globālais `Header` **nerādās** (`app/components/header.tsx`).
- `AppShell` (`app/components/app-shell.tsx`):
  - **Kreisā** `StudioSidebar`: burger/X virs logo; sašaurināts `w-14`, atvērts `w-60`; linku dropdown + jauns links; uzstādījumi; Atrast kļūdu? / Ieteikumi / Atsauksmes / Kontakti (virs Iziet); iziet. Iesāktai un nepabeigtai lapai (`pageDesignInProgress`, solis pēc pirmā un `finished` vēl false) izvēlnē ir sarkanīgs fons, un `/studio` citai lapai uzmet paziņojumu.
  - **Labā** `AdminSidebar` (pagaidām visiem ielogotajiem): **Todo** → sidemodālis pie labās malas (`presh.admin-todos.v1`, labošana ar textarea, dzēšana ar loading); **Ziņojumi** → iesūtne (`presh.user-feedback.v1`); Linki / Valodas / Tulkojumi / Uzstādījumi u.c.
  - Mobilajā (<700px): plāna top josla (bez fixed rail).

## Onboarding (`/start`)

Soļi: sākums → profils (vārds, **tagline**, bio) → sadaļas → izskats → links → kopsavilkums. Atgriežoties nepabeigtā vednī (solis pēc pirmā) rādās paziņojums. Ja `module_multisites` atļauj vairākas lapas, sākumā ir ceturtā izvēle „No cita lietotāja”: dizains no `localStorage` (`presh.copied-page-design.v1`) vai `GET /api/page-design`. Publiskajā lapā tādam kontam apakšējā labajā stūrī ir kopēšanas poga (`copy-page-design-button.tsx`); kopija patur izskatu un tukšas vietas, ne tekstus un bildes.

- `FieldFrame` — etiķete kā zīmogs uz rāmja.
- `ImageDropField` — drop zona ar highlight; bloķē pārlūka „atvērt failu jaunā tabulā”.
- Option drawer: X, ārpusē, WAAPI slide.

## Studija (`/studio`)

Trīs kolonnas (xl+, `.studio-columns` `globals.css`): Pamati | priekšskats (`DevicePreview`) | Izskats. Šaurāk — cilnes Pamati / Skats / Izskats.

- Nav atsevišķa studijas top bara; **Publicēta / Nepublisks** + **Skatīt lapu** blakus ierīces pārslēdzējam (`DevicePreview`). Nepubliskam: atslēdziņa, neaktīva skatīt poga.
- **`module_trail`:** publicējot iestata `content.trialStartedAt`; `StudioTrialMeter` + admin Links trial modālis; beidzot trial `useExpiredTrialClientRedirect()` met no studijas zonas uz `/`.
- Profils: `displayName`, `tagline` (+ tipogrāfija), `bio`; vārdam opcija **burtu apmale** (`nameStrokeWidth` / `nameStrokeColor`, `app/lib/text-look.ts`).
- Sociālie: `SocialsEditor` (`app/components/socials-editor.tsx`) — kompaktas rindas, FLIP DnD, „+ Pievienot” un labošana abi ir kreisie sidemodāļi; zem Pievienot ir tie paši slīdņi, kas Izskatā. Katalogs `app/lib/socials.ts` (`popular` karodziņš). Platforma `break` pārnes nākamās ikonas jaunā rindā. Zīmoli ir Simple Icons (`social-icon.tsx`). Pogām kopīgs `socialIconSize`, `socialIconRadius` un `socialIconPadding` (`socialButtonMetrics`).
- Pamatu izvēlnē Sociālie/Bloki ir sortable (`stackOrder`); secība atspoguļojas `PageView`.
- **Valoda** (`studio-page-language-drawer`): `content.publicLanguageCode` — fiksēta UI valoda publiskajā lapā (`PublicPageI18nShell`) un studijas priekšskatā (`PageLanguageScope`); tukšs = apmeklētāja valoda.
- Bloki: `BlocksEditor` + `block-faces` / `lib/blocks.ts` — tipi: saite, teksts, **video**, attēls, Spotify, **maps** (`/api/maps/embed`, `lib/google-maps-embed.ts`), resumē, **Instagram** (tikai ieraksta iegulums, `instagram.com/p/…/embed`), **X** (tikai ieraksta iegulums, `x-embed.tsx` + `platform.x.com/widgets.js`), citāts, **skills**, **services** un **products** (nosaukums, neobligāts apraksts, cena + `currency` no `PRICE_CURRENCIES`, `formatItemPrice`; produktam attēls; DnD), **gallery** (`grid` / `masonry` / `carousel`, attēlu DnD; carousel `autoplay` + `intervalSeconds` ar rAF progresu, pauze virs bildes; masonry sadalīts pa kolonnām; klikšķis atver pietuvinājumu), **countdown** (hidrācija: cipari ar `suppressHydrationWarning`, animācija CSS `.countdown-digit-roller`), **poll** (`/api/poll/*`, `page_poll_votes`), FAQ, **booking** (`page-booking-ui`, lazy chunk; kalendārs, Turnstile kad ieslēgts, `GET/POST /api/booking/*`, **`GET /api/booking/calendar`** ICS abonements + **`GET /api/booking/calendar-link`** (auth), e-pasti `booking_owner` / `booking_guest`, DB `page_booking_reservations` + `025` length CHECK); DnD; sidemodāļi bez blur; draft priekšskats.
- Bloka fons var būt `transparent`: `ColorPicker` `allowTransparent` un `surfacePaint` (`app/lib/color/surface.ts`) saitei, countdown, poll, skills, services, products, FAQ un booking pogai. Teksts tad ir lapas krāsa.
- **Booking ICS abonements:** nosaukums feedā = lapas `display_name` / `content.displayName` (fallback handle) — `NAME`, `X-WR-CALNAME`, `X-APPLE-CALENDAR-NAME` ICS failā.

### Booking kalendārs — ICS feed (Vercel)

Abonēšanas saites: `https://presh.me/api/booking/calendar?handle&blockId&token` (`getCalendarFeedOrigin()` + `build-booking-calendar-urls`). Implementācija: `load-booking-calendar-feed.ts`, `build-booking-ics.ts`.

Apple / Google **nevar** iziet cauri Vercel Security Checkpoint (HTML + 429). Pārbaude:

```bash
node scripts/calendar-feed-smoke.mjs "https://presh.me/api/booking/calendar?handle=…&blockId=…&token=…"
```

**Hobby:** Firewall → Bot Management → **Attack Mode → Disable** (viss domēns bez challenge).

**Pro (ieteicams biznesam):** WAF **Bypass / Skip challenge** ceļam `/api/booking/calendar` — Attack Mode var palikt ieslēgts citur.

Pārbaudi arī **Deployment Protection** — production bez Vercel login visiem. Pēc labojuma: no jauna pievienot Apple/Google abonementu.

- Pamatos (toggle): **Contact** (`page-contact-ui`), **Share** (`page-share-ui`); ar moduļa atbalstu **Analytics** (`module_umami`, `studio-analytics-editor`, `PageUmamiTracker`); **Abonements** (`module_paid`, Stripe checkout / change-plan, `studio-plan-picker-drawer`). Agrīnais piedāvājums ir viens admin kartē zem plānu tabulas; ieslēgts tas rāda zvaigznīti un piezīmi maksas plānos un checkout liek `trial_end`.
- Izskats → Teksts: vārds, tagline, bio tipogrāfija; **Bloku stils** drill-down pievienotajiem blokiem (`BlockStyleFields`).
- Attēlu lauki: `ImageDropField` / `ImageField`.

## Versioning & commits

| Fails | Loma |
|---|---|
| `CHANGELOG.md` | Versiju vēsture (`## vX.Y.Z`, jaunākais augšā) |
| `README.md` | Īss produkta pārskats + `**Current version:**` (<150 rindu) |
| `DEVELOPER.md` | Tehniskā dokumentācija (šis fails) |

### `update`

Bump patch `+0.0.1`, atjaunināt `CHANGELOG` / `README` / šo failu. Commit/push tikai ja prasīts. Skatīt `.cursor/rules/readme-version-update.mdc`.

### `push`

Vispirms `update` ja vajag; `typecheck` + `build`; commit `Īss apraksts. vX.Y.Z`; tad push. Skatīt `.cursor/rules/github-version-commit.mdc`.

## Projekta struktūra (galvenais)

```
app/
  components/     # shell, sidebars, studio, loading-screen, socials-editor, onboarding, …
  lib/            # store, auth/google-oauth, handles, socials, themes, types, examples
  auth/           # google/sign-in, callback
  admin/          # admin placeholder lapas
  studio/ start/ settings/ login/ register/ …
  [handle]/      # publiskā lapa
  globals.css
.cursor/rules/
```

## Roadmap

- Vercel deploy
- Admin sadaļu saturs pa lapām
- i18n (lv + en vismaz)
- Linku pārdēvēšana / dzēšana studijā
