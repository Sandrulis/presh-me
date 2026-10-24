import Link from "next/link";
import type { LanguageCode } from "@/app/lib/i18n/language";
import { NATIVE_LANGUAGE_NAMES } from "@/app/lib/i18n/language";
import { localeHomePath } from "@/app/lib/seo/locale-path";

/** Crawlable language links for complete SEO locales (footer / switcher). */
export function LocaleLinks({
  locales,
  current,
  className = "flex flex-wrap gap-x-3 gap-y-1",
}: {
  locales: LanguageCode[];
  current?: LanguageCode;
  className?: string;
}) {
  return (
    <nav className={className} aria-label="Languages">
      {locales.map((code) => {
        const href = localeHomePath(code);
        const active = code === current;
        return (
          <Link
            key={code}
            href={href}
            hrefLang={code}
            className={`text-sm underline-offset-2 hover:underline ${
              active ? "font-semibold text-[var(--ink)]" : "text-[var(--muted)]"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {NATIVE_LANGUAGE_NAMES[code] ?? code}
          </Link>
        );
      })}
    </nav>
  );
}
