# Presh.Me SEO wave 2 — headings, locales, content (2026-10-25)

Production origin: `https://presh.me`. Lighthouse mobile scores were **not** measured in this environment (no Chrome Lighthouse run); verify after deploy.

Git commits: this OneDrive workspace has **no `.git`** — commit from the real repo checkout.

---

## Confirmed fixes

| Area | Result |
|---|---|
| ~50 `<h1>` on homepage | **Fixed** — `PageView` preview uses `<p>` for the name; live profiles keep `<h1>`. Smoke: home `h1` count = **1** |
| Marquee DOM | Limited to **9** demos; clones `aria-hidden` + `inert` |
| Avatar alt | Meaningful `alt={name}` when name present |
| Title / meta | `seo.home.title/description/h1` — EN/LV/RU match brief; keyword “link in bio” |
| Locales | Middleware rewrite `/{locale}` → unprefixed routes; `html lang` + self-canonical verified for `/`, `/lv`, `/ru`, `/de` |
| Indexing policy | Completeness on `LANDING_SEO_KEYS`; incomplete → `noindex` + UI banner; excluded from hreflang/sitemap |
| FAQ | Free? / concrete Umami metrics / contact link to `/contact`; JSON-LD from same keys |
| Brand | Legal meta → **Presh.Me**; Organization logo → `https://presh.me/marketing/org-logo.svg` |
| Studio visual | `/marketing/studio-preview.svg` (lazy, sized); not a live product screenshot — backlog: capture real studio WebP |
| Footer / CTA / Examples | Column footer; final claim CTA; header Examples |
| Sitemap | Per indexable locale × marketing paths + profiles; alternates.languages |

## Locale completeness (landing SEO keys)

| locale | translated % | indexable | notes |
|---|---:|---|---|
| en | 100 | yes | Source |
| lv | 100 | yes | Native |
| ru | 100 | yes | Native/draft reviewed for SEO keys |
| de | 100 | yes | **Needs native review** |
| fr | 100 | yes | **Needs native review** |
| es | 100 | yes | **Needs native review** |
| nl, da, no, fi, pl, lt, et, it, sv | &lt;100 or drafts | often no | Many keys still EN copies → noindex until unique |

*Runtime sitemap (local prod) included locale homes: `/de`, `/es`, `/fr`, `/lv`, `/ru` (+ `/` for en).*

## Commands

| Command | Result |
|---|---|
| `npm run i18n:check` | Pass |
| `npm run typecheck` | Pass |
| `npm run build` (prod + site URL) | Pass |
| `npm run seo:smoke` | Pass (after sitemap assertion update) |
| `npm run lint` | Pre-existing studio errors remain |
| Production curl | No localhost canonical; no HMR; 1× h1; titles OK |

## Changed files (high level)

- `app/components/page-view.tsx`, `demo-marquee.tsx`
- `app/components/marketing-home.tsx`, `header.tsx`, `site-footer.tsx`, `locale-links.tsx`, `language-switcher.tsx`, `landing-faq.tsx`
- `app/lib/seo/*` (landing-keys, locale-path, locale-completeness, hreflang, home-metadata)
- `middleware.ts`, `app/page.tsx`, `app/sitemap.ts`, `app/link-in-bio/page.tsx`
- `app/lib/handles.ts`, `app/lib/landing-faq-items.ts`, `app/lib/i18n/messages.ts`, `_catalog/*`
- `public/marketing/studio-preview.svg`, `public/marketing/org-logo.svg`
- Removed static `app/lv`, `app/ru`, `app/en` (middleware rewrite)

## Manual test checklist

1. `/` View Source: one `<h1>`, title contains “link in bio”, canonical `https://presh.me`
2. `/lv`, `/ru`: 200, correct `lang`, localized title, self-canonical, hreflang set
3. Language menu items are `<a href="/lv">` (etc.) on marketing; footer Languages column crawlable
4. Incomplete locale (if any): banner + `noindex`, absent from sitemap
5. FAQ “Is Presh.Me free?” visible; analytics answer matches Umami-only claims; Contact link works
6. Studio section shows SVG with descriptive alt; Organization JSON-LD logo absolute
7. `/sitemap.xml` lists locale variants; `/robots.txt` excludes studio/admin/login
8. Demo cards: no extra h1; screen reader sees one page title

## Prioritized backlog

1. **Native review** of DE/FR/ES (and other) SEO strings; promote remaining locales only after 100% unique landing keys  
2. **Real studio screenshot** (WebP/AVIF) from production UI; optional per-locale crops  
3. **Lighthouse mobile** on deploy (Performance / SEO / A11y / BP) + cut marquee image preloads further  
4. Soft-404 policy for missing handles; GSC sitemap submit  
5. Per-link click analytics only after product exists — keep FAQ honest  

## Intentionally not claimed

- Google indexing / rankings / Search Console configured  
- Lighthouse ≥90  
- Live Stripe Pro / Linktree import / invented ratings  
