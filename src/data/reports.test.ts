import { describe, expect, it } from "vitest";

import { appConfig } from "@/config/app";
import { renderStudyReport } from "@/lib/pdf/study-report-document";
import { formatDate } from "@/lib/format";
import { sector } from "@/sectors";
import { PDF_BYTES, PNG_BYTES } from "@/test/files";
import { pdfText } from "@/test/pdf";
import { createTestAdvisor } from "@/test/users";

import { saveBrand, saveBrandLogo } from "./brand";
import { createOffer } from "./offers";
import { getStudyReport } from "./reports";
import { saveSettings } from "./settings";
import { calculateStudy, createStudy, getStudy, saveStudyDocument } from "./studies";

const invoice = {
  holder: "Marta Soler Vidal",
  supplyAddress: "Calle del Roble 12, 2.º B, 46999 Villaejemplo (Valencia)",
  cups: "ES0999100000000015JY",
  accessTariff: "2.0TD",
  periodStart: "2026-09-01",
  periodEnd: "2026-09-30",
  days: 30,
  powerKw: { p1: 4.6, p2: 4.6 },
  energyKwh: { p1: 96, p2: 84, p3: 130 },
  powerPrice: { p1: { amount: 0.123288, unit: "day" }, p2: { amount: 0.041096, unit: "day" } },
  energyPrice: { p1: 0.215, p2: 0.165, p3: 0.115 },
  meterRentalCents: 80,
};
const tariff = {
  provider: "Kilovatia",
  name: "Tarifa Única",
  powerPrice: { p1: { amount: 0.090411, unit: "day" }, p2: { amount: 0.027397, unit: "day" } },
  energyPrice: { kind: "single", price: 0.119 },
};
const brand = { businessName: "Asesoría Energética Demo", color: "#1D4ED8", phone: "600 000 000", email: "hola@asesoria-demo.test", website: "asesoria-demo.test" };

/** Un estudio calculado de un asesor con su marca puesta. */
async function studyWithBrand(tariffInput: unknown = tariff) {
  const advisor = await createTestAdvisor();
  await saveBrand(advisor.id, brand);
  await saveBrandLogo(advisor.id, PNG_BYTES);
  await createOffer(advisor.id, tariffInput);
  const created = await createStudy(advisor.id, PDF_BYTES);
  const id = created.ok ? created.value.id : "";
  await saveStudyDocument(advisor.id, id, invoice);
  await calculateStudy(advisor.id, id);
  return { advisor, id };
}

describe("El estudio en PDF", () => {
  it("P2 · lleva el titular, la dirección y el CUPS; lo que paga hoy, lo que pagaría y el ahorro; y el desglose con su operación", async () => {
    const { advisor, id } = await studyWithBrand();

    const report = (await getStudyReport(advisor.id, id))!;

    expect(report.customer).toEqual(
      expect.arrayContaining([
        { label: "Titular", value: "Marta Soler Vidal" },
        { label: "Dirección de suministro", value: "Calle del Roble 12, 2.º B, 46999 Villaejemplo (Valencia)" },
        { label: "CUPS", value: "ES0999100000000015JY" },
      ]),
    );
    expect(report.offerLabel).toBe("Kilovatia · Tarifa Única");
    expect([report.current.totalCents, report.proposed.totalCents]).toEqual([9365, 6951]);
    expect(report.savings).toEqual({ periodCents: 2414, yearCents: 29370, monthCents: 2448 });
    expect(report.current.lines[0]).toMatchObject({ label: "Potencia en punta", operation: "4,6 kW × 30 días × 0,123288 €", cents: 1701 });
    expect(report.proposed.lines[0]).toMatchObject({ operation: "4,6 kW × 30 días × 0,090411 €", cents: 1248 });
  });

  it("P3 · lleva la marca del asesor: su nombre comercial, su logo, su color y sus datos de contacto", async () => {
    const { advisor, id } = await studyWithBrand();

    const report = (await getStudyReport(advisor.id, id))!;

    expect(report.brand).toMatchObject({ ...brand, logo: { format: "png" } });
    expect(Buffer.from(report.brand.logo!.data).equals(Buffer.from(PNG_BYTES))).toBe(true);
  });

  it("P4 · sus importes son los del cálculo guardado, los mismos que se ven en pantalla", async () => {
    const { advisor, id } = await studyWithBrand();

    const report = (await getStudyReport(advisor.id, id))!;
    const { calculation } = (await getStudy(advisor.id, id))!;

    expect(report.current).toEqual(calculation!.current);
    expect(report.proposed).toEqual(calculation!.offers[0].breakdown);
    expect(report.savings).toEqual(calculation!.offers[0].savings);
  });

  it("P5 · dice de qué factura sale, cuándo se calculó y que el ahorro anual es una proyección", async () => {
    const { advisor, id } = await studyWithBrand();

    const report = (await getStudyReport(advisor.id, id))!;

    expect(report.customer).toContainEqual({ label: "Periodo de la factura", value: "Del 1 sept 2026 al 30 sept 2026 (30 días)" });
    expect(report.notes[0]).toBe(`Estudio calculado el ${formatDate(new Date())} a partir de una factura de 30 días.`);
    expect(report.notes).toContain(appConfig.sector.texts.pdf.projectionNote);
  });

  it("C5 · cuando se aplica el mínimo del impuesto eléctrico, el PDF también lo dice", async () => {
    const advisor = await createTestAdvisor();
    // Con el tipo rebajado al 0,1 %, el porcentaje no llega al mínimo de 1 € por MWh ni hoy ni con la tarifa.
    expect((await saveSettings(advisor.id, { ...sector.defaultSettings, electricityTaxPercent: 0.1 })).ok).toBe(true);
    await createOffer(advisor.id, tariff);
    const created = await createStudy(advisor.id, PDF_BYTES);
    const id = created.ok ? created.value.id : "";
    await saveStudyDocument(advisor.id, id, invoice);
    await calculateStudy(advisor.id, id);

    const text = pdfText(await renderStudyReport((await getStudyReport(advisor.id, id))!));

    expect(text).toContain("Marta Soler Vidal");
    expect(text).toContain("Se aplica el mínimo legal del impuesto eléctrico.");
  });

  it("C11 · cuando ninguna tarifa mejora lo que paga hoy, no se genera el estudio", async () => {
    const { advisor, id } = await studyWithBrand({ ...tariff, energyPrice: { kind: "single", price: 0.3 } });

    expect(await getStudyReport(advisor.id, id)).toBeNull();
  });

  it("Permisos · el estudio de un asesor no se genera para otro, y sale un PDF de verdad para su dueño", async () => {
    const { advisor, id } = await studyWithBrand();
    const other = await createTestAdvisor("Otro");

    expect(await getStudyReport(other.id, id)).toBeNull();

    const pdf = await renderStudyReport((await getStudyReport(advisor.id, id))!);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });
});
