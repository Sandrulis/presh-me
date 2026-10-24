import Link from "next/link";
import { CookieSettingsLink } from "@/app/components/cookie-settings-link";
import { LocaleLinks } from "@/app/components/locale-links";
import { getActiveUiLanguages, getServerTranslations } from "@/app/lib/i18n/server";
import { getIndexableSeoLocales } from "@/app/lib/seo/locale-completeness";

export async function SiteFooter() {
  const { t, languageCode } = await getServerTranslations();
  const year = new Date().getFullYear();
  const indexable = await getIndexableSeoLocales();
  const active = await getActiveUiLanguages();
  const localeCodes = indexable.length
    ? indexable
    : active.map((lang) => lang.code);

  const product = [
    { href: "/#features", label: t("landing.nav.features", "Features") },
    { href: "/#pricing", label: t("landing.nav.pricing", "Pricing") },
    { href: "/#faq", label: t("landing.nav.faq", "FAQ") },
    { href: "/portfolio-website", label: t("seo.portfolio_page.title", "Portfolio website") },
    { href: "/digital-business-card", label: t("seo.card_page.title", "Digital business card") },
  ];

  const useCases = [
    { href: "/for/photographers", label: t("landing.use.creatives", "Photographers & creatives") },
    { href: "/for/barbers", label: t("landing.use.services", "Barbers & beauty") },
    { href: "/for/freelancers", label: t("landing.use.freelance", "Freelancers") },
    { href: "/for/content-creators", label: t("landing.use.creators", "Creators") },
    { href: "/for/small-businesses", label: t("landing.use.business", "Small businesses") },
    { href: "/for/coaches", label: "Coaches" },
  ];

  return (
    <footer className="border-t border-[var(--line)] bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {t("footer.product", "Product")}
          </p>
          <ul className="mt-3 space-y-2">
            {product.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-[var(--ink)] underline-offset-2 hover:underline">
                  {item.label.replace(/\s*\|\s*Presh\.Me$/i, "")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {t("footer.use_cases", "Use cases")}
          </p>
          <ul className="mt-3 space-y-2">
            {useCases.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-[var(--ink)] underline-offset-2 hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {t("footer.languages", "Languages")}
          </p>
          <div className="mt-3">
            <LocaleLinks locales={localeCodes} current={languageCode} className="flex flex-col gap-2" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {t("footer.legal", "Legal")}
          </p>
          <nav className="mt-3 flex flex-col gap-2 text-sm" aria-label={t("legal.nav", "Legal")}>
            <Link href="/terms" className="underline-offset-2 hover:underline">
              {t("legal.nav.terms", "Terms")}
            </Link>
            <Link href="/privacy" className="underline-offset-2 hover:underline">
              {t("legal.nav.privacy", "Privacy")}
            </Link>
            <Link href="/cookies" className="underline-offset-2 hover:underline">
              {t("legal.nav.cookies", "Cookies")}
            </Link>
            <Link href="/contact" className="underline-offset-2 hover:underline">
              {t("nav.contact", "Contact")}
            </Link>
            <CookieSettingsLink variant="footer" />
          </nav>
        </div>
      </div>
      <div className="border-t border-[var(--line)]">
        <p className="mx-auto max-w-6xl px-5 py-6 text-sm text-[var(--muted)]">
          © {year} {t("app.name", "Presh.Me")}
        </p>
      </div>
    </footer>
  );
}
