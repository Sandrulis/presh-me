# Sistēmas drošības uzlabojumi — presh-me

**Pašreizējā atzīme:** **8.8 / 10**  
**Iepriekšējā (2026-11-03 audits):** 8.6 / 10  
**Sākotnējā (pirms visa cikla):** 6.0 / 10  
**Audits / pārbaude:** 2026-11-03 (atkārtots pēc S1–S3 izpildes)

Statuss: `[x]` izdarīts · `[~]` daļēji · `[ ]` vēl

**Atzīmes pamatojums (8.8):** S1–S3 aizvērti; booking ar Turnstile (kad integrācija ieslēgta), DB garumu CHECK, servera handle/blockId validācija. Pamatkontroles nemainītas. **Līdz 9.0:** Vault, CSP bez `'unsafe-inline'`, ārējs pentest, S4 (distribūts rate limit).

**Legacy:** vecie `data:image/…` jsonb līdz pārglabāšanai studijā.

---

## Atkārtotā pārbaude (2026-11-03, pēc S1–S3)

### Izpildīts

| ID | Risinājums | Faili |
|---|---|---|
| **S1** | `requireTurnstileToken` uz `/api/booking/request`; UI widget + token POST; ja Turnstile izslēgts — nav papildu prasības | `booking/request/route.ts`, `page-booking-ui.tsx`, `turnstile.ts` |
| **S2** | DB `CHECK`: `guest_email` ≤ 254, `comment` ≤ 2000, `block_id` ≤ 64 | `025_booking_reservations_length_checks.sql` |
| **S3** | `isValidBookingHandle` / `isValidBookingBlockId` (handle regex, blockId ≤64 `[a-zA-Z0-9_-]`) | `booking-input-limits.ts`, request/reservations/submit/load |

### Verifikācija

- Migrācija **025** — applied  
- `npm run i18n:check`, `typecheck`, `build` — OK  

### Atlikušais (nav S1–S3)

| ID | Piezīme |
|---|---|
| **S4** | In-memory rate limit vairākās instancēs — accepted |
| **9.0** | Vault, mature CSP, pentest |

---

## Padziļinātā pārbaude (2026-11-03, sākotnējā)

### Kas joprojām labi

| Joma | Secinājums |
|---|---|
| DB RLS | Core tabulas + `user_subscriptions` + `page_booking_reservations` deny |
| Admin / auth | H1–H5, M1–M10 (skatīt zemāk) |
| Booking | Rate limit, slot UNIQUE, HTML escape, service role tikai serverī, **+ S1–S3** |
| Billing / Umami | Sesija, Stripe paraksts, page owner check |

### Sākotnējie riski S1–S3 — `[x]`

---

## Kopsavilkums (milestones)

| Lai sasniegtu | Statuss |
|---|---|
| **7.0** (H1, H3, H4) | **done** |
| **8.0** (+ H5, M1, M2) | **done** |
| **8.5** (+ M3/M4/H2) | **done** |
| **8.7** (2026-10-25) | **done** |
| **8.8** | **S1–S3 done** |
| **9.0** | Vault, CSP nonce, pentest |

---

## Kas jau ir labi (neatkārtot)

| Kontrole | Kur | Statuss |
|---|---|---|
| RLS | `001`–`003`, `021`, `024` | done |
| Privilege escalate trigger | `013` | done |
| Google OAuth + Turnstile auth | `google-oauth`, `turnstile` | done |
| CSP / HSTS | `next.config.ts` | done |
| Integration secrets encrypt | `enc:v1:` | done |
| SSRF source-preview | route + limits | done |
| Booking Turnstile | `booking/request` + UI | **done (S1)** |
| Booking DB length CHECK | `025` | **done (S2)** |
| Booking input limits | `booking-input-limits.ts` | **done (S3)** |

---

## HIGH / MIDDLE (historical)

H1–H5, M1–M10 — **done** (2026-10-25). S1–S3 — **done** (2026-11-03).

---

## Atzīmes skala

| Balles | Nozīme |
|---|---|
| **8.6** | Booking bez Turnstile (2026-11-03 audits) |
| **8.8** | **Pašreiz** — S1–S3 |
| 9.0 | Vault, CSP nonce, pentest |

---

## Kā pārbaudīt

1. Turnstile ieslēgts: booking bez token → `auth.turnstile.required`; ar token → OK.
2. Turnstile izslēgts: booking bez token joprojām strādā.
3. `comment` > 2000 vai nederīgs `blockId` → 400 / DB reject.
4. Anon nevar tieši rakstīt `page_booking_reservations`.
5. `npm run typecheck` / `npm run build`.

---

## Izpildes žurnāls

| Datums | Kas izdarīts | Piezīmes |
|---|---|---|
| 2026-10-25 | Sākotnējais audits | **6.0** |
| 2026-10-25 | H1–H5, M1–M2, M5–M10; `013`, `014` | **8.2** |
| 2026-10-25 | Lockouts, CSP, Storage UI | **8.7** |
| 2026-11-03 | Padziļināts audits; backlog S1–S3 | **8.6** |
| 2026-11-03 | S1–S3 + migrācija `025` | **8.8** |
