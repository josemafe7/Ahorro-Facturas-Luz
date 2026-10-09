import "server-only";

import { appConfig } from "@/config/app";
import { buildStudyReport, type ReportBrand, type StudyReport } from "@/engine/report";
import { sector } from "@/sectors";

import { getBrand } from "./brand";
import { getFile } from "./files";
import { getStudy } from "./studies";

const LOGO_FORMATS: Record<string, "png" | "jpg"> = { "image/png": "png", "image/jpeg": "jpg" };

async function reportBrand(userId: string): Promise<ReportBrand> {
  const { logo, ...brand } = await getBrand(userId);
  const file = logo ? await getFile(userId, logo.id) : null;
  const format = file ? LOGO_FORMATS[file.mimeType] : undefined;
  return { ...brand, logo: file && format ? { data: file.bytes, format } : undefined };
}

/**
 * El estudio de un asesor listo para el PDF: su cálculo guardado, los datos del cliente y la marca del
 * asesor. `null` si no existe, es de otro asesor o todavía no tiene una tarifa propuesta.
 */
export async function getStudyReport(userId: string, studyId: string): Promise<StudyReport | null> {
  const study = await getStudy(userId, studyId);
  if (!study?.calculation) return null;

  const document = sector.documentSchema.safeParse(study.calculation.document);
  if (!document.success) return null;

  return buildStudyReport({
    calculation: study.calculation,
    selectedOfferId: study.selectedOfferId,
    customer: sector.documentSummary(document.data),
    brand: await reportBrand(userId),
    texts: appConfig.sector.texts.pdf,
  });
}
