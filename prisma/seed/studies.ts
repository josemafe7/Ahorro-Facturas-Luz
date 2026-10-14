import { readFileSync } from "node:fs";
import path from "node:path";

import { saveBrand, saveBrandLogo } from "@/data/brand";
import { calculateStudy, createStudy, listStudies, saveStudyDocument, saveStudyReading, setStudyStatus } from "@/data/studies";
import type { StudyStatus } from "@/data/study-status";
import { db } from "@/lib/db";
import { interpretInvoiceReading } from "@/sectors/electricity/reading";

import { SEED_INVOICES, type SampleInvoice } from "../../scripts/sample-invoices";
import { invoiceLines, sampleReading } from "../../scripts/sample-readings";

const SEED_DIR = path.resolve("prisma/seed");
const MS_PER_DAY = 86_400_000;

/** La marca del asesor de prueba, distinta a propósito de la marca de la app. */
const DEMO_BRAND = {
  businessName: "Asesoría Energética Demo",
  color: "#1E3A8A",
  phone: "600 000 000",
  email: "hola@asesoria-demo.test",
  website: "www.asesoria-demo.test",
};

/**
 * En qué punto queda cada estudio de ejemplo y cuántos días hace que se creó. El último se queda leído por
 * la IA y sin revisar, con un dato dudoso, para enseñar la pantalla de revisión.
 */
const SEED_STUDIES: Array<{ file: string; status: StudyStatus; reviewed: boolean; daysAgo: number }> = [
  { file: "factura-elena-navarro", status: "contracted", reviewed: true, daysAgo: 24 },
  { file: "factura-hugo-castillo", status: "accepted", reviewed: true, daysAgo: 13 },
  { file: "factura-bar-la-esquina", status: "sent", reviewed: true, daysAgo: 5 },
  { file: "factura-irene-pascual", status: "draft", reviewed: false, daysAgo: 1 },
];

/** Los datos de una factura de ejemplo tal como los dejaría el asesor tras revisarlos. */
function reviewedData(sample: SampleInvoice) {
  const { lines, totalCents } = invoiceLines(sample);
  return {
    ...sample.data,
    meterRentalCents: lines.find(({ id }) => id === "meter-rental")?.cents,
    invoiceTotalCents: totalCents,
  };
}

function check<T>(result: { ok: true; value: T } | { ok: false; message: string }): T {
  if (!result.ok) throw new Error(`Dato de ejemplo no válido: ${result.message}`);
  return result.value;
}

/** Pone la marca del asesor de prueba, si todavía no la ha cambiado. */
export async function seedBrand(userId: string): Promise<void> {
  if ((await db.advisorBrand.count({ where: { userId } })) > 0) return;

  check(await saveBrand(userId, DEMO_BRAND));
  check(await saveBrandLogo(userId, readFileSync(path.join(SEED_DIR, "logo-asesoria-demo.png"))));
}

/** Carga los estudios de ejemplo de un asesor, si todavía no tiene ninguno. Necesita el catálogo ya cargado. */
export async function seedStudies(userId: string): Promise<void> {
  if ((await listStudies(userId)).length > 0) return;

  for (const { file, status, reviewed, daysAgo } of SEED_STUDIES) {
    const sample = SEED_INVOICES.find((candidate) => candidate.file === file);
    if (!sample) throw new Error(`No existe la factura de ejemplo ${file}`);

    const { id } = check(await createStudy(userId, readFileSync(path.join(SEED_DIR, "facturas", `${file}.pdf`))));
    const reading = sampleReading(sample);

    if (reviewed) {
      check(await saveStudyReading(userId, id, interpretInvoiceReading(reading)));
      check(await saveStudyDocument(userId, id, reviewedData(sample)));
      check(await calculateStudy(userId, id));
      check(await setStudyStatus(userId, id, status));
    } else {
      const doubtful = {
        ...reading,
        doubts: [{ field: "energyKwhP3" as const, reason: "No está claro si esta cifra es el consumo en valle o el total." }],
      };
      check(await saveStudyReading(userId, id, interpretInvoiceReading(doubtful)));
    }

    await db.study.update({ where: { id }, data: { createdAt: new Date(Date.now() - daysAgo * MS_PER_DAY) } });
  }
}
