import type { Metadata } from "next";
import type { LanguageCode } from "@/app/lib/i18n/language";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { hreflangAlternatesForLocale } from "@/app/lib/seo/hreflang";
import { absoluteLocaleUrl, DEFAULT_SEO_LOCALE } from "@/app/lib/seo/locale-path";
import { siteOgImageUrl } from "@/app/lib/site-url";

export type IntentMetadataInput = {
  path: string;
  title: string;
  description: string;
  locale?: LanguageCode;
};

export async function buildIntentPageMetadata(
  input: Omit<IntentMetadataInput, "locale">,
): Promise<Metadata> {
  const { languageCode } = await getServerTranslations();
  return intentMetadata({ ...input, locale: languageCode });
}

/** `path` is canonical (English) app route; public canonical URL uses localized slugs per locale. */
export async function intentMetadata(input: {
  path: string;
  title: string;
  description: string;
  locale?: LanguageCode;
}): Promise<Metadata> {
  const locale = input.locale ?? DEFAULT_SEO_LOCALE;
  const url = absoluteLocaleUrl(locale, input.path);
  const alternates = await hreflangAlternatesForLocale(locale, input.path);
  const ogImage = siteOgImageUrl();
  return {
    title: { absolute: `${input.title} · Presh.Me` },
    description: input.description,
    alternates,
    openGraph: {
      title: `${input.title} · Presh.Me`,
      description: input.description,
      url,
      type: "website",
      siteName: "Presh.Me",
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} · Presh.Me`,
      description: input.description,
      images: [ogImage],
    },
  };
}
