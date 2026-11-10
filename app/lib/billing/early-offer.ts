export type EarlyOffer = {
  users: number;
  months: number;
  claimed: number;
  extendable: boolean;
  note: string;
};

export function openEarlyOffer(input: {
  enabled: boolean;
  users: number;
  months: number;
  claimed: number;
  extendable: boolean;
  note: string;
}): EarlyOffer | null {
  if (!input.enabled) return null;
  const users = Math.floor(input.users);
  const months = Math.floor(input.months);
  const claimed = Math.max(0, Math.floor(input.claimed));
  if (users <= 0 || months <= 0 || claimed >= users) return null;
  return {
    users,
    months,
    claimed,
    extendable: input.extendable,
    note: input.note.trim(),
  };
}

export function trialEndUnixAfterMonths(months: number, nowMs = Date.now()) {
  const end = new Date(nowMs);
  end.setUTCMonth(end.getUTCMonth() + months);
  return Math.floor(end.getTime() / 1000);
}
