import { NextResponse } from "next/server";

const CACHE_CONTROL = "public, max-age=86400, s-maxage=86400";

/** Turn a stored `data:image/...` URL into a cacheable image response. */
export function dataImageResponse(dataUrl: string): NextResponse | null {
  if (!dataUrl.startsWith("data:")) return null;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;

  const meta = dataUrl.slice("data:".length, comma);
  const mime = meta.split(";")[0] || "application/octet-stream";
  const payload = dataUrl.slice(comma + 1);
  const body = meta.includes(";base64")
    ? Buffer.from(payload, "base64")
    : Buffer.from(decodeURIComponent(payload), "utf8");
  if (body.length === 0) return null;

  return new NextResponse(body, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": CACHE_CONTROL,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
