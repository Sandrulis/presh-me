# Presh - sistēmas ātrdarbības uzlabojumi

**Pašreizējā atzīme:** **8.7 / 10**  
**Iepriekšējā (pirms šīs izpildes):** 8.0 / 10  
**Sākotnējā (pirms visa cikla):** 6.5 / 10  
**Audits / pārbaude:** 2026-10-25 (atkārtotais audits pēc ieteikumu izpildes)

Statuss: `[x]` izdarīts · `[~]` daļēji · `[ ]` vēl

**Atlikušais līdz ~9.0:** production Web Vitals / TTFB mērījumi + virtuaizācija ļoti lieliem admin sarakstiem.  
**Legacy:** esošie data URL jsonb līdz pārglabāšanai.

---

## Kas šobrīd palēnina (atlikušais)

- Vecie `data:image/…` lietotāju lapās, kamēr nav pārglabāti.
- Admin saraksti ar „Rādīt vairāk” (200), nevis virtuāls scroll.
- CSP/`next/image` ar `unoptimized` Storage URL — joprojām labāk nekā milzīgs jsonb.

---

## Kas jau ir labi

| Kontrole | Kur | Statuss |
|---|---|---|
| Servera i18n `import()` pārējām valodām | `load-messages.ts` | done |
| Presence `/api/presence` | store | done |
| Publiskā lapa pa handle | `[handle]` | done |
| Indeksi pages | `001` | done |
| Admin lists bez `content` | `fetchAdminLists` | **done (H1)** |
| Middleware tikai aizsargātajiem ceļiem | `middleware.ts` | **done (H3)** |
| Studio/onboarding `next/dynamic` | `studio/page`, `start/page` | **done (H4)** |
| Admin katalogi lazy | `bundled-catalog.ts` | **done (H5)** |
| Branding/Umami `unstable_cache` 60s | `settings-cache.ts` | **done (M1)** |
| Feedback inbox bez images | `feedback/store.ts` | **done (M3)** |
| Geo no CDN header, bez ipapi | `request-geo.ts` | **done (M7)** |
| Storage bucket + UI upload | `014` + `processAndUploadImage` | **done (H2)** |

---

## HIGH

### H1. Admin hydrate bez `content` `[x]`

### H2. Attēli ārā no jsonb `[x]`

Jaunie avatar / banner / page / block / branding (raster) → `page-assets` public URL.

### H3. Middleware ne visiem ceļiem `[x]`

### H4. Studio / onboarding lazy `[x]`

### H5. `bundled-catalog` lazy `[x]`

---

## MIDDLE

| ID | Statuss | Piezīme |
|---|---|---|
| M1 layout kešs | `[x]` | branding + Umami 60s |
| M2 public page šaurāks select | `[x]` | eksplicītas kolonnas (ne `*`) |
| M3 feedback bez images | `[x]` | |
| M4 next/image | `[x]` | `PageMedia` http(s) URL |
| M5 lapošana | `[x]` | range 200 + „Rādīt vairāk” |
| M6 fonti | `[x]` | script/mono tikai `latin` |
| M7 presence geo | `[x]` | |
| M8 sesijas hint layout | `[x]` | `presh_session` cookie; home skip Auth bez hint |

---

## LOW

L1–L5 zema prioritāte; L5 marketing Cache-Control jau ir.

---

## Atzīmes

| Mērķis | Kritērijs | Statuss |
|---|---|---|
| ~7.5 | H1–H3 | **done** |
| ~8.0 | + H4–H5, M1/M3/M7 | **done** |
| ~8.5 | + H2 cutover, M2, M4, M5, M6, M8 | **done → 8.7** |
| ~9.0 | production metrics | pending |

---

## Kā pārbaudīt

1. Network: admin hydrate pages JSON bez milzīga `content`.
2. Landing TTFB — bez `presh_session` cookie nav `getUser()` uz `/`.
3. `/studio` — atsevišķs chunk; jauns attēls → Storage URL, ne data URL.
4. Admin „Rādīt vairāk” pie >200 ierakstiem.
5. `npm run typecheck` / `npm run build`.

---

## Izpildes žurnāls

| Datums | Kas izdarīts | Piezīmes |
|---|---|---|
| 2026-10-25 | Sākotnējais audits | Atzīme **6.5** |
| 2026-10-25 | H1, H3–H5, M1, M3, M7; H2/M5 partial; Storage `014` | Atzīme **8.0** |
| 2026-10-25 | H2 cutover, M2, M4–M6, M8; load-more UI | Atzīme **8.7** |
