import { decryptSecret } from "@/app/lib/security/secrets";
import { createAdminClient } from "@/app/lib/supabase/admin";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function plainSecret(stored: string | null | undefined): string {
  const raw = String(stored ?? "").trim();
  if (!raw) return "";
  try {
    return decryptSecret(raw);
  } catch {
    return raw;
  }
}

export async function isTurnstileEnabled(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("site_integrations")
      .select("client_id, client_secret, is_configured, is_enabled")
      .eq("integration_key", "turnstile")
      .maybeSingle();
    if (!data) return false;
    return (
      data.is_enabled === true &&
      data.is_configured === true &&
      Boolean(String(data.client_id ?? "").trim()) &&
      Boolean(plainSecret(data.client_secret))
    );
  } catch {
    return false;
  }
}

async function readTurnstileSecret(): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_integrations")
    .select("client_secret, is_configured, is_enabled")
    .eq("integration_key", "turnstile")
    .maybeSingle();
  if (!data?.is_enabled || !data?.is_configured) return null;
  const secret = plainSecret(data.client_secret);
  return secret || null;
}

export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  const secret = await readTurnstileSecret();
  if (!secret) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    if (!response.ok) return false;
    const payload = (await response.json()) as { success?: boolean };
    return payload.success === true;
  } catch {
    return false;
  }
}

export type TurnstileReject = {
  ok: false;
  message: string;
  error: "auth.turnstile.required" | "auth.turnstile.failed";
};

export async function requireTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<{ ok: true } | TurnstileReject> {
  if (!(await isTurnstileEnabled())) return { ok: true };
  const trimmed = token?.trim();
  if (!trimmed) {
    return {
      ok: false,
      message: "Apstiprini, ka neesi robots.",
      error: "auth.turnstile.required",
    };
  }
  const valid = await verifyTurnstileToken(trimmed, remoteIp);
  if (!valid) {
    return {
      ok: false,
      message: "Botu pārbaude neizdevās. Mēģini vēlreiz.",
      error: "auth.turnstile.failed",
    };
  }
  return { ok: true };
}
