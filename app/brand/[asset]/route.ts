import { NextResponse } from "next/server";
import { dataImageResponse } from "@/app/lib/site-admin/brand-asset-response";
import {
  defaultBrandMarkFaviconDataUrl,
  siteHeadIconUrl,
} from "@/app/lib/site-admin/branding";
import { getServerSiteBranding } from "@/app/lib/site-admin/settings-server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ asset: string }> },
) {
  const { asset } = await context.params;
  const settings = await getServerSiteBranding();
  const defaultMark = defaultBrandMarkFaviconDataUrl();

  const dataUrl =
    asset === "icon"
      ? siteHeadIconUrl(settings.logoUrl, settings.faviconUrl)
      : asset === "logo"
        ? settings.logoUrl || defaultMark
        : asset === "notification-icon"
          ? settings.notificationFaviconUrl
          : null;

  if (!dataUrl) {
    return new NextResponse(null, { status: 404 });
  }

  if (/^https?:\/\//i.test(dataUrl)) {
    return NextResponse.redirect(dataUrl, 302);
  }

  return dataImageResponse(dataUrl) ?? new NextResponse(null, { status: 404 });
}
