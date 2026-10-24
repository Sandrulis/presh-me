import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/app/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/studio",
          "/start",
          "/settings",
          "/login",
          "/register",
          "/forgot-password",
          "/update-password",
          "/auth/",
          "/bug",
          "/suggestions",
          "/feedback",
          "/contact",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/^https?:\/\//, ""),
  };
}
