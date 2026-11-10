import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShowcaseProvider } from "@/app/components/auth-showcase-pages";
import { LoadingScreen } from "@/app/components/loading-screen";
import { LoginForm } from "@/app/components/login-form";
import { loadAuthShowcasePages } from "@/app/lib/landing-showcase";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";

export const metadata: Metadata = privatePageMetadata("Pieslēgties");

export default async function LoginPage() {
  const pages = await loadAuthShowcasePages();
  return (
    <AuthShowcaseProvider pages={pages}>
      <Suspense fallback={<LoadingScreen backdrop="auth" />}>
        <LoginForm />
      </Suspense>
    </AuthShowcaseProvider>
  );
}
