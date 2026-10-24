import { NextResponse } from "next/server";
import { clientKeyFromRequest, rateLimit } from "@/app/lib/security/rate-limit";
import { requireTurnstileToken } from "@/app/lib/security/turnstile";

export async function POST(request: Request) {
  const limited = rateLimit(clientKeyFromRequest(request, "turnstile"), 40, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, message: "Pārāk daudz pieprasījumu." }, { status: 429 });
  }
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || undefined;
  const result = await requireTurnstileToken(body?.token, ip);
  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
