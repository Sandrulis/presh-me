# Changelog

## Unreleased

- (none)

## v0.2.0

**CI — security checks bez ilgas rindas**

- Viens GitHub workflow `Security checks`: gitleaks → npm-audit → smoke (`needs` secībā)
- Privātam repozitorijam Free plānā vairs trīs paralēli workflow runi nekonkurē par vienu runneri
- Smoke solī pievienots `npm run i18n:check`

## v0.1.25

**Abonementa atteikšana un kļūdu toast**

- Stripe atteikšana ar `subscription schedule` (pending downgrade): vispirms schedule release, tad `cancel_at_period_end`
- Studijas abonementa kļūdas toast, nevis teksts zem pogas; skaidrāki API kļūdu teksti

## v0.1.24

**Publiskais zīmols pēc admin save**

- Layout branding bez stale `unstable_cache` — logo un sistēmas nosaukums Headerā pēc saglabāšanas
- Klienta store vairs nepārraksta servera branding ar noklusējumu „Presh”
- Speed/security auditu atkārtota verifikācija (2026-11-04)

## v0.1.23

**Vercel Hobby — mazāk CPU un origin transfer**

- Kešots `site_translations` overlay un valodu saraksts (`unstable_cache` + revalidate pēc admin izmaiņām)
- `refreshSiteAdmin` tikai admin/studio/settings/start, ne visai lapai
- Publiskie `/[handle]` profili ar ISR `revalidate = 60`

## v0.1.22

**Admin zīmols (logo / favicon)**

- Branding augšupielāde uz Storage un saglabāšana ar service role; kļūdu toast ar servera ziņu
- Header, sidebar un cilne: tieši URL, favicon fallback logo vietā, keša revalidācija un live iestatījumi
- Favicon DOM labojums (bez `removeChild` kļūdas)

## v0.1.21

- Landing **Gada** cenu kartītēs: liels mēneša ekvivalents, iekavās mazāks gada kopsumma

## v0.1.20

**Landing pricing un Stripe trial**

- Basic/Pro bez beta/planned; abām kartītēm trial CTA un pilna platuma pogas vienā līmenī
- Gada slēdzis tikai ja visiem plāniem ir gada cena; Stripe checkout ar trial dienām no admin iestatījuma
- Reģistrācija ar `?plan=` → checkout studijā; migrācija `030` atjaunina pricing tulkojumus DB

## v0.1.19

- Security smoke atpazīst cron maršrutu `authorizeCron` (`CRON_SECRET`)

## v0.1.18

**Abonementi, konta dzēšana un e-pasti**

- Gada cena adminā; landing/studijā Mēneša/Gada slēdzis; plāna maiņa (upgrade ar proration, downgrade perioda beigās); checkout bloķēts, ja jau ir aktīvs abonements
- Konta dzēšana: apstiprinājums, grace periods, cron purge; e-pasta veidnes adminā; settings „Dzēst kontu” pilnā platumā
- E-pasti pēc abonementa pirkuma un plāna maiņas; admin dizaini migrācijā `029`; dzēšanas veidņu priekšskatījums bez booking komentāra bloka
- Migrācijas `026`–`029`; studijas plāna izvēle ar apstiprinājumu un toast kļūdām

## v0.1.17

**Ātrdarbība un booking drošība**

- Middleware/layout maintenance kešs; booking reservations bez pilna jsonb; lazy booking UI chunk
- Booking Turnstile (kad ieslēgts), servera handle/blockId limiti; migrācija `025` garumu CHECK
- Auditu atjauninājumi `system_speed_upgrades.md`, `system_security_upgrades.md`

## v0.1.16

**Booking pieteikumi, lapas valoda un admin UX**

- Booking drawer: e-pasts, komentārs, pieteikums → `POST /api/booking/request`; rezervācijas `page_booking_reservations`, sarkani aizņemti laiki, spinner kamēr ielādē slotus
- Divi e-pasta dizaini (īpašnieks / pieteicējs) admin E-pasta dizainos; migrācijas `023`–`024`
- Pamati → **Valoda**: fiksēta lapas UI valoda (`publicLanguageCode`) ar kreiso sidemodāli; publiskajā lapā un priekšskatā
- Admin todo dzēšanā X → loading, rinda pazūd pēc API; `textarea.auth-field` vertikāls padding

## v0.1.15

**Booking bloks, Contact/Share, Umami un abonementi**

- Booking kā parasts bloks studijā (+ Pievienot, DnD secība, sidemodālis); pilna platuma poga ar krāsu un noapaļojumu kā linkiem; migrācija no `bookingEnabled`
- Pamatos Contact un Share (drawer, avatari, QR/URL); linku bloki vienmēr redzami publiskajā lapā
- Modulis `module_umami`: Analytics Pamatos, Umami dashboard, per-page tracker
- Abonementu plāni un Stripe billing (migrācijas 019–021), `module_paid` plūsma studijā

## v0.1.14

**Izmēģinājuma periods, pieejas un studijas uzlabojumi**

- Modulis `module_trail`: trial sākas publicējot; metrs studijā; admin linkos trial info un datuma labošana; beidzies trial vai nepublisks profils → redirect uz `/` (publiskā URL un `/studio`/`/start`/`/settings`)
- Uzturēšanas režīms (`site_settings.maintenance`); glabātuves izmantošanas uzskaite un metrs studijā
- Vārda burtu apmale (teksta stroke) Izskats → Teksts; onboarding/studio bez `/start`↔`/studio` mirgošanas (`active_page_id`)
- Drošība: login lockout, CSP enforce, storage `page-assets`, publiskā lapas šaurāka ielāde

## v0.1.13

**Valodu izvēlne un admin navigācija**

- Marketing valodu switcher: saglabā valodu ar server action un pilnu navigāciju (cookie + layout)
- Admin sānjoslā skaitītāju badge uz sadaļām (izņemot Settings); periodiska atjaunošana

## v0.1.12

**SEO valodās, intent tulkojumi, bez salīdzinājumu lapām**

- Lokalizēti marketing URL (`/lv/portfolio-majaslapa`, u.c.) ar rewrite un kanoniskiem redirectiem
- Salīdzinājumu lapas noņemtas; vecie `/compare/*` un lokalizētie slugi 302 uz mājaslapu
- Intent landing lapas caur `intent.*` tulkojumiem; labots `claim.*` (piem. DE teksts DA/NL/NO/SV katalogos)
- `/link-in-bio` atjaunots; landing studijas priekšskats; bez konkurentu nosaukumu landing tekstos

## v0.1.11

**Landing, `/link-in-bio` un valodu middleware**

- Atjaunota `/link-in-bio` SEO lapa, studijas priekšskata bloks landingā, sitemap un footer saites
- Middleware: vienota valoda neprefiksētām marketing lapām; `/link-in-bio` lokalizēts kā `/ru/link-in-bio` u.c.
- Footer „Cookie settings” vizuāli kā pārējie Legal linki; valodu izvēlne saglabā tekošo ceļu

## v0.1.10

- ESLint: atslēgt React Compiler ref/effect noteikumus esošajam kodam; settings MFA gate bez JSX try/catch

## v0.1.9

- Next.js **16.4.3** (kritiskie CVE: Image Optimization SVG RCE, Server Actions DoS, `use cache` RCE)

## v0.1.8

**Zīmols, landing, drošība un i18n**

- Vienots header/studio logo un noklusējuma favicon (P zīme); admin Logo/Favicon to aizstāj
- Landing: vienkāršots header, noņemts studio-preview bloks; `/link-in-bio` dzēsts (301 uz `/`)
- MFA iestatījumos side drawer; administratoriem redzama neaktīva „Izslēgt MFA”
- Login lockout (`auth_lockouts`), attēlu uploads uz Storage, CSP enforce; plašāka admin/studio/onboarding i18n

## v0.1.7

**Landing FAQ, i18n un admin side drawer**

- Sākumlapā FAQ (liinks-stila jautājumi, pielāgoti Presh); bez Linktree jautājuma; „Kāpēc nav bezmaksas plāna?”
- Admin Valodas / Tulkojumi: `+ Pievienot` virsraksta labajā pusē; pievienošana un labošana side drawer
- Plašāka UI i18n (`t()` + katalogi); legālie dokumenti ar EN; kopīgs `SideDrawer`

## v0.1.6

**Moderns ielādes ekrāns**

- Centrēts `LoadingScreen` (zīme, spinneris, teksts) vietā vienkārša „Ielādē...” teksta
- Lietots studijā, onboarding, settings, admin, login/register un publiskās lapas skeleton

## v0.1.5

**Google OAuth un ielogota mājas novirzīšana**

- Pašu Google OAuth (`/auth/google/sign-in` → `/auth/callback`); login/register poga; atslēgas `.env.local`
- Ielogotam `/` → `/studio`, vai `/start` ja lapa / onboarding nav pabeigts
- Sesijas guardi gaida `isStoreReady()` (vairs nemeta uz login pirms hydrate)

## v0.1.4

**Admin ziņojumi, atbalsta formas un Todo drawer**

- Admin: Linki, Valodas, Tulkojumi, Uzstādījumi; **Ziņojumi** iesūtnei (kļūdas, ieteikumi, atsauksmes, kontakti) ar filtriem un attēliem
- Kreisā josla: Atrast kļūdu?, Ieteikumi, Atsauksmes, Kontakti; rezervētie ceļi `bug` / `suggestions` / `feedback` / `contact`
- Todo no admin joslas — labās puses sidemodālis līdz malai (aizsedz admin rail); Izskats → Bloku stils drill-down

## v0.1.3

**Sociālie tīkli — kompaktas rindas un pievienošana**

- Katrs tīkls vienā rindā: vilkšana, saite, Labot / Dzēst; labošanas modālis (nosaukums, platforma, saite)
- „+ Pievienot” mazāks fonts; kreisais sidemodāls ar populārākajiem tīkliem (meklēšana)
- DnD prioritāte ar FLIP animāciju; vilktais bloks blāvs ar biezāku punktētu robežu

## v0.1.2

**Studijas čaula, admin josla un profils**

- Kreisā josla: burger/X virs logo, paplašinās no kreisās, ESC un blur; bez top nav studijā
- Labā admin josla (pagaidām visiem ielogotajiem): Lietotāji, Linki, Integrācijas, Moduļi, Valodas, Tulkojumi, Uzstādījumi
- Publicēta / Nepublisks pie ierīces pārslēdzēja; nepubliskam atslēdziņa un neaktīva „Skatīt lapu”
- Profilā tagline (fonts/krāsa/izmērs); `FieldFrame` etiķetes uz rāmja; attēlu drop zona ar highlight

## v0.1.1

**Studija, sānu josla un dokumentācija**

- Studijas izvēlnes kartītēm mazāks padding (−40%), mazāks apraksta fonts un šaurāka atstarpe starp nosaukumu un hintu
- Ielogotiem nav top nav; kreisā sānu josla (logo, linku dropdown, jauns links, uzstādījumi, iziet)
- Kontam vairāki linki (`activePage`); „Izveidot jaunu linku” ved uz pilnu onboarding
- `DEVELOPER.md` + `CHANGELOG.md`; `update` / `push` Cursor noteikumi

## v0.1.0

- Frontend link-in-bio: reģistrācija, onboarding, studija, publiskā `/{handle}` lapa
- Dati pārlūkā (`localStorage`); `SYSTEM_LINKS` rezervētie ceļi
