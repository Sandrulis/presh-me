import type { FontId } from "@/app/lib/font-catalog";

export type { FontId };

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "x"
  | "github"
  | "email"
  | "website"
  | "facebook"
  | "whatsapp"
  | "telegram"
  | "spotify"
  | "discord"
  | "pinterest"
  | "threads"
  | "snapchat"
  | "behance"
  | "dribbble"
  | "paypal"
  | "phone";

export type SocialLink = {
  id: string;
  platform: SocialPlatform;
  url: string;
  /** Pielāgots nosaukums (ja tukšs — kataloga noklusējums). */
  label?: string;
};

export type LinkBlock = {
  id: string;
  type: "link";
  title: string;
  url: string;
  note: string;
  /** Pogas fona krāsa. */
  color?: string;
  /** px; noklusējums 8. */
  borderRadius?: number;
};

export type TextAlign = "left" | "center" | "right";

export type TextBlock = {
  id: string;
  type: "text";
  body: string;
  align?: TextAlign;
  color?: string;
  fontId?: FontId;
  fontSize?: number;
};

export type YoutubeBlock = {
  id: string;
  type: "youtube";
  url: string;
  title?: string;
  /** px; noklusējums 12. */
  borderRadius?: number;
  /** px; 0 = bez robežas. */
  borderWidth?: number;
  borderColor?: string;
};

export type ImageBlock = {
  id: string;
  type: "image";
  src: string | null;
  alt: string;
  /** px; noklusējums 12. */
  borderRadius?: number;
  /** px; 0 = bez robežas. */
  borderWidth?: number;
  borderColor?: string;
};

export type AudioBlock = {
  id: string;
  type: "audio";
  url: string;
  /** px; noklusējums 12. */
  borderRadius?: number;
  /** px; 0 = bez robežas. */
  borderWidth?: number;
  borderColor?: string;
};

export type ResumeItem = {
  id: string;
  date: string;
  title: string;
  description: string;
};

export type ResumeBlock = {
  id: string;
  type: "resume";
  heading?: string;
  items: ResumeItem[];
  /** Vertikālās līnijas krāsa. */
  lineColor?: string;
  /** Vertikālās līnijas biezums px; noklusējums 1. */
  lineWidth?: number;
  /** Apļa (numura) fona krāsa. */
  circleColor?: string;
  /** Apļa diametrs px; noklusējums 32. */
  circleSize?: number;
  /** Teksta fonts. */
  fontId?: FontId;
  /** Virsraksta fonta izmērs px; noklusējums 14. */
  fontSize?: number;
};

export type InstagramBlock = {
  id: string;
  type: "instagram";
  /** Profila @ — saitei uz Instagram (nav embed galvene). */
  username: string;
  /** Režģa kolonnas (2–4). */
  columns: 2 | 3 | 4;
  /** Cik bildes rādīt (1–12). */
  count: number;
  /**
   * Attēli režģī: Instagram `/p/CODE/media/` URL vai paša augšupielāde.
   * Profila embed netiek lietots — tikai bildes.
   */
  images: string[];
};

export type QuoteBlock = {
  id: string;
  type: "quote";
  text: string;
  author?: string;
  align?: TextAlign;
  color?: string;
  fontId?: FontId;
  fontSize?: number;
};

export type FaqBlockItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqBlock = {
  id: string;
  type: "faq";
  items: FaqBlockItem[];
  /** Kartītes fons. */
  backgroundColor?: string;
  /** px; noklusējums 8. */
  borderRadius?: number;
  questionBackground?: string;
  questionFontId?: FontId;
  questionFontSize?: number;
  answerBackground?: string;
  answerFontId?: FontId;
  answerFontSize?: number;
};

export type PageBlock =
  | LinkBlock
  | TextBlock
  | YoutubeBlock
  | ImageBlock
  | AudioBlock
  | ResumeBlock
  | InstagramBlock
  | QuoteBlock
  | FaqBlock;

export type BlockType = PageBlock["type"];

export type SectionId = "links" | "instagram" | "carousel" | "faq";

/** Secība mājaslapā: sociālie un bloki (pārējās sadaļas starp/aiz tām). */
export type StackSection = "socials" | "blocks";

export const DEFAULT_STACK_ORDER: StackSection[] = ["socials", "blocks"];

export function resolveStackOrder(page: { stackOrder?: StackSection[] }): StackSection[] {
  const raw = page.stackOrder;
  if (!raw?.length) return [...DEFAULT_STACK_ORDER];
  const seen = new Set<StackSection>();
  const next: StackSection[] = [];
  for (const id of raw) {
    if ((id === "socials" || id === "blocks") && !seen.has(id)) {
      seen.add(id);
      next.push(id);
    }
  }
  for (const id of DEFAULT_STACK_ORDER) {
    if (!seen.has(id)) next.push(id);
  }
  return next;
}

export type HeaderLayout = "center" | "banner-center" | "banner-left" | "banner-text";

export type BannerContentPlace = "beside" | "above";

export type BannerContentAlign = "left" | "center" | "right";

export type ImagePosition = "center" | "top" | "bottom" | "left" | "right";

export type ImageFit = "cover" | "contain";

export type StepId = "start" | "profile" | "sections" | "look" | "link";

export type StepMark = "open" | "done" | "skipped";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type CarouselItem = {
  id: string;
  title: string;
  note: string;
};

export type Onboarding = {
  step: number;
  finished: boolean;
  source: "instagram" | "website" | "scratch" | null;
  instagram: string;
  website: string;
  sourceNote: string;
  sections: SectionId[];
  fontId: FontId;
  marks: Record<StepId, StepMark>;
};

export type PageContent = {
  handle: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  headerLayout?: HeaderLayout;
  bannerUrl?: string | null;
  /** Fona joslas krāsa, ja nav attēla vai zem tā. */
  bannerColor?: string;
  bannerX?: number;
  bannerY?: number;
  bannerZoom?: number;
  /** Cik procentus no redzamā augstuma aizņem fons. Noklusējums 40. */
  bannerHeight?: number;
  bannerFade?: boolean;
  /** Cik procentus no fona aizņem pāreja uz lapas krāsu. 0 izslēdz. */
  bannerFadeAmount?: number;
  /** 3. izkārtojumā ikona ir blakus tekstam vai virs tā. */
  bannerContentPlace?: BannerContentPlace;
  /** 3. izkārtojumā ikonas, vārda un bio vertikālā vieta, 0–100. */
  bannerContentY?: number;
  /** 3. izkārtojumā ikonas horizontālā puse: kreisā, centrs vai labā. */
  bannerContentAlign?: BannerContentAlign;
  avatarColor?: string;
  avatarRadius?: number;
  avatarBorder?: number;
  avatarBorderColor?: string;
  avatarX?: number;
  avatarY?: number;
  avatarZoom?: number;
  pageColor?: string;
  pageImageUrl?: string | null;
  pageImagePosition?: ImagePosition;
  pageImageFit?: ImageFit;
  pageImageX?: number;
  pageImageY?: number;
  pageImageZoom?: number;
  nameColor?: string;
  nameFontId?: FontId;
  nameFontSize?: number;
  /** px; burtu apmale (teksta stroke), nevis bloka rāmis. */
  nameStrokeWidth?: number;
  nameStrokeColor?: string;
  /** Īss slogan zem vārda. */
  tagline?: string;
  taglineColor?: string;
  taglineFontId?: FontId;
  taglineFontSize?: number;
  bioColor?: string;
  bioFontId?: FontId;
  bioFontSize?: number;
  /** Sociālās ikonas aplis pikseļos. Noklusējums 40. */
  socialIconSize?: number;
  themeId: string;
  socials: SocialLink[];
  blocks: PageBlock[];
  /** Sociālo un bloku secība publiskajā lapā / priekšskatā. */
  stackOrder?: StackSection[];
  fontId?: FontId;
  sections?: SectionId[];
  gallery?: string[];
  faqs?: FaqItem[];
  carousel?: CarouselItem[];
  onboarding?: Onboarding;
  /** ISO laiks, kad sākās publiskās saites izmēģinājuma periods (module_trail). */
  trialStartedAt?: string | null;
};

export type Portfolio = PageContent & {
  id: string;
  accountId: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Account = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  /** Sistēmas administrators — labā admin josla. */
  isAdmin?: boolean;
  /** Bloķēta pieeja sistēmai (atslēga aizvērta). */
  isBlocked?: boolean;
  weekStartDay?: string | null;
  dateFormat?: string | null;
  dateSeparator?: string | null;
  timeFormat?: string | null;
  timezone?: string | null;
  /** Pēdējā aktivitāte (admin skats). */
  lastSeenAt?: string | null;
  lastIp?: string | null;
  /** ISO 3166-1 alpha-2. */
  lastCountry?: string | null;
};

export { SOCIAL_PLATFORMS } from "@/app/lib/socials";
