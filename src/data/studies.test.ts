import { existsSync, readdirSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { aiConfig } from "@/config/ai";
import { db } from "@/lib/db";
import { invoiceReading, modelAnswering, modelFailing } from "@/test/ai";
import { bytesOfSize, EXE_BYTES, PDF_BYTES, PNG_BYTES } from "@/test/files";
import { createTestAdvisor } from "@/test/users";

import { startAiReading } from "./ai-readings";
import { getFile } from "./files";
import { createStudy, getStudy, readStudy, saveStudyDocument } from "./studies";

const storedFiles = () => (existsSync(process.env.STORAGE_DIR!) ? readdirSync(process.env.STORAGE_DIR!) : []);

async function uploaded(userId: string): Promise<string> {
  const result = await createStudy(userId, PDF_BYTES);
  if (!result.ok) throw new Error(result.message);
  return result.value.id;
}

/** Un estudio con la factura ya leída por una IA simulada. */
async function read(userId: string, reading = invoiceReading()): Promise<string> {
  const id = await uploaded(userId);
  await readStudy(userId, id, modelAnswering(reading));
  return id;
}

/** Los datos de la factura tal como los enviaría el asesor tras revisarlos. */
const reviewed = {
  holder: "Marta Soler Vidal",
  accessTariff: "2.0TD",
  days: 30,
  powerKw: { p1: 4.6, p2: 4.6 },
  energyKwh: { p1: 96, p2: 84, p3: 130 },
  powerPrice: { p1: { amount: 0.123288, unit: "day" }, p2: { amount: 0.041096, unit: "day" } },
  energyPrice: { p1: 0.215, p2: 0.165, p3: 0.115 },
};

describe("Subir la factura", () => {
  it("F1 · admite PDF y fotos de hasta 10 MB; otro tipo o un archivo mayor se rechaza y no se guarda nada", async () => {
    const advisor = await createTestAdvisor();
    const before = storedFiles().length;

    expect(await createStudy(advisor.id, EXE_BYTES)).toMatchObject({ ok: false, message: expect.stringContaining("PDF, JPG, PNG o WebP") });
    expect(await createStudy(advisor.id, bytesOfSize(11))).toMatchObject({ ok: false, message: expect.stringContaining("10 MB") });
    expect(storedFiles().length).toBe(before);
    expect(await db.study.count({ where: { userId: advisor.id } })).toBe(0);

    expect((await createStudy(advisor.id, PNG_BYTES)).ok).toBe(true);
  });

  it("F2 · al subirla crea un estudio en borrador y guarda la factura en privado, con un nombre aleatorio", async () => {
    const advisor = await createTestAdvisor();

    const id = await uploaded(advisor.id);

    const study = await getStudy(advisor.id, id);
    expect(study).toMatchObject({ status: "draft", reviewed: false, file: { mimeType: "application/pdf" } });
    const file = await db.storedFile.findFirstOrThrow({ where: { userId: advisor.id } });
    expect(file.storageKey).toMatch(/^[0-9a-f-]{36}\.pdf$/);
    expect(storedFiles()).toContain(file.storageKey);
  });
});

describe("Leer la factura con IA", () => {
  it("F3 · la IA propone el titular, el suministro, las potencias, los consumos, el periodo, los precios y el total", async () => {
    const advisor = await createTestAdvisor();

    const study = await getStudy(advisor.id, await read(advisor.id));

    expect(study?.readingStatus).toBe("read");
    expect(study?.draft).toEqual({
      holder: "Marta Soler Vidal",
      supplyAddress: "Calle del Roble 12, 2.º B, 46999 Villaejemplo (Valencia)",
      cups: "ES0999100000000015JY",
      currentProvider: "Tramontana Luz",
      accessTariff: "2.0TD",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      days: 30,
      powerKw: { p1: 4.6, p2: 4.6 },
      energyKwh: { p1: 96, p2: 84, p3: 130 },
      powerPrice: { p1: { amount: 0.123288, unit: "day" }, p2: { amount: 0.041096, unit: "day" } },
      energyPrice: { p1: 0.215, p2: 0.165, p3: 0.115 },
      meterRentalCents: 80,
      invoiceTotalCents: 9365,
    });
    expect(study?.doubts).toEqual({});
  });

  it("F5 · cada dato llega como seguro o como dudoso, y los que la IA no encuentra llegan vacíos", async () => {
    const advisor = await createTestAdvisor();
    const reading = invoiceReading({
      energyKwhP2: { value: 84, doubt: "La cifra está borrosa: puede ser 84 u 94." },
      supplyAddress: { value: null, doubt: null },
    });

    const study = await getStudy(advisor.id, await read(advisor.id, reading));

    expect(study?.draft.energyKwh?.p2).toBe(84);
    expect(study?.draft.supplyAddress).toBeUndefined();
    expect(study?.doubts).toEqual({
      "energyKwh.p2": "La cifra está borrosa: puede ser 84 u 94.",
      supplyAddress: "No lo he encontrado en la factura.",
    });
  });

  it("F10 · si la IA dice que no es una factura de luz, la app lo avisa y no propone datos", async () => {
    const advisor = await createTestAdvisor();

    const study = await getStudy(advisor.id, await read(advisor.id, invoiceReading({ isElectricityInvoice: false })));

    expect(study).toMatchObject({ readingStatus: "not-recognized", draft: {}, doubts: {} });
  });

  it("F11 · si la IA falla o no está configurada, el borrador se conserva y se puede reintentar o rellenar a mano", async () => {
    const advisor = await createTestAdvisor();
    const id = await uploaded(advisor.id);

    expect(await readStudy(advisor.id, id, modelFailing())).toEqual({ ok: true, value: { status: "failed" } });
    expect(await readStudy(advisor.id, id, null)).toEqual({ ok: true, value: { status: "not-configured" } });
    expect(await getStudy(advisor.id, id)).toMatchObject({ status: "draft", readingStatus: "not-configured", file: { mimeType: "application/pdf" } });

    // Se vuelve a intentar con la IA ya disponible, o se rellena a mano sin IA.
    expect(await readStudy(advisor.id, id, modelAnswering(invoiceReading()))).toEqual({ ok: true, value: { status: "read" } });
    expect((await saveStudyDocument(advisor.id, await uploaded(advisor.id), reviewed)).ok).toBe(true);
  });

  it("F12 · como mucho 30 lecturas de IA por hora y asesor: la siguiente se rechaza sin llamar a la IA", async () => {
    const advisor = await createTestAdvisor();
    const id = await uploaded(advisor.id);
    await db.aiReading.createMany({ data: Array.from({ length: aiConfig.maxReadingsPerHour - 1 }, () => ({ userId: advisor.id })) });
    const model = modelAnswering(invoiceReading());

    expect(await readStudy(advisor.id, id, model)).toEqual({ ok: true, value: { status: "read" } });
    expect(await readStudy(advisor.id, id, model)).toEqual({ ok: true, value: { status: "limit" } });
    expect(model.doGenerateCalls).toHaveLength(1);

    // Las lecturas de hace más de una hora ya no cuentan.
    await db.aiReading.updateMany({ where: { userId: advisor.id }, data: { createdAt: new Date(Date.now() - 2 * 3_600_000) } });
    expect(await readStudy(advisor.id, id, model)).toEqual({ ok: true, value: { status: "read" } });
  });

  it("F12 · el límite aguanta aunque las peticiones lleguen todas a la vez", async () => {
    const advisor = await createTestAdvisor();

    const admitted = await Promise.all(Array.from({ length: aiConfig.maxReadingsPerHour * 2 }, () => startAiReading(advisor.id)));

    expect(admitted.filter(Boolean)).toHaveLength(aiConfig.maxReadingsPerHour);
    expect(await db.aiReading.count({ where: { userId: advisor.id } })).toBe(aiConfig.maxReadingsPerHour);
  });

  it("F13 · una lectura de la IA nunca sustituye datos que el asesor ya ha revisado", async () => {
    const advisor = await createTestAdvisor();
    const id = await uploaded(advisor.id);
    // La IA falla y el asesor rellena los datos a mano y los da por buenos.
    await readStudy(advisor.id, id, modelFailing());
    await saveStudyDocument(advisor.id, id, reviewed);

    // Volver a leer ya no se puede: ni se llama a la IA ni se tocan los datos.
    const model = modelAnswering(invoiceReading({ energyKwhP1: { value: 9999, doubt: "No se lee bien." } }));
    expect((await readStudy(advisor.id, id, model)).ok).toBe(false);
    expect(model.doGenerateCalls).toHaveLength(0);
    expect(await getStudy(advisor.id, id)).toMatchObject({ reviewed: true, doubts: {}, draft: { energyKwh: { p1: 96 } } });
  });
});

describe("Revisar los datos", () => {
  it("R1 · el asesor ve todos los datos leídos con sus dudas, también las que encuentra la app, y puede corregirlos", async () => {
    const advisor = await createTestAdvisor();
    // La IA lee mal una letra del CUPS y no avisa: lo detecta la app (regla F6).
    const id = await read(advisor.id, invoiceReading({ cups: { value: "ES0999100000000015JX", doubt: null } }));

    expect((await getStudy(advisor.id, id))?.doubts).toEqual({
      cups: "Las letras de control no cuadran con las cifras: revisa el CUPS.",
    });

    await saveStudyDocument(advisor.id, id, { ...reviewed, cups: "ES0999100000000015JY" });
    expect(await getStudy(advisor.id, id)).toMatchObject({ reviewed: true, doubts: {}, draft: { cups: "ES0999100000000015JY" } });
  });

  it("R2 · no se da por revisado si falta o no es válido un dato necesario; los opcionales pueden quedar vacíos", async () => {
    const advisor = await createTestAdvisor();
    const id = await uploaded(advisor.id);

    const result = await saveStudyDocument(advisor.id, id, {
      ...reviewed,
      holder: "",
      days: 0,
      energyPrice: { p1: 0.215, p2: null, p3: 0.115 },
      // Tiene forma de fecha, pero ese día no existe.
      periodStart: "2026-13-45",
    });

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: {
        holder: "Falta el titular",
        days: "Tiene que haber al menos un día facturado",
        "energyPrice.p2": "Escribe el precio",
        periodStart: "Fecha no válida",
      },
    });
    expect((await getStudy(advisor.id, id))?.reviewed).toBe(false);

    // Sin dirección, CUPS, comercializadora, fechas, alquiler ni total: vale.
    expect((await saveStudyDocument(advisor.id, id, reviewed)).ok).toBe(true);
    expect(await getStudy(advisor.id, id)).toMatchObject({ reviewed: true, customerName: "Marta Soler Vidal" });
  });
});

describe("Privacidad y permisos", () => {
  it("V2 · una factura guardada solo se entrega a su dueño, a través de la app", async () => {
    const owner = await createTestAdvisor("Dueña");
    const other = await createTestAdvisor("Otro");
    const study = await getStudy(owner.id, await uploaded(owner.id));
    const fileId = study!.file!.id;

    expect((await getFile(owner.id, fileId))?.bytes.equals(Buffer.from(PDF_BYTES))).toBe(true);
    expect(await getFile(other.id, fileId)).toBeNull();
  });

  it("Permisos · un asesor no ve, lee ni cambia los estudios de otro", async () => {
    const owner = await createTestAdvisor("Dueña");
    const other = await createTestAdvisor("Otro");
    const id = await read(owner.id);

    expect(await getStudy(other.id, id)).toBeNull();
    expect((await readStudy(other.id, id, modelAnswering(invoiceReading({ holder: { value: "Intruso", doubt: null } })))).ok).toBe(false);
    expect((await saveStudyDocument(other.id, id, { ...reviewed, holder: "Intruso" })).ok).toBe(false);

    expect((await getStudy(owner.id, id))?.draft.holder).toBe("Marta Soler Vidal");
  });
});
