import { NextResponse } from "next/server";
import { isValidPollBlockId, isValidPollVoterKey, loadPollResults } from "@/app/lib/poll/poll-server";
import { clientKeyFromRequest, rateLimit } from "@/app/lib/security/rate-limit";

export async function GET(request: Request) {
  const limited = rateLimit(clientKeyFromRequest(request, "poll-results"), 60, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "errors.rate_limit" }, { status: 429 });
  }

  const url = new URL(request.url);
  const handle = url.searchParams.get("handle")?.trim() ?? "";
  const blockId = url.searchParams.get("blockId")?.trim() ?? "";
  const voterKey = url.searchParams.get("voterKey")?.trim() ?? "";

  if (!handle || !isValidPollBlockId(blockId)) {
    return NextResponse.json({ ok: false, error: "errors.poll_invalid" }, { status: 400 });
  }
  if (voterKey && !isValidPollVoterKey(voterKey)) {
    return NextResponse.json({ ok: false, error: "errors.poll_invalid" }, { status: 400 });
  }

  const result = await loadPollResults(handle, blockId, voterKey || undefined);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    counts: result.counts,
    total: result.total,
    votedOptionId: result.votedOptionId,
  });
}
