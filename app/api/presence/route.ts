import { NextResponse } from "next/server";
import { clientIpFromHeaders, resolveCountryCode } from "@/app/lib/request-geo";
import { clientKeyFromRequest, rateLimit } from "@/app/lib/security/rate-limit";
import { createClient } from "@/app/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const limited = rateLimit(clientKeyFromRequest(request, `presence:${user.id}`), 12, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: true, throttled: true });
  }

  const ip = clientIpFromHeaders(request.headers);
  const country = await resolveCountryCode(request.headers, ip);

  const { error } = await supabase.rpc("touch_user_presence", {
    p_ip: ip,
    p_country: country,
  });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ip, country });
}
