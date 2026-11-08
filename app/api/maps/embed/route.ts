import { NextResponse } from "next/server";
import {
  googleMapsEmbedUrl,
  isGoogleMapsShortLink,
  resolveGoogleMapsCanonicalUrl,
  resolveGoogleMapsEmbedUrl,
} from "@/app/lib/google-maps-embed";

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url")?.trim();
  if (!url) {
    return NextResponse.json({ success: false, message: "Missing url" }, { status: 400 });
  }
  if (!/^https?:\/\//i.test(url) && !url.includes("goo.gl")) {
    return NextResponse.json({ success: false, message: "Invalid url" }, { status: 400 });
  }

  const embedUrl = await resolveGoogleMapsEmbedUrl(url);
  if (!embedUrl) {
    return NextResponse.json({ success: false, message: "Could not resolve map" }, { status: 422 });
  }

  let canonicalUrl: string | null = googleMapsEmbedUrl(url) ? url : null;
  if (!canonicalUrl && isGoogleMapsShortLink(url)) {
    canonicalUrl = await resolveGoogleMapsCanonicalUrl(url);
  }

  return NextResponse.json({
    success: true,
    embedUrl,
    canonicalUrl,
  });
}
