export type UmamiRange = "24h" | "7d" | "30d" | "90d";

export type UmamiMetric = { label: string; value: number };

export type UmamiPoint = { at: string; pageviews: number; sessions: number };

export type UmamiReport = {
  name: string;
  domain: string;
  shareUrl: string;
  active: number;
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totalTime: number;
  previous: {
    pageviews: number;
    visitors: number;
    visits: number;
    bounces: number;
    totalTime: number;
  };
  series: UmamiPoint[];
  pages: UmamiMetric[];
  referrers: UmamiMetric[];
  browsers: UmamiMetric[];
  systems: UmamiMetric[];
  devices: UmamiMetric[];
  countries: UmamiMetric[];
};

export type UmamiReportResult =
  | { ok: true; report: UmamiReport }
  | { ok: false; error: "umami.unavailable" | "umami.error.load" };

export type UmamiShareLink = {
  slug: string;
  gateway: string;
  url: string;
};

const SLUG = "([A-Za-z0-9]{6,80})";
const REGIONAL_SHARE_PATH = new RegExp(`^/analytics/(eu|us)/share/${SLUG}$`);
const SHORT_SHARE_PATH = new RegExp(`^/share/${SLUG}$`);

function gatewayFor(region: "eu" | "us") {
  if (region === "us") return "https://cloud.umami.is/analytics/us/api";
  return "https://gateway-eu.umami.is/api";
}

export function parseUmamiShareUrl(value: string): UmamiShareLink | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== "cloud.umami.is") return null;
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const regional = pathname.match(REGIONAL_SHARE_PATH);
  if (regional) {
    const region = regional[1] === "us" ? "us" : "eu";
    const slug = regional[2] ?? "";
    return {
      slug,
      gateway: gatewayFor(region),
      url: `https://cloud.umami.is/analytics/${region}/share/${slug}`,
    };
  }
  const short = pathname.match(SHORT_SHARE_PATH);
  if (!short) return null;
  const slug = short[1] ?? "";
  return {
    slug,
    gateway: gatewayFor("eu"),
    url: `https://cloud.umami.is/share/${slug}`,
  };
}
