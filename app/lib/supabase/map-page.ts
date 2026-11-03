import type { Account, PageContent, Portfolio } from "@/app/lib/types";
import { normalizePageBlocks } from "@/app/lib/blocks";

export type PageRow = {
  id: string;
  account_id: string;
  handle: string;
  display_name: string;
  published: boolean;
  content: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type UserRow = {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  is_blocked?: boolean;
  week_start_day?: string | null;
  date_format?: string | null;
  date_separator?: string | null;
  time_format?: string | null;
  timezone?: string | null;
  last_seen_at?: string | null;
  last_ip?: string | null;
  last_country?: string | null;
  active_page_id: string | null;
  created_at: string;
};

const CONTENT_KEYS = [
  "bio",
  "avatarUrl",
  "headerLayout",
  "bannerUrl",
  "bannerColor",
  "bannerX",
  "bannerY",
  "bannerZoom",
  "bannerHeight",
  "bannerFade",
  "bannerFadeAmount",
  "bannerContentPlace",
  "bannerContentY",
  "bannerContentAlign",
  "avatarColor",
  "avatarRadius",
  "avatarBorder",
  "avatarBorderColor",
  "avatarX",
  "avatarY",
  "avatarZoom",
  "pageColor",
  "pageImageUrl",
  "pageImagePosition",
  "pageImageFit",
  "pageImageX",
  "pageImageY",
  "pageImageZoom",
  "nameColor",
  "nameFontId",
  "nameFontSize",
  "nameStrokeWidth",
  "nameStrokeColor",
  "tagline",
  "taglineColor",
  "taglineFontId",
  "taglineFontSize",
  "bioColor",
  "bioFontId",
  "bioFontSize",
  "socialIconSize",
  "themeId",
  "socials",
  "blocks",
  "stackOrder",
  "fontId",
  "sections",
  "gallery",
  "faqs",
  "carousel",
  "onboarding",
  "trialStartedAt",
  "shareEnabled",
  "shareAvatarSource",
  "shareAvatarUrl",
  "shareAvatarRadius",
  "shareAvatarBorder",
  "shareAvatarBorderColor",
  "shareAvatarX",
  "shareAvatarY",
  "shareAvatarZoom",
  "contactEnabled",
  "contactAvatarSource",
  "contactAvatarUrl",
  "contactAvatarX",
  "contactAvatarY",
  "contactAvatarZoom",
  "contactPhone",
  "contactEmail",
  "contactCompany",
  "umamiWebsiteId",
  "umamiShareUrl",
  "publicLanguageCode",
  "bookingEnabled",
  "bookingWorkDays",
  "bookingDayStart",
  "bookingDayEnd",
  "bookingSessionMinutes",
  "bookingHorizonDays",
  "bookingButtonText",
  "bookingButtonColor",
  "bookingButtonTextColor",
  "bookingButtonBorderRadius",
] as const;

export function rowToAccount(row: UserRow): Account {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    isAdmin: row.is_admin,
    isBlocked: row.is_blocked === true,
    weekStartDay: row.week_start_day ?? null,
    dateFormat: row.date_format ?? null,
    dateSeparator: row.date_separator ?? null,
    timeFormat: row.time_format ?? null,
    timezone: row.timezone ?? null,
    lastSeenAt: row.last_seen_at ?? null,
    lastIp: row.last_ip ?? null,
    lastCountry: row.last_country ?? null,
  };
}

export function rowToPortfolio(row: PageRow): Portfolio {
  const content = (row.content ?? {}) as Partial<PageContent>;
  return {
    id: row.id,
    accountId: row.account_id,
    handle: row.handle,
    displayName: row.display_name || content.displayName || "",
    bio: content.bio ?? "",
    avatarUrl: content.avatarUrl ?? null,
    themeId: content.themeId ?? "stamp",
    socials: Array.isArray(content.socials) ? content.socials : [],
    blocks: normalizePageBlocks(content),
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...pickContent(content),
  };
}

function pickContent(content: Partial<PageContent>): Partial<PageContent> {
  const next: Record<string, unknown> = {};
  for (const key of CONTENT_KEYS) {
    if (key === "themeId" || key === "socials" || key === "blocks" || key === "bio" || key === "avatarUrl") continue;
    if (key in content && content[key as keyof PageContent] !== undefined) {
      next[key] = content[key as keyof PageContent];
    }
  }
  return next as Partial<PageContent>;
}

export function portfolioToContent(page: Portfolio): Record<string, unknown> {
  const content: Record<string, unknown> = {};
  for (const key of CONTENT_KEYS) {
    const value = page[key as keyof Portfolio];
    if (value !== undefined) content[key] = value;
  }
  return content;
}

export function portfolioToRowPatch(page: Portfolio) {
  return {
    handle: page.handle,
    display_name: page.displayName,
    published: page.published,
    content: portfolioToContent(page),
    updated_at: page.updatedAt || new Date().toISOString(),
  };
}
