import type { Metadata } from "next";

import { FormSection } from "@/components/form/form-section";
import { PageHeader } from "@/components/page-header";
import { getBrand } from "@/data/brand";
import { LOGO_UPLOAD } from "@/data/files";
import { getSettings } from "@/data/settings";
import { requireUser } from "@/lib/session";

import { BrandForm } from "./_components/brand-form";
import { LogoField } from "./_components/logo-field";
import { TaxSettingsForm } from "./_components/tax-settings-form";

export const metadata: Metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [settings, { logo, ...brand }] = await Promise.all([getSettings(user.id), getBrand(user.id)]);

  return (
    <>
      <PageHeader title="Ajustes" />
      <div className="flex flex-col gap-6">
        <FormSection title="Mi marca" description="Es la que sale en el estudio en PDF que recibe tu cliente.">
          <div className="flex flex-col gap-6">
            <LogoField logo={logo} accept={LOGO_UPLOAD.types.join(",")} hint={`${LOGO_UPLOAD.typesLabel}, hasta ${LOGO_UPLOAD.maxMb} MB. Mejor cuadrado.`} />
            <BrandForm value={brand} />
          </div>
        </FormSection>
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
