# Sistēmas drošības uzlabojumi — presh-me

**Pašreizējā atzīme:** **8.7 / 10**  
**Iepriekšējā (pirms šīs izpildes):** 8.2 / 10  
**Sākotnējā (pirms visa cikla):** 6.0 / 10  
**Pēdējā pārbaude:** 2026-10-25 (atkārtotais audits pēc ieteikumu izpildes)

**Atlikušais līdz 9.0:** Vault (ne tikai `INTEGRATION_SECRETS_KEY`), mature CSP bez `'unsafe-inline'` kur iespējams, ārējs pentests.  
**Legacy:** vecie `data:image/…` jsonb ieraksti līdz lietotājs pārglabā attēlu studijā.

Šis fails ir uzskaites saraksts. Statuss: `pending` / `done` / `accepted` / `partial`.

---

## Kopsavilkums

Pēc 2026-10-25 otrās viļņa izpildes aizvērti DB lockouts (M3), Storage cutover jaunajiem uploadiem (H2/L4), CSP enforce (M9), log scrub (L2) un PITR dokumentācija (L3). MFA jau bija done.

| Lai sasniegtu | Statuss |
|---|---|
| **7.0** (H1, H3, H4) | **done** |
| **8.0** (+ H5, M1, M2) | **done** |
| **8.5** (+ M3/M4/H2) | **done** |
| **9.0** | Vault, CSP bez unsafe-inline, pentest |

---

## Kas jau ir labi (neatkārtot)

| Kontrole | Kur | Statuss |
|---|---|---|
| RLS uz `users` / `pages` / feedback / site_* | `001`–`003` | done |
| Pirmais reģistrētais = admin | `users_assign_first_admin` | done |
| `SECURITY DEFINER` + `search_path = ''` | galvenās fn | done |
| Google OAuth CSRF + `verified_email` | `google-oauth.ts` | done |
| Turnstile server verify | `turnstile.ts` | done |
| `/api/admin/users` `requireAdmin()` | route | done |
| Paroles caur Supabase Auth | email-password | done |
| Umami tikai pēc cookie consent | `UmamiAnalytics` | done |
| `safeHref` bloķē ne-http(s) | `urls.ts` | done |

---

## HIGH

### H1. `is_admin` escalate — **done**

- Trigger `users_protect_privileged_columns` (`013_security_hardening.sql`).

### H2. Attēli jsonb / data URL — **done** (jaunie uploadi)

- Bucket `page-assets` + RLS (`014`); `processAndUploadImage` → studija / onboarding / bloki / branding (raster).
- Feedback: SVG noraidīts, MIME/size limits.
- Legacy data URL līdz pārglabāšanai; SVG/ICO branding joprojām data URL (bucket neatbalsta).

### H3. Security headers — **done**

- `next.config.ts`: frame, nosniff, Referrer-Policy, Permissions-Policy, HSTS.

### H4. Integration secrets UI — **done**

- `enc:v1:` + `INTEGRATION_SECRETS_KEY`; klients redz tikai `hasSecret`.

### H5. `/api/source-preview` — **done**

- Sesija, rate limit, metadata denylist, redirect host check.

---

## MIDDLE

### M1. GitHub security CI — **done**

### M2. Admin server gate — **done**

### M3. Rate limit / lockout — **done**

- In-memory throttle + DB `auth_lockouts` / `rate_limit_buckets` (`015`).
- Login: `/api/auth/lockout` check → fail → clear (tikai autentificētai sesijai).

### M4. MFA + audit — **done**

### M5. Middleware protected paths — **done**

### M6. Feedback/contact sanitizācija — **done**

### M7. Google e-pasta sasaistīšana — **accepted**

### M8. Service role virsma — **done**

### M9. CSP / trešās puses — **done**

- `Content-Security-Policy` enforce `next.config.ts` (self + Supabase + Turnstile + Umami + embed frames).
- Joprojām `'unsafe-inline'` script/style Next.js dēļ — līdz 9.0 ar nonce/hash.

### M10. Publiskās lapas XSS URL — **done**

---

## LOW

| ID | Statuss | Piezīme |
|---|---|---|
| L1 Permissions-Policy | done | H3 |
| L2 Log scrubbing | done | `safeLogError` / `scrubLogMessage` |
| L3 Backup / PITR docs | done | DEVELOPER.md |
| L4 Branding SVG | done | raster → Storage; SVG/ICO data URL |
| L5 Cookie + Umami | done | |
| L6 revoke `is_system_admin` anon | done | `013` |

---

## Atzīmes skala

| Balles | Nozīme |
|---|---|
| 5–6 | RLS ir, escalate / secrets / headers vāji |
| **7.0** | H1 + headers + secrets nav klientā |
| **8.0** | + SSRF/rate + CI + server admin |
| **8.5** | + encrypt + MFA/audit + Storage cutover + lockouts |
| 9.0 | Vault, mature CSP, pentest |
| 10 | Formāla programma + ārējs audits |

**Šobrīd 8.7:** 8.5 kritēriji izpildīti; CSP enforce + lockouts + Storage UI; līdz 9.0 trūkst Vault / nonce CSP / pentest.

---

## Izpildes žurnāls

| Datums | Kas izdarīts | Piezīmes |
|---|---|---|
| 2026-10-25 | Sākotnējais audits | Atzīme **6.0** |
| 2026-10-25 | H1–H5, M1–M2, M5–M6, M8, M10, L1/L6; M3/M4/H2/M9 partial; `013`, `014` | Atzīme **8.2** |
| 2026-10-25 | M3 lockouts (`015`), H2 Storage UI cutover, M9 CSP enforce, L2/L3; MFA jau bija | Atzīme **8.7** |
