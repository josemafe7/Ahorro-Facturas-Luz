"use client";

import { RefreshCwIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { recalculateStudyAction } from "../../actions";

/** Vuelve a calcular el estudio con el catálogo y los impuestos de ahora (regla C12). */
export function RecalculateButton({ studyId }: { studyId: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await recalculateStudyAction(studyId);
      if (result.ok) toast.success("Estudio recalculado.");
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
