"use client";

import { FormShell } from "@/components/form/form-shell";
import type { SectorSettings } from "@/sectors";
import { SettingsFields } from "@/sectors/ui";

import { saveTaxSettingsAction } from "../actions";

/** Regla A1: los impuestos y cargos con los que se calcula. */
export function TaxSettingsForm({ values }: { values: SectorSettings }) {
  return (
    <FormShell action={saveTaxSettingsAction} submitLabel="Guardar impuestos y cargos" successMessage="Impuestos y cargos guardados.">
      {(form) => <SettingsFields values={values} form={form} />}
    </FormShell>
  );
}
