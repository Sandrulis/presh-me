import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/app/components/forgot-password-form";
import { privatePageMetadata } from "@/app/lib/seo/private-metadata";

export const metadata: Metadata = privatePageMetadata("Aizmirsi paroli");

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
