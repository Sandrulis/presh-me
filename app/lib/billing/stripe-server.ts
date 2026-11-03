import Stripe from "stripe";
import { decryptSecret } from "@/app/lib/security/secrets";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export type StripeCredentials = {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
};

function looksLikePublishableKey(value: string) {
  return /^pk_(test|live)_/.test(value.trim());
}

function looksLikeSecretKey(value: string) {
  return /^sk_(test|live)_/.test(value.trim());
}

export async function isStripeIntegrationReady(): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_integrations")
    .select("client_id, client_secret, is_enabled, is_configured, configured_account_email")
    .eq("integration_key", "stripe")
    .maybeSingle();
  if (!data?.is_enabled || !data.is_configured) return false;
  const clientId = (data.client_id as string) ?? "";
  if (!looksLikePublishableKey(clientId)) return false;
  const stored = (data.client_secret as string) ?? "";
  if (!stored.trim()) return false;
  try {
    const secret = decryptSecret(stored);
    return looksLikeSecretKey(secret);
  } catch {
    return looksLikeSecretKey(stored);
  }
}

export async function getStripeCredentials(): Promise<StripeCredentials | null> {
  if (!(await isStripeIntegrationReady())) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("site_integrations")
    .select("client_id, client_secret, configured_account_email")
    .eq("integration_key", "stripe")
    .maybeSingle();
  if (!data) return null;
  const publishableKey = (data.client_id as string).trim();
  const stored = (data.client_secret as string) ?? "";
  let secretKey = "";
  try {
    secretKey = decryptSecret(stored).trim();
  } catch {
    secretKey = stored.trim();
  }
  if (!looksLikePublishableKey(publishableKey) || !looksLikeSecretKey(secretKey)) return null;
  const fromEnv = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const fromIntegration = ((data.configured_account_email as string) ?? "").trim();
  const webhookSecret = fromEnv || fromIntegration;
  return { publishableKey, secretKey, webhookSecret };
}

export async function getStripeClient(): Promise<Stripe | null> {
  const credentials = await getStripeCredentials();
  if (!credentials) return null;
  return new Stripe(credentials.secretKey);
}

export async function getStripeWebhookSecret(): Promise<string | null> {
  const credentials = await getStripeCredentials();
  if (!credentials?.webhookSecret) return null;
  return credentials.webhookSecret;
}
