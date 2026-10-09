import { TagsIcon } from "lucide-react";
import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { appConfig } from "@/config/app";
import { requireUser } from "@/lib/session";

const { offer } = appConfig.sector.texts;

export const metadata: Metadata = { title: offer.catalogTitle };

export default async function CatalogPage() {
  await requireUser();

  return (
    <>
      <PageHeader title={offer.catalogTitle} />
      <EmptyState icon={TagsIcon} title={offer.empty} />
    </>
  );
}
