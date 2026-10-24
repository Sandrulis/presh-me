export type SiteLanguage = {
  code: string;
  name: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
};

export type SiteTranslation = {
  key: string;
  values: Record<string, string>;
  /** True when the key ships in the code catalog (`messages.ts`). */
  bundled: boolean;
  /** True when `site_translations` has an overlay row for this key. */
  hasOverlay: boolean;
};

export type SiteDateFormat = "Y-m-d" | "d-m-Y" | "d/m/Y" | "m/d/Y" | "d.m.Y";
export type SiteDateSeparator = "." | "-" | "/" | " ";
export type SiteTimeFormat = "24" | "12";
export type WeekStartDay = "monday" | "sunday";

export type SiteSettings = {
  systemName: string;
  legalEmail: string;
  legalEntityName: string;
  legalEntityRegNo: string;
  legalEntityAddress: string;
  timezone: string;
  dateFormat: SiteDateFormat;
  dateSeparator: SiteDateSeparator;
  timeFormat: SiteTimeFormat;
  weekStartDay: WeekStartDay;
  logoUrl: string | null;
  faviconUrl: string | null;
  notificationFaviconUrl: string | null;
  updatedAt: string;
};

export type SiteAdminStore = {
  languages: SiteLanguage[];
  translations: SiteTranslation[];
  settings: SiteSettings;
};
