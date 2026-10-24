"use client";

export type SiteIntegration = {
  key: string;
  clientId: string;
  /** Never the real secret — empty; use hasSecret for UI. */
  clientSecret: string;
  hasSecret: boolean;
  configured: boolean;
  enabled: boolean;
  configuredAccountEmail: string;
  updatedAt: string;
};

/** i18n keys — resolve with `t()` in UI. */
export type IntegrationMeta = {
  title: string;
  description: string;
  clientIdLabel: string;
  clientSecretLabel: string;
  clientIdPlaceholder?: string;
  clientSecretHint?: string;
};

/** Same keys as routine-app `SITE_INTEGRATION_KEYS`, display order. */
export const INTEGRATION_ORDER = [
  "google_oauth",
  "turnstile",
  "resend",
  "umami",
  "sentry",
  "stripe",
] as const;

export const INTEGRATION_META: Record<string, IntegrationMeta> = {
  google_oauth: {
    title: "admin.integrations.meta.google_oauth.title",
    description: "admin.integrations.meta.google_oauth.description",
    clientIdLabel: "admin.integrations.meta.client_id",
    clientSecretLabel: "admin.integrations.meta.client_secret",
    clientIdPlaceholder: "admin.integrations.meta.google_oauth.client_id_placeholder",
  },
  turnstile: {
    title: "admin.integrations.meta.turnstile.title",
    description: "admin.integrations.meta.turnstile.description",
    clientIdLabel: "admin.integrations.meta.turnstile.site_key",
    clientSecretLabel: "admin.integrations.meta.turnstile.secret_key",
  },
  resend: {
    title: "admin.integrations.meta.resend.title",
    description: "admin.integrations.meta.resend.description",
    clientIdLabel: "admin.integrations.meta.resend.from_email",
    clientSecretLabel: "admin.integrations.meta.resend.api_key",
  },
  umami: {
    title: "admin.integrations.meta.umami.title",
    description: "admin.integrations.meta.umami.description",
    clientIdLabel: "admin.integrations.meta.umami.website_id",
    clientSecretLabel: "admin.integrations.meta.umami.script_url",
    clientSecretHint: "admin.integrations.meta.umami.script_url_hint",
  },
  sentry: {
    title: "admin.integrations.meta.sentry.title",
    description: "admin.integrations.meta.sentry.description",
    clientIdLabel: "admin.integrations.meta.sentry.environment",
    clientSecretLabel: "admin.integrations.meta.sentry.dsn",
    clientIdPlaceholder: "admin.integrations.meta.sentry.environment_placeholder",
  },
  stripe: {
    title: "admin.integrations.meta.stripe.title",
    description: "admin.integrations.meta.stripe.description",
    clientIdLabel: "admin.integrations.meta.stripe.publishable_key",
    clientSecretLabel: "admin.integrations.meta.stripe.secret_key",
    clientIdPlaceholder: "admin.integrations.meta.stripe.publishable_placeholder",
  },
};

/** Used when `integration_key` has no entry in `INTEGRATION_META` (title comes from raw key in UI). */
export const INTEGRATION_META_FALLBACK: IntegrationMeta = {
  title: "admin.integrations.unknown_description",
  description: "admin.integrations.unknown_description",
  clientIdLabel: "admin.integrations.meta.client_id",
  clientSecretLabel: "admin.integrations.meta.client_secret",
};

function sortIntegrations(rows: SiteIntegration[]) {
  const order = new Map(INTEGRATION_ORDER.map((key, index) => [key, index]));
  return [...rows].sort((a, b) => {
    const ai = order.get(a.key as (typeof INTEGRATION_ORDER)[number]) ?? 999;
    const bi = order.get(b.key as (typeof INTEGRATION_ORDER)[number]) ?? 999;
    if (ai !== bi) return ai - bi;
    return a.key.localeCompare(b.key);
  });
}

type ApiItem = {
  key: string;
  clientId: string;
  hasSecret: boolean;
  configured: boolean;
  enabled: boolean;
  configuredAccountEmail: string;
  updatedAt: string;
};

function mapItem(item: ApiItem): SiteIntegration {
  return {
    key: item.key,
    clientId: item.clientId ?? "",
    clientSecret: "",
    hasSecret: item.hasSecret === true,
    configured: item.configured,
    enabled: item.enabled,
    configuredAccountEmail: item.configuredAccountEmail ?? "",
    updatedAt: item.updatedAt,
  };
}

export async function listSiteIntegrations(): Promise<SiteIntegration[]> {
  const res = await fetch("/api/admin/integrations", { credentials: "same-origin" });
  if (!res.ok) throw new Error("Failed to load integrations");
  const data = (await res.json()) as { items: ApiItem[] };
  return sortIntegrations((data.items ?? []).map(mapItem));
}

export async function saveSiteIntegration(input: {
  key: string;
  clientId: string;
  clientSecret: string;
  keepSecret: boolean;
  configuredAccountEmail?: string;
}): Promise<SiteIntegration> {
  const res = await fetch("/api/admin/integrations", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: input.key,
      clientId: input.clientId,
      clientSecret: input.clientSecret,
      keepSecret: input.keepSecret,
      configuredAccountEmail: input.configuredAccountEmail,
    }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error || "Save failed");
  }
  const data = (await res.json()) as { item: ApiItem };
  return mapItem(data.item);
}

export async function setSiteIntegrationEnabled(key: string, enabled: boolean) {
  const res = await fetch("/api/admin/integrations", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, enabled }),
  });
  if (!res.ok) throw new Error("Failed to update integration");
  const data = (await res.json()) as { item: ApiItem };
  return mapItem(data.item);
}

export async function resetSiteIntegration(key: string) {
  const res = await fetch("/api/admin/integrations", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, reset: true }),
  });
  if (!res.ok) throw new Error("Failed to reset integration");
  const data = (await res.json()) as { item: ApiItem };
  return mapItem(data.item);
}
