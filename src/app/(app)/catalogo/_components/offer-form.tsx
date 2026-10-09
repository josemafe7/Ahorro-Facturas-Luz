"use client";

import { FormShell } from "@/components/form/form-shell";
import { FormSection } from "@/components/form/form-section";
import { appConfig } from "@/config/app";
import type { FormState } from "@/lib/form-state";
import { routes } from "@/lib/routes";
import type { SectorOffer } from "@/sectors";
import { OfferFields } from "@/sectors/ui";

const { offer: texts } = appConfig.sector.texts;

export function OfferForm({
  action,
  value,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  value?: SectorOffer;
}) {
  return (
    <FormShell action={action} submitLabel={texts.save} cancelHref={routes.catalog}>
      {(feedback) => (
        <FormSection title={texts.formTitle}>
          <OfferFields value={value} form={feedback} />
        </FormSection>
      )}
    </FormShell>
  );
}
