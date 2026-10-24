import type { Metadata } from "next";
import { MfaVerifyModal } from "@/app/components/mfa-verify-modal";
import { SettingsApp } from "@/app/components/settings-app";
import { getMfaGate } from "@/app/lib/auth/mfa";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";

export const metadata: Metadata = privatePageMetadata("Uzstādījumi");

type SettingsPageProps = {
  searchParams: Promise<{ mfa?: string }>;
};

async function settingsNeedsMfaVerify(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const gate = await getMfaGate(supabase);
    // Enrolled but AAL1: challenge before settings (enroll UI when gate === "enroll").
    return gate === "verify";
  } catch {
    return false;
  }
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const needsMfaVerify = await settingsNeedsMfaVerify();

  if (needsMfaVerify) {
    return (
      <div className="min-h-screen bg-[var(--paper)]">
        <MfaVerifyModal open mode="login" nextPath="/settings" />
      </div>
    );
  }

  return <SettingsApp mfaReason={params.mfa ?? null} />;
}
