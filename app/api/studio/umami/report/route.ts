import { NextResponse } from "next/server";
import { loadPageOwnerUmamiReport } from "@/app/lib/integrations/umami/report";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pageId = url.searchParams.get("pageId")?.trim() ?? "";
  const range = url.searchParams.get("range")?.trim() ?? "7d";
  const timezone = url.searchParams.get("timezone")?.trim() ?? "Europe/Riga";

  if (!pageId) {
    return NextResponse.json({ ok: false, error: "umami.error.load" }, { status: 400 });
  }

  const result = await loadPageOwnerUmamiReport(pageId, range, timezone);
  if (!result.ok) {
    return NextResponse.json(result, { status: result.error === "umami.unavailable" ? 404 : 502 });
  }
  return NextResponse.json(result);
}
