import type { Metadata } from "next";
import { AuthProvider } from "@/app/components/auth-provider";
import { CookieConsentProvider } from "@/app/components/cookie-consent-provider";
import { NotificationFavicon } from "@/app/components/notification-favicon";
import { SiteAlertsBridge } from "@/app/components/site-alerts-bridge";
import { TranslationsProvider } from "@/app/components/translations-provider";
import { UmamiAnalytics } from "@/app/components/umami-analytics";
import { getServerMaintenanceMode } from "@/app/lib/site-admin/settings-server";
import { getCachedSiteBranding, getCachedUmamiPublicConfig } from "@/app/lib/site-admin/settings-cache";
import { fontClassName, fontVariables } from "@/app/lib/font-faces";
import { getServerTranslations } from "@/app/lib/i18n/server";
import {
  BRAND_ICON_PATH,
  BRAND_LOGO_PATH,
  BRAND_NOTIFICATION_ICON_PATH,
} from "@/app/lib/site-admin/branding";
import { MaintenanceSessionGuard } from "@/app/components/maintenance-session-guard";
import { MaintenanceShell } from "@/app/components/maintenance-shell";
import { resolveSessionHintForRequest } from "@/app/lib/auth/resolve-session-hint";
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
  const { sessionHint, hideMarketingHeader } = await resolveSessionHintForRequest();
  const maintenanceActive = await getServerMaintenanceMode();

  return (
    <html lang={i18n.languageCode} className={`${fontVariables} ${fontClassName}`}>
      <body>
        <TranslationsProvider
          languageCode={i18n.languageCode}
          overlay={i18n.overlay}
          table={i18n.table}
          languages={i18n.languages}
        >
          <AuthProvider sessionHint={sessionHint} hideMarketingHeader={hideMarketingHeader}>
            <MaintenanceSessionGuard />
            <CookieConsentProvider>
              <SiteAlertsBridge />
              <NotificationFavicon
                defaultIcon={BRAND_ICON_PATH}
                notificationIcon={
                  branding.notificationFaviconUrl ? BRAND_NOTIFICATION_ICON_PATH : null
                }
              />
              {umami ? <UmamiAnalytics {...umami} /> : null}
              <MaintenanceShell active={maintenanceActive} sessionHint={sessionHint}>
                {children}
              </MaintenanceShell>
            </CookieConsentProvider>
          </AuthProvider>
        </TranslationsProvider>
      </body>
    </html>
  );
}
