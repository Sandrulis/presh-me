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

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const gate = await getMfaGate(supabase);
        // Enrolled but AAL1: always challenge before settings (except we still need
        // the enroll UI when gate === "enroll", e.g. admin first-time setup).
        if (gate === "verify") {
          return (
            <div className="min-h-screen bg-[var(--paper)]">
              <MfaVerifyModal open mode="login" nextPath="/settings" />
            </div>
          );
        }
      }
    } catch {
      /* fall through to settings UI */
    }
  }

  return <SettingsApp mfaReason={params.mfa ?? null} />;
}
