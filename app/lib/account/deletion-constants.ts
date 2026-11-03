export const ACCOUNT_DELETION_GRACE_DAYS = 30;
export const ACCOUNT_DELETION_CONFIRM_TOKEN_HOURS = 48;

export function accountDeletionPurgeAtFromNow(now = new Date()): string {
  const purge = new Date(now.getTime());
  purge.setUTCDate(purge.getUTCDate() + ACCOUNT_DELETION_GRACE_DAYS);
  return purge.toISOString();
}

export function accountDeletionTokenExpiresAtFromNow(now = new Date()): string {
  const expires = new Date(now.getTime());
  expires.setUTCHours(expires.getUTCHours() + ACCOUNT_DELETION_CONFIRM_TOKEN_HOURS);
  return expires.toISOString();
}
