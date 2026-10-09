"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import { NO_FEEDBACK, type FormState } from "@/lib/form-state";
import type { SectorSettings } from "@/sectors";
import { SettingsFields } from "@/sectors/ui";

import { saveTaxSettingsAction } from "../actions";

export function TaxSettingsForm({ values }: { values: SectorSettings }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTaxSettingsAction, null);

  useEffect(() => {
    if (state?.ok) toast.success(state.message);
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state && !state.ok && <Notice tone="error">{state.message}</Notice>}
      <SettingsFields values={values} form={state?.feedback ?? NO_FEEDBACK} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar impuestos y cargos"}
        </Button>
      </div>
    </form>
  );
}
