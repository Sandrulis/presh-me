import { NextResponse } from "next/server";
import { resolveFrontendModuleAccess } from "@/app/lib/modules/user-module-access";
import { createClient } from "@/app/lib/supabase/server";

const KEY_PATTERN = /^[a-z0-9._:-]{1,128}$/;

export async function GET(request: Request) {
  const moduleKey = new URL(request.url).searchParams.get("key")?.trim() ?? "";
  if (!KEY_PATTERN.test(moduleKey)) {
    return NextResponse.json({ error: "Invalid module key" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await resolveFrontendModuleAccess(user.id, moduleKey);
  return NextResponse.json(access);
}
