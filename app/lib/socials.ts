import type { SocialPlatform } from "@/app/lib/types";

export type SocialCatalogItem = {
  id: SocialPlatform;
  label: string;
  /** Rādīt pievienošanas režģī (populārākie). */
  popular?: boolean;
  placeholder: string;
};

export const SOCIAL_CATALOG: SocialCatalogItem[] = [
  { id: "break", label: "Jauna rinda", placeholder: "" },
  { id: "instagram", label: "Instagram", popular: true, placeholder: "Instagram lietotājvārds vai URL" },
  { id: "tiktok", label: "TikTok", popular: true, placeholder: "TikTok lietotājvārds vai URL" },
  { id: "youtube", label: "YouTube", popular: true, placeholder: "YouTube kanāls vai URL" },
  { id: "x", label: "X", popular: true, placeholder: "X lietotājvārds vai URL" },
  { id: "facebook", label: "Facebook", popular: true, placeholder: "Facebook profils vai URL" },
  { id: "linkedin", label: "LinkedIn", popular: true, placeholder: "LinkedIn profils vai URL" },
  { id: "email", label: "E-pasts", popular: true, placeholder: "vards@pasts.lv" },
  { id: "whatsapp", label: "WhatsApp", popular: true, placeholder: "Telefona nr. vai wa.me saite" },
  { id: "telegram", label: "Telegram", popular: true, placeholder: "Telegram lietotājvārds vai URL" },
  { id: "spotify", label: "Spotify", popular: true, placeholder: "Spotify profils vai URL" },
  { id: "github", label: "GitHub", popular: true, placeholder: "GitHub lietotājvārds vai URL" },
  { id: "discord", label: "Discord", popular: true, placeholder: "Discord uzaicinājuma saite" },
  { id: "pinterest", label: "Pinterest", popular: true, placeholder: "Pinterest profils vai URL" },
  { id: "threads", label: "Threads", popular: true, placeholder: "Threads lietotājvārds vai URL" },
  { id: "snapchat", label: "Snapchat", popular: true, placeholder: "Snapchat lietotājvārds" },
  { id: "behance", label: "Behance", popular: true, placeholder: "Behance profils vai URL" },
  { id: "dribbble", label: "Dribbble", popular: true, placeholder: "Dribbble profils vai URL" },
  { id: "paypal", label: "PayPal", popular: true, placeholder: "PayPal.me saite" },
  { id: "phone", label: "Telefons", popular: true, placeholder: "+371 …" },
  { id: "website", label: "Mājaslapa", popular: true, placeholder: "https://" },
];

/** @deprecated izmanto SOCIAL_CATALOG — saglabāts importiem */
export const SOCIAL_PLATFORMS = SOCIAL_CATALOG.map(({ id, label }) => ({ id, label }));

export function socialMeta(platform: SocialPlatform) {
  return SOCIAL_CATALOG.find((item) => item.id === platform) ?? { id: platform, label: platform, placeholder: "https://" };
}

export function socialDisplayName(social: { platform: SocialPlatform; label?: string }) {
  const custom = social.label?.trim();
  if (custom) return custom;
  return socialMeta(social.platform).label;
}

function clampInt(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** Viena forma visām sociālo tīklu pogām lapā. */
export function socialButtonMetrics(input: {
  socialIconSize?: number;
  socialIconRadius?: number;
  socialIconPadding?: number;
}) {
  const size = clampInt(input.socialIconSize ?? 40, 24, 72);
  const radius = clampInt(input.socialIconRadius ?? 50, 0, 50);
  const padding = clampInt(input.socialIconPadding ?? 9, 0, 16);
  const icon = Math.max(8, size - padding * 2);
  return { size, radius, padding, icon };
}
