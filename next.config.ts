import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";

function supabaseHostname(): string | null {
  try {
    return SUPABASE_URL ? new URL(SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
}

const supabaseHost = supabaseHostname();
const isProduction = process.env.NODE_ENV === "production";

/** Enforce CSP; React/Next dev needs `unsafe-eval` (not used in production builds). */
function buildContentSecurityPolicy(): string {
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    ...(isProduction ? [] : ["'unsafe-eval'"]),
    "https://challenges.cloudflare.com",
    "https://*.umami.is",
    "https://cloud.umami.is",
  ].join(" ");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' https: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSrc}`,
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://*.umami.is https://cloud.umami.is",
    "frame-src 'self' https://challenges.cloudflare.com https://open.spotify.com https://www.youtube.com https://www.youtube-nocookie.com",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/link-in-bio", destination: "/", permanent: true },
      { source: "/:locale(en|lv|de|fr|es|nl|da|no|fi|pl|lt|et|it|sv|ru)/link-in-bio", destination: "/:locale", permanent: true },
    ];
  },
  turbopack: {
    root: projectRoot,
  },
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https" as const,
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
          ...(SITE_URL.startsWith("https://")
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
      {
        source: "/",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" }],
      },
      {
        source: "/(terms|privacy|cookies)",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=600" }],
      },
    ];
  },
};

export default nextConfig;
