"use client";

import { RefreshCwIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import { aiConfig } from "@/config/ai";
import { appConfig } from "@/config/app";
import type { ReadingStatus } from "@/data/studies";

import { rereadStudyAction } from "../../actions";

const { document: texts, study: studyTexts } = appConfig.sector.texts;

const MANUAL = "Puedes rellenar los datos a mano.";

/** Qué ha pasado con la lectura y qué se puede hacer (reglas F10, F11 y F12). */
const MESSAGES: Record<Exclude<ReadingStatus, "read">, { title: string; body: string; canRetry: boolean }> = {
  "not-recognized": { title: texts.notRecognized, body: `${MANUAL} ${studyTexts.uploadAnother}`, canRetry: false },
  failed: { title: "La IA no ha podido leer el documento.", body: `Vuelve a intentarlo. ${MANUAL}`, canRetry: true },
  limit: {
    title: `Has llegado al límite de ${aiConfig.maxReadingsPerHour} lecturas con IA por hora.`,
    body: `Inténtalo más tarde. ${MANUAL}`,
    canRetry: true,
  },
  "not-configured": {
    title: "La lectura con IA no está configurada.",
    body: `Falta la clave de OpenRouter: ponla en Ajustes. ${MANUAL}`,
    canRetry: true,
  },
};

function RetryButton({ studyId }: { studyId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await rereadStudyAction(studyId);
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={pending} className="mt-2">
      <RefreshCwIcon className={pending ? "animate-spin" : undefined} aria-hidden />
      {pending ? texts.reading : "Volver a leer con IA"}
    </Button>
  );
}

/** El aviso de arriba de la revisión: cómo fue la lectura y cuántos datos conviene mirar. */
export function ReadingNotice({
  studyId,
  status,
  doubtCount,
  reviewed,
}: {
  studyId: string;
  status: ReadingStatus | null;
  doubtCount: number;
  reviewed: boolean;
}) {
  if (status === null) return null;
  // Regla F13: con los datos ya revisados, lo que pasó con la lectura no cambia nada y no se puede repetir.
  if (reviewed && status !== "read") return null;

  if (status === "read") {
    if (doubtCount === 0) {
      return reviewed ? null : <Notice tone="info">Datos leídos. Compáralos con el documento antes de seguir.</Notice>;
    }
    return (
      <Notice tone="warning" title={doubtCount === 1 ? "Hay 1 dato que conviene revisar" : `Hay ${doubtCount} datos que conviene revisar`}>
        Están marcados en ámbar, con el motivo. Corrígelos o déjalos como están si son correctos.
      </Notice>
    );
  }

  const { title, body, canRetry } = MESSAGES[status];
  return (
    <Notice tone="warning" title={title}>
      <p>{body}</p>
      {canRetry && <RetryButton studyId={studyId} />}
    </Notice>
  );
}
