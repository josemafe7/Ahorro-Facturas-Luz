import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { appConfig } from "@/config/app";
import { DOCUMENT_UPLOAD } from "@/data/files";
import { requireUser } from "@/lib/session";

import { OffersImporter } from "./_components/offers-importer";

const { offer: texts } = appConfig.sector.texts;

export const metadata: Metadata = { title: texts.importTitle };

export default async function ImportOffersPage() {
  await requireUser();

  return (
    <>
      <PageHeader title={texts.importTitle} description={texts.importNote} />
      <OffersImporter accept={DOCUMENT_UPLOAD.types.join(",")} typesLabel={DOCUMENT_UPLOAD.typesLabel} maxMb={DOCUMENT_UPLOAD.maxMb} />
    </>
  );
}
