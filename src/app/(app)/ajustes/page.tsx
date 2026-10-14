import type { Metadata } from "next";

import { FormSection } from "@/components/form/form-section";
import { PageHeader } from "@/components/page-header";
import { appConfig } from "@/config/app";
import { getAiSettings } from "@/data/ai-settings";
import { getBrand } from "@/data/brand";
import { LOGO_UPLOAD } from "@/data/files";
import { getSettings } from "@/data/settings";
import { fetchReadingModels } from "@/lib/openrouter";
import { requireUser } from "@/lib/session";

import { AiSettingsForm } from "./_components/ai-settings-form";
import { BrandForm } from "./_components/brand-form";
import { LogoField } from "./_components/logo-field";
import { TaxSettingsForm } from "./_components/tax-settings-form";

const { study: texts } = appConfig.sector.texts;

export const metadata: Metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [settings, { logo, ...brand }, aiSettings, models] = await Promise.all([
    getSettings(user.id),
    getBrand(user.id),
    getAiSettings(user.id),
    fetchReadingModels(),
  ]);

  return (
    <>
      <PageHeader title="Ajustes" />
      <div className="flex flex-col gap-6">
        <FormSection
          title="Inteligencia artificial"
          description="La IA lee los documentos que subes. Cada lectura se paga con la clave de OpenRouter, con el modelo que elijas."
        >
          <AiSettingsForm settings={aiSettings} models={models} />
        </FormSection>
        <FormSection title="Mi marca" description={texts.brandHelp}>
          <div className="flex flex-col gap-6">
            <LogoField logo={logo} accept={LOGO_UPLOAD.types.join(",")} hint={`${LOGO_UPLOAD.typesLabel}, hasta ${LOGO_UPLOAD.maxMb} MB. Mejor cuadrado.`} />
            <BrandForm value={brand} />
          </div>
        </FormSection>
        <FormSection title="Impuestos y cargos" description={texts.settingsHelp}>
          <TaxSettingsForm values={settings} />
        </FormSection>
      </div>
    </>
  );
}
