import { NextResponse } from "next/server";
import { purgeDueAccountDeletions } from "@/app/lib/account/deletion-server";
import { authorizeCron } from "@/app/lib/security/cron-auth";

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await purgeDueAccountDeletions();
  return NextResponse.json({ ok: true, ...result });
}
