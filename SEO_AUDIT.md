# Presh.me — Technical SEO audit

**Date:** 2026-10-25  
**Stack:** Next.js 16 App Router, React 19, Supabase, cookie-based i18n (no `/en` URL prefixes yet).

## Confirmed issues (code evidence)

| Sev | Issue | Evidence | Fix | Impact |
|---|---|---|---|---|
| **P0** | Public profiles are client-fetched; crawlers see loading shell | `LocalPublicPage` (`useEffect` + `loadPublicPage`) in `app/[handle]/page.tsx` | Server-fetch published pages; SSR `PageView` | Profiles become indexable |
| **P0** | No `robots.txt` / `sitemap.xml` | Glob: zero matches | `app/robots.ts`, `app/sitemap.ts` | Discoverability |
| **P0** | Handle metadata is title-only for real users; no OG/canonical/robots | `generateMetadata` returns `{ title: handle }` | Dynamic title/desc/OG; `noindex` drafts | Sharing + indexing policy |
| **P1** | Root `description` hardcoded LV; may mismatch `html lang` | `app/layout.tsx` | Localized description via `getServerTranslations` | Language consistency |
| **P1** | Outdated signup copy (“stays in this browser”) | `landing.step1.text` EN/LV | Honest Supabase account copy | Trust / conversion |
| **P1** | Private routes lack `noindex` | login/studio/admin metadata title only | `robots: { index: false }` | Avoid indexing app chrome |
| **P1** | FAQ claims 14-day trial; Stripe checkout not implemented | FAQ q4 vs no billing code | Soften copy until billing ships | Avoid false claims |
| **P2** | 16 Google fonts on every page | `app/lib/font-faces.ts` | Preload only primary; defer rest | LCP / weight |
| **P2** | Demo marquee mounts full `PageView` many times | `demo-marquee.tsx` | Acceptable for now; cards already `<Link>` | Perf |
| **P2** | No JSON-LD | — | Organization / SoftwareApplication / FAQPage | Rich results eligibility |
| **P2** | No marketing landings (`/link-in-bio`, `/for/*`) | Only `/` + `/{handle}` | Add high-value pages selectively | Rank for intent queries |
| **P3** | No locale URL prefixes (`/lv`,`/en`) | Cookie `LANGUAGE_COOKIE` | Keep cookies; don’t invent hreflang to missing URLs | Avoid hreflang errors |
| **P3** | Soft-200 for missing handles (claim CTA) | `MissingHandle` | Keep UX; `noindex` + document GSC soft-404 risk | Product vs pure 404 |

## Production verification still needed

- GSC property + sitemap submit for `https://presh.me`
- Live crawl of a published profile (View Source has bio/links, not only skeleton)
- `NEXT_PUBLIC_SITE_URL=https://presh.me` in production
- Core Web Vitals field data after deploy

## Out of scope this pass (backlog)

- Stripe plans / trial, Linktree import, per-link click analytics, QR tool, custom domains
- Full `/lv|/ru|/en` URL migration + hreflang
- Mass `/for/*` / `/compare/*` doorway pages without unique copy
