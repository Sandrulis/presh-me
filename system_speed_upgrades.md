# Presh - sistēmas ātrdarbības uzlabojumi

**Pašreizējā atzīme:** **8.8 / 10**  
**Iepriekšējā (2026-11-03 audits):** 8.6 / 10  
**Sākotnējā (pirms visa cikla):** 6.5 / 10  
**Audits / pārbaude:** 2026-11-03 (atkārtots pēc N1–N4 izpildes)

Statuss: `[x]` izdarīts · `[~]` daļēji · `[ ]` vēl

**Atzīmes pamatojums (8.8):** N1–N4 izpildīti; middleware maintenance vairs ne sit Supabase katrā anonīmā pieprasījumā; layout maintenance ar `unstable_cache`; booking reservations bez pilna jsonb; booking UI atsevišķā chunk. **Atlikušais līdz 9.0:** production Web Vitals, admin virtuāls scroll, legacy `data:image`, booking POST joprojām lasa pilnu lapu (pieņemami).

**Legacy:** esošie `data:image/…` lietotāju lapās, kamēr nav pārglabāti.

---

## Atkārtotā pārbaude (2026-11-03, pēc N1–N4)

### Izpildīts

| ID | Risinājums | Faili |
|---|---|---|
| **N1** | 15s in-memory kešs + `fetch` ar `revalidate`/`maintenance-mode` tag; `withMaintenanceKick` tikai ja ir `presh_session` vai Supabase auth cookies | `maintenance-mode-cache.ts`, `maintenance-middleware.ts`, `revalidate-maintenance.ts` |
| **N2** | Root layout: `getCachedMaintenanceMode()` | `layout.tsx` |
| **N3** | Reservations: `select` tikai `id`, `account_id`, `published`, `content->trialStartedAt`, `content->blocks`; `shouldRedirectPublicProfileAwayLite`; `pageJsonHasBookingBlock` | `load-booking-reservations.ts`, `public-trial-access.ts`, `page-has-booking-block.ts` |
| **N4** | `next/dynamic` booking blokam | `block-faces.tsx` |

### Verifikācija

- `npm run typecheck` — OK  
- `npm run build` — OK  

### Kas vēl atlikušs (nav regresija N1–N4)

| ID | Piezīme |
|---|---|
| **N5** | Fiksēta lapas valoda — papildu servera i18n, ja iestatīts |
| **N6** | Booking drawer — `/api/booking/reservations` pēc datuma (apzināts) |
| — | `submit-booking-request` — pilns `content` POST plūsmai |
| — | Admin load-more 200, ne virtuāls scroll |
| — | Production LCP/TTFB mērījumi |

---

## Padziļinātā pārbaude (2026-11-03, sākotnējā)

### Metode

- Koda revīzija: middleware, layout, publiskā `[handle]`, booking API, i18n, store, `next.config`, migrācijas indeksi.
- `npm run build` — viss maršrutēts kā `ƒ` (SSR), middleware kā Proxy; build OK.

### Kas joprojām labi (apstiprināts)

| Joma | Secinājums |
|---|---|
| Admin hydrate | `fetchAdminLists` bez pilna `content` |
| Middleware auth | Supabase `getUser()` tikai `/`, auth un aizsargāti ceļi |
| Code splitting | `/studio`, `/start`, **booking bloks** — `next/dynamic` |
| i18n server | `loadMessages()` lazy; `getServerTranslations` ar `cache()` |
| Layout kešs | branding, Umami 60s; **maintenance 15s** |
| Publiskā lapa | `loadPageByHandle` — `cache()` |
| Booking API | Šaurāks reservations select; rate limit; indekss DB |

### Sākotnējie riski (N1–N4) — `[x]`

Skatīt tabulu „Izpildīts” augšā. N5/N6 paliek zema prioritāte.

---

## Kas šobrīd palēnina (atlikušais)

- Vecie `data:image/…` lietotāju lapās.
- Admin saraksti ar „Rādīt vairāk” (200), nevis virtuāls scroll.
- CSP/`next/image` ar `unoptimized` Storage URL.
- Booking submit — pilna lapas lasīšana (reti POST).

---

## Kas jau ir labi

| Kontrole | Kur | Statuss |
|---|---|---|
| Servera i18n `import()` pārējām valodām | `load-messages.ts` | done |
| Presence `/api/presence` | store | done |
| Publiskā lapa pa handle | `[handle]` | done |
| Admin lists bez `content` | `fetchAdminLists` | **done (H1)** |
| Middleware auth scope | `middleware.ts` | **done (H3)** |
| Studio/onboarding lazy | `studio/page`, `start/page` | **done (H4)** |
| Admin katalogi lazy | `bundled-catalog.ts` | **done (H5)** |
| Layout kešs | `settings-cache.ts` | **done (M1 + N2)** |
| Middleware maintenance kešs | `maintenance-mode-cache.ts` | **done (N1)** |
| Booking reservations select | `load-booking-reservations.ts` | **done (N3)** |
| Booking UI chunk | `block-faces.tsx` | **done (N4)** |
| Feedback inbox bez images | `feedback/store.ts` | **done (M3)** |
| Geo no CDN header | `request-geo.ts` | **done (M7)** |
| Storage upload | `014` + `processAndUploadImage` | **done (H2)** |

---

## HIGH

### H1–H5 `[x]` — skatīt iepriekšējo žurnālu

### N1. Middleware maintenance kešs `[x]`

---

## MIDDLE

| ID | Statuss | Piezīme |
|---|---|---|
| M1 layout kešs | `[x]` | branding + Umami + maintenance |
| M2–M8 | `[x]` | (bez izmaiņām) |
| N2 layout maintenance | `[x]` | `getCachedMaintenanceMode()` |
| N3 booking reservations | `[x]` | jsonb tikai `blocks` + trialStartedAt |
| N4 booking UI dynamic | `[x]` | `page-booking-ui` lazy chunk |

---

## LOW

L1–L5; N5/N6 — lapas valoda un booking GET round-trip.

---

## Atzīmes

| Mērķis | Kritērijs | Statuss |
|---|---|---|
| ~8.5 | H2, M2–M8 | **done** |
| ~8.7 | 2026-10-25 audits | **done** |
| **~8.8** | **N1–N4** | **done** |
| ~9.0 | production metrics + virtuāls admin scroll | **pending** |

### Skala (orientieris)

| Atzīme | Nozīme |
|---|---|
| 6–7 | Liels jsonb/middleware sloga |
| 7.5–8 | Admin/store labots; edge smagums |
| **8.5–8.9** | **Pašreizējā zona** |
| 9+ | Mērīti Web Vitals + virtuāls admin |

---

## Kā pārbaudīt

1. Network: admin hydrate bez milzīga `content`.
2. Publiska `[handle]` **bez** auth cookies — middleware **nav** `site_settings` REST (N1).
3. Ar `presh_session` / auth — maintenance kešs max reizi 15s (DevTools).
4. Layout maintenance — tas pats kešs ar tag pēc admin saglabāšanas.
5. Booking: `reservations` atbilde — serveris nelasa visu portfolio jsonb (N3).
6. Lapa **bez** booking — Network JS: nav `page-booking-ui` chunk līdz booking blokam (N4).
7. `npm run typecheck` / `npm run build`.

---

## Izpildes žurnāls

| Datums | Kas izdarīts | Piezīmes |
|---|---|---|
| 2026-10-25 | Sākotnējais audits | Atzīme **6.5** |
| 2026-10-25 | H1, H3–H5, M1, M3, M7; Storage `014` | Atzīme **8.0** |
| 2026-10-25 | H2 cutover, M2, M4–M6, M8 | Atzīme **8.7** |
| 2026-11-03 | Padziļināts audits | Atzīme **8.6**; backlog N1–N4 |
| 2026-11-03 | N1–N4 implementēts + build | Atzīme **8.8** |
