import { NextResponse } from "next/server";
import { isValidPollBlockId, isValidPollOptionId, isValidPollVoterKey, submitPollVote } from "@/app/lib/poll/poll-server";
import { clientKeyFromRequest, rateLimit } from "@/app/lib/security/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(clientKeyFromRequest(request, "poll-vote"), 20, 60_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "errors.rate_limit" }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as {
    handle?: string;
    blockId?: string;
    optionId?: string;
    voterKey?: string;
  } | null;

  const handle = body?.handle?.trim() ?? "";
  const blockId = body?.blockId?.trim() ?? "";
  const optionId = body?.optionId?.trim() ?? "";
  const voterKey = body?.voterKey?.trim() ?? "";

  if (!handle || !isValidPollBlockId(blockId) || !isValidPollOptionId(optionId) || !isValidPollVoterKey(voterKey)) {
    return NextResponse.json({ ok: false, error: "errors.poll_invalid" }, { status: 400 });
  }

  const result = await submitPollVote({ handle, blockId, optionId, voterKey });
  if (!result.ok) {
    const status =
      result.error === "errors.poll_already_voted" ? 409 : result.error === "errors.poll_not_found" ? 404 : 400;
    return NextResponse.json({ ok: false, error: result.error }, { status });
  }

  return NextResponse.json({ ok: true });
}
