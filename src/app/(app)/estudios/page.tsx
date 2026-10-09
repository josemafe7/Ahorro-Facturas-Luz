import { FileTextIcon } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { appConfig } from "@/config/app";
import { requireUser } from "@/lib/session";

const { study } = appConfig.sector.texts;

export const metadata: Metadata = { title: study.plural };

export default async function StudiesPage() {
  await requireUser();

  return (
    <>
      <PageHeader title={study.plural} />
      <EmptyState icon={FileTextIcon} title={study.empty} description={study.emptyHint} />
    </>
  );
}
