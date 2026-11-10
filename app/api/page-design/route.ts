import { NextResponse } from "next/server";
import { designFromPage, handleFromDesignInput } from "@/app/lib/page-design";
import { userCanUseFrontendModule } from "@/app/lib/modules/user-module-access";
import { loadPageByHandle } from "@/app/lib/seo/public-page";
import { clientKeyFromRequest, rateLimit } from "@/app/lib/security/rate-limit";
import { createClient } from "@/app/lib/supabase/server";

export async function GET(request: Request) {
  const limited = rateLimit(clientKeyFromRequest(request, "page-design"), 30, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "errors.rate_limit" }, { status: 429 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const allowed = await userCanUseFrontendModule(user.id, "module_multisites");
  if (!allowed) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const handle = handleFromDesignInput(new URL(request.url).searchParams.get("handle") ?? "");
  if (!handle) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const design = await loadPublicPageDesign(handle);
  if (!design) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, design });
}

export async function loadPublicPageDesign(handle: string) {
  const page = await loadPageByHandle(handle);
  if (!page || page.published === false) return null;
  return designFromPage(page);
}
