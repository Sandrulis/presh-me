import { NextResponse } from "next/server";
import {
  clearAuthFailures,
  clientKeyFromRequest,
  rateLimit,
  readAuthLockout,
  recordAuthFailure,
} from "@/app/lib/security/rate-limit";
import { createClient } from "@/app/lib/supabase/server";

type Body = {
  action?: "check" | "fail" | "clear";
  email?: string;
};

export async function POST(request: Request) {
  const ipLimit = rateLimit(clientKeyFromRequest(request, "auth-lockout"), 60, 60_000);
  if (!ipLimit.ok) {
    return NextResponse.json(
      { ok: false, retryAfterSec: ipLimit.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSec) } },
    );
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  const action = body?.action;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!action || !email || !email.includes("@")) {
    return NextResponse.json({ ok: false, message: "Bad request" }, { status: 400 });
  }

  if (action === "check") {
    const lock = await readAuthLockout(email);
    if (!lock.ok) {
      return NextResponse.json({ ok: false, retryAfterSec: lock.retryAfterSec });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "fail") {
    await recordAuthFailure(email);
    const lock = await readAuthLockout(email);
    if (!lock.ok) {
      return NextResponse.json({ ok: false, retryAfterSec: lock.retryAfterSec });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "clear") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email || user.email.trim().toLowerCase() !== email) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }
    await clearAuthFailures(email);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, message: "Bad request" }, { status: 400 });
}
