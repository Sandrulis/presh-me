# Changelog

## Unreleased

- (none)

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
