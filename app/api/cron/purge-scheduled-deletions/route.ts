import { NextResponse } from "next/server";
import { purgeDueAccountDeletions } from "@/app/lib/account/deletion-server";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization")?.trim() ?? "";
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await purgeDueAccountDeletions();
  return NextResponse.json({ ok: true, ...result });
}
