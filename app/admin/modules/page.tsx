import type { Metadata } from "next";
import { AdminModulesManager } from "@/app/components/admin-modules-manager";

export const metadata: Metadata = { title: "Moduļi" };

export default function AdminModulesPage() {
  return <AdminModulesManager />;
}
