import type { Metadata } from "next";

import { FormSection } from "@/components/form/form-section";
import { PageHeader } from "@/components/page-header";
import { getSettings } from "@/data/settings";
import { requireUser } from "@/lib/session";

import { TaxSettingsForm } from "./_components/tax-settings-form";

export const metadata: Metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await getSettings(user.id);

  return (
    <>
      <PageHeader title="Ajustes" />
      <div className="flex flex-col gap-6">
        <FormSection
          title="Impuestos y cargos"
          description="Se usan en todos los cálculos nuevos. Los estudios ya calculados no cambian."
        >
          <TaxSettingsForm values={settings} />
        </FormSection>
      </div>
    </>
  );
}
