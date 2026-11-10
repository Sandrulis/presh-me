import { isHandleFormat, normalizeHandle } from "@/app/lib/handles";
import type {
  PageBlock,
  PageContent,
  Portfolio,
  SocialPlatform,
} from "@/app/lib/types";

const STORAGE_KEY = "presh.copied-page-design.v1";

export type CopiedPageDesign = {
  handle: string;
  label: string;
  themeId: string;
  fontId: PageContent["fontId"];
  headerLayout: PageContent["headerLayout"];
  bannerColor?: string;
  bannerX?: number;
  bannerY?: number;
  bannerZoom?: number;
  bannerHeight?: number;
  bannerFade?: boolean;
  bannerFadeAmount?: number;
  bannerContentPlace?: PageContent["bannerContentPlace"];
  bannerContentY?: number;
  bannerContentAlign?: PageContent["bannerContentAlign"];
  avatarColor?: string;
  avatarRadius?: number;
  avatarBorder?: number;
  avatarBorderColor?: string;
  avatarX?: number;
  avatarY?: number;
  avatarZoom?: number;
  pageColor?: string;
  pageImagePosition?: PageContent["pageImagePosition"];
  pageImageFit?: PageContent["pageImageFit"];
  pageImageX?: number;
  pageImageY?: number;
  pageImageZoom?: number;
  nameColor?: string;
  nameFontId?: PageContent["nameFontId"];
  nameFontSize?: number;
  nameStrokeWidth?: number;
  nameStrokeColor?: string;
  taglineColor?: string;
  taglineFontId?: PageContent["taglineFontId"];
  taglineFontSize?: number;
  bioColor?: string;
  bioFontId?: PageContent["bioFontId"];
  bioFontSize?: number;
  socialIconSize?: number;
  socialIconRadius?: number;
  socialIconPadding?: number;
  stackOrder?: PageContent["stackOrder"];
  sections?: PageContent["sections"];
  shareEnabled?: boolean;
  shareAvatarRadius?: number;
  shareAvatarBorder?: number;
  shareAvatarBorderColor?: string;
  contactEnabled?: boolean;
  bookingEnabled?: boolean;
  bookingButtonColor?: string;
  bookingButtonTextColor?: string;
  bookingButtonBorderRadius?: number;
  socials: { platform: SocialPlatform; label?: string }[];
  blocks: PageBlock[];
  faqs: { question: string; answer: string }[];
  carousel: { title: string; note: string }[];
};

export function designFromPage(page: PageContent): CopiedPageDesign {
  return {
    handle: page.handle,
    label: page.displayName.trim() || page.handle,
    themeId: page.themeId,
    fontId: page.fontId,
    headerLayout: page.headerLayout,
    bannerColor: page.bannerColor,
    bannerX: page.bannerX,
    bannerY: page.bannerY,
    bannerZoom: page.bannerZoom,
    bannerHeight: page.bannerHeight,
    bannerFade: page.bannerFade,
    bannerFadeAmount: page.bannerFadeAmount,
    bannerContentPlace: page.bannerContentPlace,
    bannerContentY: page.bannerContentY,
    bannerContentAlign: page.bannerContentAlign,
    avatarColor: page.avatarColor,
    avatarRadius: page.avatarRadius,
    avatarBorder: page.avatarBorder,
    avatarBorderColor: page.avatarBorderColor,
    avatarX: page.avatarX,
    avatarY: page.avatarY,
    avatarZoom: page.avatarZoom,
    pageColor: page.pageColor,
    pageImagePosition: page.pageImagePosition,
    pageImageFit: page.pageImageFit,
    pageImageX: page.pageImageX,
    pageImageY: page.pageImageY,
    pageImageZoom: page.pageImageZoom,
    nameColor: page.nameColor,
    nameFontId: page.nameFontId,
    nameFontSize: page.nameFontSize,
    nameStrokeWidth: page.nameStrokeWidth,
    nameStrokeColor: page.nameStrokeColor,
    taglineColor: page.taglineColor,
    taglineFontId: page.taglineFontId,
    taglineFontSize: page.taglineFontSize,
    bioColor: page.bioColor,
    bioFontId: page.bioFontId,
    bioFontSize: page.bioFontSize,
    socialIconSize: page.socialIconSize,
    socialIconRadius: page.socialIconRadius,
    socialIconPadding: page.socialIconPadding,
    stackOrder: page.stackOrder,
    sections: page.sections,
    shareEnabled: page.shareEnabled,
    shareAvatarRadius: page.shareAvatarRadius,
    shareAvatarBorder: page.shareAvatarBorder,
    shareAvatarBorderColor: page.shareAvatarBorderColor,
    contactEnabled: page.contactEnabled,
    bookingEnabled: page.bookingEnabled,
    bookingButtonColor: page.bookingButtonColor,
    bookingButtonTextColor: page.bookingButtonTextColor,
    bookingButtonBorderRadius: page.bookingButtonBorderRadius,
    socials: page.socials.map((item) => ({ platform: item.platform, label: item.label })),
    blocks: page.blocks.map(stripBlock),
    faqs: (page.faqs ?? []).map(() => ({ question: "", answer: "" })),
    carousel: (page.carousel ?? []).map(() => ({ title: "", note: "" })),
  };
}

export function applyCopiedDesign(page: Portfolio, design: CopiedPageDesign): Portfolio {
  return {
    ...page,
    themeId: design.themeId,
    fontId: design.fontId,
    headerLayout: design.headerLayout,
    bannerUrl: null,
    bannerColor: design.bannerColor,
    bannerX: design.bannerX,
    bannerY: design.bannerY,
    bannerZoom: design.bannerZoom,
    bannerHeight: design.bannerHeight,
    bannerFade: design.bannerFade,
    bannerFadeAmount: design.bannerFadeAmount,
    bannerContentPlace: design.bannerContentPlace,
    bannerContentY: design.bannerContentY,
    bannerContentAlign: design.bannerContentAlign,
    avatarUrl: null,
    avatarColor: design.avatarColor,
    avatarRadius: design.avatarRadius,
    avatarBorder: design.avatarBorder,
    avatarBorderColor: design.avatarBorderColor,
    avatarX: design.avatarX,
    avatarY: design.avatarY,
    avatarZoom: design.avatarZoom,
    pageColor: design.pageColor,
    pageImageUrl: null,
    pageImagePosition: design.pageImagePosition,
    pageImageFit: design.pageImageFit,
    pageImageX: design.pageImageX,
    pageImageY: design.pageImageY,
    pageImageZoom: design.pageImageZoom,
    nameColor: design.nameColor,
    nameFontId: design.nameFontId,
    nameFontSize: design.nameFontSize,
    nameStrokeWidth: design.nameStrokeWidth,
    nameStrokeColor: design.nameStrokeColor,
    taglineColor: design.taglineColor,
    taglineFontId: design.taglineFontId,
    taglineFontSize: design.taglineFontSize,
    bioColor: design.bioColor,
    bioFontId: design.bioFontId,
    bioFontSize: design.bioFontSize,
    socialIconSize: design.socialIconSize,
    socialIconRadius: design.socialIconRadius,
    socialIconPadding: design.socialIconPadding,
    stackOrder: design.stackOrder,
    sections: design.sections,
    shareEnabled: design.shareEnabled,
    shareAvatarUrl: null,
    shareAvatarRadius: design.shareAvatarRadius,
    shareAvatarBorder: design.shareAvatarBorder,
    shareAvatarBorderColor: design.shareAvatarBorderColor,
    contactEnabled: design.contactEnabled,
    contactAvatarUrl: null,
    contactPhone: "",
    contactEmail: "",
    contactCompany: "",
    bookingEnabled: design.bookingEnabled,
    bookingButtonText: "",
    bookingButtonColor: design.bookingButtonColor,
    bookingButtonTextColor: design.bookingButtonTextColor,
    bookingButtonBorderRadius: design.bookingButtonBorderRadius,
    gallery: [],
    socials: design.socials.map((item) => ({
      id: newId(),
      platform: item.platform,
      url: "",
      label: item.label,
    })),
    blocks: design.blocks.map(reIdBlock),
    faqs: design.faqs.map((item) => ({ id: newId(), ...item })),
    carousel: design.carousel.map((item) => ({ id: newId(), ...item })),
  };
}

export function handleFromDesignInput(value: string) {
  const trimmed = value.trim();
  const fromUrl = trimmed.match(/\/([a-z0-9](?:[a-z0-9-]{1,22}[a-z0-9])?)\/?$/i);
  const raw = (fromUrl?.[1] ?? trimmed.replace(/^@/, "").replace(/^\//, "")).split(/[?#]/)[0] ?? "";
  const handle = normalizeHandle(raw);
  return isHandleFormat(handle) ? handle : null;
}

export function saveCopiedDesign(design: CopiedPageDesign) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(design));
}

export function readCopiedDesign(): CopiedPageDesign | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CopiedPageDesign;
    if (!parsed || typeof parsed.handle !== "string" || typeof parsed.themeId !== "string") return null;
    if (!Array.isArray(parsed.blocks) || !Array.isArray(parsed.socials)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function stripBlock(block: PageBlock): PageBlock {
  switch (block.type) {
    case "link":
      return { ...block, title: "", url: "", note: "" };
    case "text":
      return { ...block, body: "" };
    case "video":
      return { ...block, url: "", title: "" };
    case "image":
      return { ...block, src: null, alt: "" };
    case "audio":
      return { ...block, url: "" };
    case "maps":
      return { ...block, url: "", embedSrc: undefined, title: "" };
    case "resume":
      return {
        ...block,
        heading: "",
        items: block.items.map((item) => ({ ...item, date: "", title: "", description: "" })),
      };
    case "instagram":
      return { ...block, username: "", postUrl: "", images: [] };
    case "x":
      return { ...block, source: "" };
    case "quote":
      return { ...block, text: "", author: "" };
    case "countdown":
      return { ...block, title: "", description: "", endsAt: undefined, startsAt: undefined };
    case "skills":
      return { ...block, heading: "", items: block.items.map((item) => ({ ...item, name: "" })) };
    case "services":
      return {
        ...block,
        heading: "",
        items: block.items.map((item) => ({ ...item, name: "", description: "", price: "" })),
      };
    case "products":
      return {
        ...block,
        heading: "",
        items: block.items.map((item) => ({ ...item, name: "", description: "", imageUrl: null, price: "" })),
      };
    case "gallery":
      return {
        ...block,
        heading: "",
        items: block.items.map((item) => ({ ...item, imageUrl: null, alt: "" })),
      };
    case "poll":
      return { ...block, question: "", options: block.options.map((item) => ({ ...item, label: "" })) };
    case "faq":
      return { ...block, items: block.items.map((item) => ({ ...item, question: "", answer: "" })) };
    case "booking":
      return { ...block, buttonText: "" };
  }
}

function reIdBlock(block: PageBlock): PageBlock {
  const id = newId();
  switch (block.type) {
    case "resume":
      return { ...block, id, items: block.items.map((item) => ({ ...item, id: newId() })) };
    case "skills":
      return { ...block, id, items: block.items.map((item) => ({ ...item, id: newId() })) };
    case "services":
      return { ...block, id, items: block.items.map((item) => ({ ...item, id: newId() })) };
    case "products":
      return { ...block, id, items: block.items.map((item) => ({ ...item, id: newId() })) };
    case "gallery":
      return { ...block, id, items: block.items.map((item) => ({ ...item, id: newId() })) };
    case "poll":
      return { ...block, id, options: block.options.map((item) => ({ ...item, id: newId() })) };
    case "faq":
      return { ...block, id, items: block.items.map((item) => ({ ...item, id: newId() })) };
    default:
      return { ...block, id };
  }
}

function newId() {
  return crypto.randomUUID();
}
