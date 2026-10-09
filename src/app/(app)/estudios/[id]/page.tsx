import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StatusBadge } from "@/components/status-badge";
import { appConfig } from "@/config/app";
import { getStudy } from "@/data/studies";
import { requireUser } from "@/lib/session";

import { saveStudyDocumentAction } from "../actions";
import { DocumentForm } from "./_components/document-form";
import { DocumentViewer } from "./_components/document-viewer";
import { ReadingNotice } from "./_components/reading-notice";
import { StudyHeader } from "./_components/study-header";

export const metadata: Metadata = { title: appConfig.sector.texts.study.title };

export default async function StudyPage({ params }: PageProps<"/estudios/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  // Si no existe o es de otro asesor, la misma pantalla de «no encontrado».
  const study = await getStudy(user.id, id);
  if (!study) notFound();

  return (
    <>
      <StudyHeader studyId={study.id} customerName={study.customerName} active="data" action={<StatusBadge status={study.status} />} />
      <div className="grid gap-6 lg:grid-cols-2">
        {study.file && (
          <div className="lg:sticky lg:top-8 lg:self-start">
            <DocumentViewer file={study.file} />
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-6">
          <ReadingNotice
            studyId={study.id}
            status={study.readingStatus}
            doubtCount={Object.keys(study.doubts).length}
            reviewed={study.reviewed}
          />
          <DocumentForm
            action={saveStudyDocumentAction.bind(null, study.id)}
            value={study.draft}
            doubts={study.doubts}
            submitLabel="Guardar datos"
            pendingLabel="Guardando…"
          />
        </div>
      </div>
    </>
  );
}
