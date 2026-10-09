import { SettingsIcon } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  await requireUser();

  return (
    <>
      <PageHeader title="Ajustes" />
      <EmptyState icon={SettingsIcon} title="Aquí irán los impuestos y tu marca" />
    </>
  );
}
