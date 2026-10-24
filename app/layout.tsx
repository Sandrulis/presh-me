import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AuthProvider } from "@/app/components/auth-provider";
import { CookieConsentProvider } from "@/app/components/cookie-consent-provider";
import { NotificationFavicon } from "@/app/components/notification-favicon";
import { SiteAlertsBridge } from "@/app/components/site-alerts-bridge";
import { TranslationsProvider } from "@/app/components/translations-provider";
import { UmamiAnalytics } from "@/app/components/umami-analytics";
import { SESSION_HINT_COOKIE } from "@/app/lib/auth/session-hint";
import { fontClassName, fontVariables } from "@/app/lib/font-faces";
import { getServerTranslations } from "@/app/lib/i18n/server";
import {
  BRAND_ICON_PATH,
  BRAND_LOGO_PATH,
  BRAND_NOTIFICATION_ICON_PATH,
} from "@/app/lib/site-admin/branding";
import { getCachedSiteBranding, getCachedUmamiPublicConfig } from "@/app/lib/site-admin/settings-cache";
import { getPublicSiteUrl } from "@/app/lib/site-url";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getCachedSiteBranding();
  const { t, languageCode } = await getServerTranslations();
  const name = branding.systemName || "Presh.Me";
  const description = t(
    "site.meta.description",
    "Create a link-in-bio page, portfolio, or digital business card on Presh.Me — one link for everything you share.",
  );
  const base = getPublicSiteUrl();
  return {
    metadataBase: new URL(base),
    title: {
      default: name,
      template: `%s · ${name}`,
    },
    description,
    icons: {
      icon: BRAND_ICON_PATH,
      apple: branding.logoUrl ? BRAND_LOGO_PATH : BRAND_ICON_PATH,
    },
    openGraph: {
      type: "website",
      siteName: name,
      locale: languageCode,
      title: name,
      description,
      url: base,
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const branding = await getCachedSiteBranding();
  const i18n = await getServerTranslations();
  const umami = await getCachedUmamiPublicConfig();
  const cookieStore = await cookies();
  const sessionHint = cookieStore.get(SESSION_HINT_COOKIE)?.value === "1";

  return (
    <html lang={i18n.languageCode} className={`${fontVariables} ${fontClassName}`}>
      <body>
        <TranslationsProvider
          languageCode={i18n.languageCode}
          overlay={i18n.overlay}
          table={i18n.table}
          languages={i18n.languages}
        >
          <AuthProvider sessionHint={sessionHint}>
            <CookieConsentProvider>
              <SiteAlertsBridge />
              <NotificationFavicon
                defaultIcon={BRAND_ICON_PATH}
                notificationIcon={
                  branding.notificationFaviconUrl ? BRAND_NOTIFICATION_ICON_PATH : null
                }
              />
              {umami ? <UmamiAnalytics {...umami} /> : null}
              {children}
            </CookieConsentProvider>
          </AuthProvider>
        </TranslationsProvider>
      </body>
    </html>
  );
}
