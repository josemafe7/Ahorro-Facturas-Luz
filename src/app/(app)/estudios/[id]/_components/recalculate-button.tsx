"use client";

import { RefreshCwIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { appConfig } from "@/config/app";

import { recalculateStudyAction } from "../../actions";

const { study: texts } = appConfig.sector.texts;

/** Vuelve a calcular el estudio con el catálogo y los impuestos de ahora (regla C12). */
export function RecalculateButton({ studyId }: { studyId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await recalculateStudyAction(studyId);
      if (result.ok) toast.success(texts.recalculated);
      else toast.error(result.message);
    });
  }

  return (
    <Button type="button" variant="outline" onClick={handleClick} disabled={pending}>
      <RefreshCwIcon className={pending ? "animate-spin" : undefined} aria-hidden />
      {pending ? "Recalculando…" : "Recalcular"}
    </Button>
  );
}
