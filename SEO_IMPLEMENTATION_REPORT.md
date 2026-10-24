# Presh.Me — Technical SEO audit & implementation report

**Date:** 2026-10-25  
**Production origin:** `https://presh.me`  
**Scope:** Codebase audit + fixes (canonical, crawlability, locales, profiles, landings, structured data, a11y, perf foundations).

This report does **not** claim Google indexing, rankings, or Search Console setup.

---

## Confirmed issues (found in code / local production build)

| Issue | Status |
|---|---|
| Canonical / `og:url` / JSON-LD used `localhost` when `NEXT_PUBLIC_SITE_URL` pointed at local or was missing in prod | **Fixed** — `getPublicSiteUrl()` defaults to `https://presh.me` in production; rejects localhost/preview hosts in production |
| Stale `site_translations` DB overlay overrode catalog (`Presh`, “Portfolio page”, Linktree FAQ, old hero) | **Fixed** — SQL clear script + admin “Reset landing overlays”; brand **Presh.Me** in catalog |
| Snapshot `lang="en"` on all pages | **Verified + fixed** — `/` → `en`, `/lv` → `lv`, `/ru` → `ru` (production `start` smoke) |
| Dev/HMR assets in HTML snapshot | **Dev-only** — production build HTML has no `webpack-hmr` / `react-refresh`; uses `/_next/static/chunks/*` |
| Missing/weak robots + sitemap | **Fixed** — `app/robots.ts`, `app/sitemap.ts` with absolute `https://presh.me` URLs |
| Public profiles client-only / thin pages indexable | **Fixed earlier + tightened** — SSR metadata; `profileIsIndexable` requires name + substance |
| Intent landings JSON-LD `url` always `/` | **Fixed** — `IntentLanding` takes `path` |
| `twitter-image` re-exported `runtime` (build break) | **Fixed** |
| Homepage search intent too brand-only | **Improved** — product explanation + CTA + landings + pricing cards + studio section |
| Marquee duplicate cards focusable / heading misuse | **Fixed** — clone `aria-hidden` + `inert`; single H1 on marketing home |

## Potential issues (monitor / not fully proven in prod)

| Issue | Notes |
|---|---|
| DB overlays still stale on live DB until SQL/admin reset is run | Run `scripts/clear-stale-landing-overlays.sql` or Admin → Translations reset |
| Soft-200 on missing handles (`MissingHandle` claim CTA) | `noindex` set; soft-404 risk in GSC — consider `notFound()` later |
| FAQ mentions Instagram handle bootstrap | Confirm product still does this; do not claim Linktree import (removed) |
| Many demo avatar `<link rel="preload">` on homepage | Likely from marquee `PageView` images; hurts mobile LCP — backlog |
| `pl` / `lt` / `et` / `sv` catalogs had large gaps; filled from EN for studio/admin keys | SEO keys translated for primary + other langs; native review still needed for those fills |
| Lint: pre-existing errors in studio components (`studio-nav` refs, etc.) | Not introduced by SEO wave; build/typecheck pass |
| Alternate hosts (`www`) redirect | Not verified at DNS/edge — needs deploy config |
| Lighthouse ≥90 | Not run in CI; local heuristics only |

---

## What changed (high level)

### Production URL & metadata
- `app/lib/site-url.ts` — single production origin; `absoluteUrl`, OG image path helpers
- Root / home / locale / intent / profile metadata: canonical, OG, Twitter, `metadataBase`
- `app/opengraph-image.tsx` + `app/twitter-image.tsx` — 1200×630 brand OG

### Crawlability
- `app/robots.ts` — disallow studio/admin/auth/support; sitemap + host
- `app/sitemap.ts` — marketing + locales + compare/for + demos + published non-thin profiles

### Locales
- `/`, `/en`, `/lv`, `/ru` with hreflang + x-default (`app/lib/seo/hreflang.ts`)
- Middleware locale header for correct `html lang`

### Profiles
- `app/[handle]/page.tsx` — unique title/description/canonical; index only when published + enough content
- `app/lib/seo/public-page.ts` — conservative indexability

### Content
- Marketing home: clearer H1/subtitle, pricing Free beta + Pro placeholder, studio section, audience links
- `/link-in-bio`, `/portfolio-website`, `/digital-business-card`, `/personal-website`
- `/for/*` (photographers, designers, barbers, beauty, freelancers, creators, small businesses, coaches)
- `/compare/linktree`, `/compare/liinks` (honest tables, no false claims)

### Stale overlay
- `scripts/clear-stale-landing-overlays.sql`
- Admin action `resetLandingOverlaysToCatalog`

### Tests
- `npm run seo:smoke` → `scripts/seo-smoke.mjs`

---

## Commands run (results)

| Command | Result |
|---|---|
| `npm run i18n:check` | **Pass** (909 keys × languages) |
| `npm run seo:smoke` | **Pass** |
| `npm run typecheck` | **Pass** |
| `npm run lint` | **Fail** — pre-existing errors (studio-nav refs, etc.); SEO files clean except fixed unused `index` / prefer-const |
| `NODE_ENV=production NEXT_PUBLIC_SITE_URL=https://presh.me npm run build` | **Pass** |
| Production `npm run start` + curl `/`, `/lv`, `/ru`, `/robots.txt`, `/sitemap.xml` | Canonical/OG/JSON-LD = `https://presh.me`; langs correct; no localhost |

---

## Routes verified (local production)

- `/` — EN, canonical `https://presh.me`, hreflang, FAQ JSON-LD
- `/lv`, `/ru` — `lang` matches
- `/robots.txt`, `/sitemap.xml` — absolute HTTPS URLs
- Built routes include `/link-in-bio`, intent landings, `/compare/*`, `/for/*`, `/[handle]`, `/opengraph-image`

---

## Manual test checklist (deploy)

1. Set `NEXT_PUBLIC_SITE_URL=https://presh.me` on production.
2. Run stale-overlay SQL **or** Admin → reset landing overlays; hard-refresh `/`.
3. View Source on `/`: no localhost; one H1; FAQ matches visible text.
4. View Source on a **published** rich profile: unique title, self-canonical, content in HTML.
5. Unpublished / empty profile: `noindex`; not in sitemap.
6. Open `/robots.txt` and `/sitemap.xml` on live domain.
7. Share `/` in a social debugger (OG image loads).
8. Check `/lv` and `/ru` copy + `lang`.
9. Confirm `/studio`, `/login` are `noindex` and disallowed in robots.
10. Lighthouse mobile on `/` and one profile after deploy.

---

## Remaining work (needs deploy / access)

- Apply overlay clear on production DB.
- Search Console property + sitemap submit (manual).
- DNS/`www` → apex redirect if not already.
- Native translation review for `pl`/`lt`/`et`/`sv` EN backfills.
- Git commits: this workspace copy has **no `.git`** — commit/push from the real git checkout when available.

---

## Next three SEO actions (priority)

1. **Production overlay reset + GSC** — clear stale DB strings; submit `https://presh.me/sitemap.xml`; inspect home + 2–3 profiles.
2. **Homepage LCP** — stop preloading every marquee avatar; lazy-load offscreen demos; keep hero/claim above the fold lean.
3. **Missing-handle HTTP policy** — move claimable empty handles toward `404`/`410` (or soft-404 monitoring) so thin URLs do not accumulate in the index.

---

## Intentionally not claimed / not built

- Stripe live checkout, Linktree import, custom domains, click analytics product.
- Fake ratings/reviews or customer counts in JSON-LD.
- Mass doorway pages beyond the curated `/for/*` and `/compare/*` set.
- Lighthouse scores or Google ranking improvements.
