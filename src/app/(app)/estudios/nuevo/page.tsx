import type { Metadata } from "next";

import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { UploadZone } from "@/components/upload-zone";
import { appConfig } from "@/config/app";
import { DOCUMENT_UPLOAD } from "@/data/files";
import { requireUser } from "@/lib/session";

import { createStudyAction } from "../actions";

const { texts } = appConfig.sector;

export const metadata: Metadata = { title: texts.study.new };

export default async function NewStudyPage() {
  await requireUser();

  return (
    <>
      <PageHeader title={texts.study.new} />
      <UploadZone
        action={createStudyAction}
        title={texts.document.upload}
        hint={texts.document.uploadHint}
        busyLabel={texts.document.reading}
        accept={DOCUMENT_UPLOAD.types.join(",")}
        typesLabel={DOCUMENT_UPLOAD.typesLabel}
        maxMb={DOCUMENT_UPLOAD.maxMb}
      >
        {/* Regla V1: antes de subir nada, qué se envía fuera y qué se guarda. */}
        <Notice tone="info" title="Privacidad">
          {texts.privacy}
        </Notice>
      </UploadZone>
    </>
  );
}
