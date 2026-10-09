"use client";

import { FormShell } from "@/components/form/form-shell";
import type { Draft } from "@/engine/types";
import type { FormState } from "@/lib/form-state";
import type { SectorDocument } from "@/sectors";
import { DocumentFields } from "@/sectors/ui";

export function DocumentForm({
  action,
  value,
  doubts,
  submitLabel,
  pendingLabel,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  value: Draft<SectorDocument>;
  doubts: Record<string, string>;
  submitLabel: string;
  pendingLabel: string;
}) {
  return (
    <FormShell action={action} submitLabel={submitLabel} pendingLabel={pendingLabel} doubts={doubts}>
      {(feedback) => <DocumentFields value={value} form={feedback} />}
    </FormShell>
  );
}
