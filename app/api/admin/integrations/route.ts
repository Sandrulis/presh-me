import { writeAdminAudit } from "@/app/lib/security/admin-audit";
import { encryptSecret, secretLooksSet } from "@/app/lib/security/secrets";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { createClient } from "@/app/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("is_admin, is_blocked").eq("id", user.id).maybeSingle();
  if (!data || data.is_blocked || !data.is_admin) return null;
  return user;
}

type IntegrationRow = {
  integration_key: string;
  client_id: string;
  client_secret: string;
  is_configured: boolean;
  is_enabled: boolean;
  configured_account_email: string;
  updated_at: string;
};

function publicRow(row: IntegrationRow) {
  return {
    key: row.integration_key,
    clientId: row.client_id ?? "",
    hasSecret: secretLooksSet(row.client_secret),
    configured: row.is_configured,
    enabled: row.is_enabled,
    configuredAccountEmail: row.configured_account_email ?? "",
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_integrations")
    .select(
      "integration_key, client_id, client_secret, is_configured, is_enabled, configured_account_email, updated_at",
    )
    .order("integration_key");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({
    items: ((data ?? []) as IntegrationRow[]).map(publicRow),
  });
}

export async function PATCH(request: Request) {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    key?: string;
    clientId?: string;
    clientSecret?: string;
    keepSecret?: boolean;
    configuredAccountEmail?: string;
    enabled?: boolean;
    reset?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const key = body.key?.trim();
  if (!key) return Response.json({ error: "Missing key" }, { status: 400 });

  const admin = createAdminClient();

  if (body.reset) {
    const { data, error } = await admin
      .from("site_integrations")
      .update({
        client_id: "",
        client_secret: "",
        is_configured: false,
        is_enabled: false,
        configured_account_email: "",
        configured_by: null,
        configured_at: null,
      })
      .eq("integration_key", key)
      .select(
        "integration_key, client_id, client_secret, is_configured, is_enabled, configured_account_email, updated_at",
      )
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await writeAdminAudit({
      actorId: user.id,
      action: "integrations.reset",
      targetType: "site_integrations",
      targetId: key,
    });
    return Response.json({ item: publicRow(data as IntegrationRow) });
  }

  if (typeof body.enabled === "boolean") {
    const { data, error } = await admin
      .from("site_integrations")
      .update({ is_enabled: body.enabled })
      .eq("integration_key", key)
      .select(
        "integration_key, client_id, client_secret, is_configured, is_enabled, configured_account_email, updated_at",
      )
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await writeAdminAudit({
      actorId: user.id,
      action: body.enabled ? "integrations.enable" : "integrations.disable",
      targetType: "site_integrations",
      targetId: key,
    });
    return Response.json({ item: publicRow(data as IntegrationRow) });
  }

  const clientId = (body.clientId ?? "").trim();
  const secret = (body.clientSecret ?? "").trim();
  const keepSecret = body.keepSecret === true;

  const patch: Record<string, unknown> = {
    client_id: clientId,
    configured_at: new Date().toISOString(),
    configured_by: user.id,
  };
  if (body.configuredAccountEmail !== undefined) {
    patch.configured_account_email = body.configuredAccountEmail.trim();
  }

  if (!keepSecret) {
    patch.client_secret = encryptSecret(secret);
    patch.is_configured = Boolean(clientId && secret);
  } else {
    const { data: existing } = await admin
      .from("site_integrations")
      .select("client_secret")
      .eq("integration_key", key)
      .maybeSingle();
    const has = secretLooksSet((existing as { client_secret?: string } | null)?.client_secret);
    patch.is_configured = Boolean(clientId && has);
  }

  const { data, error } = await admin
    .from("site_integrations")
    .update(patch)
    .eq("integration_key", key)
    .select(
      "integration_key, client_id, client_secret, is_configured, is_enabled, configured_account_email, updated_at",
    )
    .single();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await writeAdminAudit({
    actorId: user.id,
    action: "integrations.save",
    targetType: "site_integrations",
    targetId: key,
  });

  return Response.json({ item: publicRow(data as IntegrationRow) });
}
