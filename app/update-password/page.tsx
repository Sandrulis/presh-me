import type { Metadata } from "next";
import { AuthShowcaseProvider } from "@/app/components/auth-showcase-pages";
import { UpdatePasswordForm } from "@/app/components/update-password-form";
import { loadAuthShowcasePages } from "@/app/lib/landing-showcase";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";

export const metadata: Metadata = privatePageMetadata("Jauna parole");

export default async function UpdatePasswordPage() {
  const pages = await loadAuthShowcasePages();
  return (
    <AuthShowcaseProvider pages={pages}>
      <UpdatePasswordForm />
    </AuthShowcaseProvider>
  );
}
