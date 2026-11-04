import type { Metadata } from "next";
import { AuthProvider } from "@/app/components/auth-provider";
import { CookieConsentProvider } from "@/app/components/cookie-consent-provider";
import { NotificationFavicon } from "@/app/components/notification-favicon";
import { SiteAlertsBridge } from "@/app/components/site-alerts-bridge";
import { SiteAdminStoreHydrator } from "@/app/components/site-admin-store-hydrator";
import { SiteBrandingProvider } from "@/app/components/site-branding-provider";
import { buildSiteBrandingContext } from "@/app/lib/site-admin/site-branding-context";
import { TranslationsProvider } from "@/app/components/translations-provider";
import { UmamiAnalytics } from "@/app/components/umami-analytics";
import { getCachedSiteBranding, getCachedUmamiPublicConfig, getCachedMaintenanceMode } from "@/app/lib/site-admin/settings-cache";
import { fontClassName, fontVariables } from "@/app/lib/font-faces";
import { getServerTranslations } from "@/app/lib/i18n/server";
import {
  BRAND_ICON_PATH,
  BRAND_LOGO_PATH,
  BRAND_NOTIFICATION_ICON_PATH,
  brandAssetUrl,
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
  const iconPath = brandAssetUrl(BRAND_ICON_PATH, branding.updatedAt);
  const logoPath = brandAssetUrl(BRAND_LOGO_PATH, branding.updatedAt);
  return {
    metadataBase: new URL(base),
    title: {
      default: name,
      template: `%s · ${name}`,
    },
    description,
    icons: {
      icon: iconPath,
      apple: branding.logoUrl ? logoPath : iconPath,
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
  const maintenanceActive = await getCachedMaintenanceMode();
  const brandingContext = buildSiteBrandingContext({
    systemName: branding.systemName,
    logoUrl: branding.logoUrl,
    faviconUrl: branding.faviconUrl,
    updatedAt: branding.updatedAt,
  });
  const defaultIcon = brandAssetUrl(BRAND_ICON_PATH, branding.updatedAt);
  const notificationIcon = branding.notificationFaviconUrl
    ? brandAssetUrl(BRAND_NOTIFICATION_ICON_PATH, branding.updatedAt)
    : null;

  return (
    <html lang={i18n.languageCode} className={`${fontVariables} ${fontClassName}`}>
      <body>
        <SiteBrandingProvider branding={brandingContext}>
          <SiteAdminStoreHydrator />
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
                <NotificationFavicon defaultIcon={defaultIcon} notificationIcon={notificationIcon} />
                {umami ? <UmamiAnalytics {...umami} /> : null}
                <MaintenanceShell active={maintenanceActive} sessionHint={sessionHint}>
                  {children}
                </MaintenanceShell>
              </CookieConsentProvider>
            </AuthProvider>
          </TranslationsProvider>
        </SiteBrandingProvider>
      </body>
    </html>
  );
}
