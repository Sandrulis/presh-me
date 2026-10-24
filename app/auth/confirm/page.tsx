import { AuthConfirmClient } from "@/app/components/auth-confirm-client";

export const dynamic = "force-dynamic";

export default async function AuthConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return <AuthConfirmClient next={params.next} />;
}
