import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingScreen } from "@/app/components/loading-screen";
import { RegisterForm } from "@/app/components/register-form";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";

export const metadata: Metadata = privatePageMetadata("Reģistrēties");

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <RegisterForm />
    </Suspense>
  );
}
