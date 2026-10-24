import type { Metadata } from "next";
import type { LanguageCode } from "@/app/lib/i18n/language";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getLocaleSeoStatus } from "@/app/lib/seo/locale-completeness";
import { hreflangAlternatesForLocale, openGraphLocales } from "@/app/lib/seo/hreflang";
import { absoluteLocaleUrl, localePath } from "@/app/lib/seo/locale-path";
import { siteOgImageUrl } from "@/app/lib/site-url";

export async function buildHomeMetadata(locale: LanguageCode): Promise<Metadata> {
  const { t } = await getServerTranslations(locale);
  const status = await getLocaleSeoStatus(locale);
  const title = t("seo.home.title", "Link in bio page builder | Presh.Me");
  const description = t(
    "seo.home.description",
    "Build a clean link-in-bio page with portfolio, links and contact at one address like presh.me/yourname. Free in open beta.",
  );
  const url = absoluteLocaleUrl(locale);
  const ogImage = siteOgImageUrl();
  const alternates = status.indexable
    ? await hreflangAlternatesForLocale(locale)
    : { canonical: url };
  const ogLocales = await openGraphLocales(locale);

  return {
    title: { absolute: title },
    description,
    alternates,
    robots: status.indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Presh.Me",
      locale: ogLocales.locale,
      alternateLocale: ogLocales.alternateLocale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "Presh.Me" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export async function buildIntentPageMetadata(input: {
  locale: LanguageCode;
  path: string;
  titleKey: string;
  titleFb: string;
  descKey: string;
  descFb: string;
}): Promise<Metadata> {
  const { t } = await getServerTranslations(input.locale);
  const status = await getLocaleSeoStatus(input.locale);
  const title = t(input.titleKey, input.titleFb);
  const description = t(input.descKey, input.descFb);
  const url = absoluteLocaleUrl(input.locale, input.path);
  const ogImage = siteOgImageUrl();
  const alternates = status.indexable
    ? await hreflangAlternatesForLocale(input.locale, input.path)
    : { canonical: url };
  const ogLocales = await openGraphLocales(input.locale);

  return {
    title: { absolute: title },
    description,
    alternates,
    robots: status.indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Presh.Me",
      locale: ogLocales.locale,
      alternateLocale: ogLocales.alternateLocale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "Presh.Me" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function localePathHint(locale: LanguageCode, path = "/") {
  return localePath(locale, path);
}
