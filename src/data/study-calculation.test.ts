import { existsSync, readdirSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { appConfig } from "@/config/app";
import { mismatchCents, savingOffers } from "@/engine/calculation";
import { db } from "@/lib/db";
import { sector } from "@/sectors";
import { invoiceReading, modelAnswering } from "@/test/ai";
import { PDF_BYTES } from "@/test/files";
import { createTestAdvisor } from "@/test/users";

import { createOffer, deleteOffer, setOfferActive, updateOffer } from "./offers";
import { saveSettings } from "./settings";
import {
  calculateStudy,
  createStudy,
  deleteStudy,
  getStudy,
  listStudies,
  readStudy,
  saveStudyDocument,
  selectStudyOffer,
  setStudyStatus,
} from "./studies";

/** La factura del ejemplo de docs/calculo-luz.md, ya revisada: hoy paga 93,65 €. */
const invoice = {
  holder: "Marta Soler Vidal",
  accessTariff: "2.0TD",
  days: 30,
  powerKw: { p1: 4.6, p2: 4.6 },
  energyKwh: { p1: 96, p2: 84, p3: 130 },
  powerPrice: { p1: { amount: 0.123288, unit: "day" }, p2: { amount: 0.041096, unit: "day" } },
  energyPrice: { p1: 0.215, p2: 0.165, p3: 0.115 },
  meterRentalCents: 80,
  invoiceTotalCents: 9365,
};
/** La tarifa propuesta del ejemplo: pagaría 69,51 € y ahorra 293,70 € al año. */
const cheap = {
  provider: "Kilovatia",
  name: "Tarifa Única",
  powerPrice: { p1: { amount: 0.090411, unit: "day" }, p2: { amount: 0.027397, unit: "day" } },
  energyPrice: { kind: "single", price: 0.119 },
};
const middle = { ...cheap, provider: "Cierzo Eléctrica", name: "Estable", energyPrice: { kind: "single", price: 0.15 } };
const expensive = { ...cheap, provider: "Lumbre Energía", name: "Clásica", energyPrice: { kind: "single", price: 0.3 } };

async function offer(userId: string, input: unknown): Promise<string> {
  const result = await createOffer(userId, input);
  if (!result.ok) throw new Error(result.message);
  return result.value.id;
}

/** Un estudio con la factura subida, revisada y calculada contra el catálogo del asesor. */
async function calculated(userId: string, document: unknown = invoice): Promise<string> {
  const created = await createStudy(userId, PDF_BYTES);
  if (!created.ok) throw new Error(created.message);
  await saveStudyDocument(userId, created.value.id, document);
  await calculateStudy(userId, created.value.id);
  return created.value.id;
}

const study = async (userId: string, id: string) => (await getStudy(userId, id))!;

describe("Calcular y comparar", () => {
  it("F4 · ningún importe sale de la IA: aunque lea un total disparatado, el estudio lo calcula la app", async () => {
    const advisor = await createTestAdvisor();
    await offer(advisor.id, cheap);
    const created = await createStudy(advisor.id, PDF_BYTES);
    const id = created.ok ? created.value.id : "";
    await readStudy(advisor.id, id, modelAnswering(invoiceReading({ invoiceTotal: 1 })));

    // El asesor da por buenos los datos tal como los propuso la IA, total incluido.
    await saveStudyDocument(advisor.id, id, (await study(advisor.id, id)).draft);
    await calculateStudy(advisor.id, id);

    const { calculation } = await study(advisor.id, id);
    expect(calculation?.current.totalCents).toBe(9365);
    expect(calculation?.offers[0].breakdown.totalCents).toBe(6951);
    // El total leído solo sirve para avisar de que no cuadra.
    expect(mismatchCents(calculation!)).toBe(9365 - 100);
  });

  it("C9 · avisa cuando lo calculado para hoy se aparta más de 0,50 € del total de la factura", async () => {
    const advisor = await createTestAdvisor();
    await offer(advisor.id, cheap);

    const matching = await study(advisor.id, await calculated(advisor.id, { ...invoice, invoiceTotalCents: 9365 + 50 }));
    const withExtras = await study(advisor.id, await calculated(advisor.id, { ...invoice, invoiceTotalCents: 9365 + 720 }));
    const withoutTotal = await study(advisor.id, await calculated(advisor.id, { ...invoice, invoiceTotalCents: undefined }));

    expect(mismatchCents(matching.calculation!)).toBeNull();
    expect(mismatchCents(withExtras.calculation!)).toBe(-720);
    expect(mismatchCents(withoutTotal.calculation!)).toBeNull();
  });

  it("C10 · sin ninguna tarifa activa en el catálogo, la app lo dice y no calcula", async () => {
    const advisor = await createTestAdvisor();
    const offerId = await offer(advisor.id, cheap);
    await setOfferActive(advisor.id, offerId, false);
    const created = await createStudy(advisor.id, PDF_BYTES);
    const id = created.ok ? created.value.id : "";
    await saveStudyDocument(advisor.id, id, invoice);

    expect(await calculateStudy(advisor.id, id)).toEqual({ ok: false, message: appConfig.sector.texts.offer.noneActive });
    expect(await study(advisor.id, id)).toMatchObject({ calculation: null, selectedOfferId: null, status: "draft" });

    // Un estudio ya calculado tampoco se recalcula sin tarifas activas: se queda como estaba…
    await setOfferActive(advisor.id, offerId, true);
    await calculateStudy(advisor.id, id);
    await setStudyStatus(advisor.id, id, "sent");
    const before = (await study(advisor.id, id)).calculation;
    await setOfferActive(advisor.id, offerId, false);
    expect((await calculateStudy(advisor.id, id)).ok).toBe(false);
    expect(await study(advisor.id, id)).toMatchObject({ calculation: before, selectedOfferId: offerId, status: "sent" });

    // …salvo que el asesor haya cambiado sus datos: aquel cálculo ya no vale y el estudio queda sin calcular.
    await saveStudyDocument(advisor.id, id, { ...invoice, days: 31 });
    expect((await calculateStudy(advisor.id, id)).ok).toBe(false);
    expect(await study(advisor.id, id)).toMatchObject({ calculation: null, selectedOfferId: null, status: "draft" });
  });

  it("C11 · cuando ninguna tarifa mejora lo que paga hoy, no se propone ninguna", async () => {
    const advisor = await createTestAdvisor();
    await offer(advisor.id, expensive);

    const { calculation, selectedOfferId } = await study(advisor.id, await calculated(advisor.id));

    expect(calculation?.offers.map(({ savings }) => savings.yearCents < 0)).toEqual([true]);
    expect(savingOffers(calculation!)).toEqual([]);
    expect(selectedOfferId).toBeNull();
  });

  it("C12 · un estudio calculado no cambia aunque cambien el catálogo o los ajustes, hasta que se recalcula", async () => {
    const advisor = await createTestAdvisor();
    const offerId = await offer(advisor.id, cheap);
    const id = await calculated(advisor.id);
    const before = (await study(advisor.id, id)).calculation;

    await updateOffer(advisor.id, offerId, { ...cheap, energyPrice: { kind: "single", price: 0.2 } });
    await saveSettings(advisor.id, { ...sector.defaultSettings, vatPercent: 10 });
    expect((await study(advisor.id, id)).calculation).toEqual(before);

    await calculateStudy(advisor.id, id);
    const after = (await study(advisor.id, id)).calculation;
    expect(after?.current.lines.at(-1)?.operation).toContain("× 10 %");
    expect(after?.offers[0].breakdown.totalCents).not.toBe(before?.offers[0].breakdown.totalCents);
  });

  it("T6 · borrar una tarifa no cambia los estudios ya calculados con ella", async () => {
    const advisor = await createTestAdvisor();
    const offerId = await offer(advisor.id, cheap);
    const id = await calculated(advisor.id);

    await deleteOffer(advisor.id, offerId);

    expect(await study(advisor.id, id)).toMatchObject({
      selectedOfferId: offerId,
      calculation: { offers: [{ label: "Kilovatia · Tarifa Única", breakdown: { totalCents: 6951 } }] },
    });
  });
});

describe("El estudio y su tarifa", () => {
  it("P1 · se propone por defecto la tarifa de mayor ahorro, y el asesor puede elegir otra que ahorre", async () => {
    const advisor = await createTestAdvisor();
    const [cheapId, middleId, expensiveId] = [await offer(advisor.id, cheap), await offer(advisor.id, middle), await offer(advisor.id, expensive)];
    const id = await calculated(advisor.id);

    expect((await study(advisor.id, id)).selectedOfferId).toBe(cheapId);

    expect((await selectStudyOffer(advisor.id, id, middleId)).ok).toBe(true);
    expect((await study(advisor.id, id)).selectedOfferId).toBe(middleId);
    // Una que no ahorra no se puede proponer.
    expect((await selectStudyOffer(advisor.id, id, expensiveId)).ok).toBe(false);
    expect((await study(advisor.id, id)).selectedOfferId).toBe(middleId);
  });
});

describe("Lista de estudios", () => {
  it("L1 · cada estudio queda en la lista con titular, fecha, tarifa propuesta, ahorro anual y estado, los recientes primero", async () => {
    const advisor = await createTestAdvisor();
    await offer(advisor.id, cheap);
    const first = await calculated(advisor.id);
    await db.study.update({ where: { id: first }, data: { createdAt: new Date("2026-10-01") } });
    const second = await calculated(advisor.id, { ...invoice, holder: "Andrés Molina Prieto" });

    const list = await listStudies(advisor.id);

    expect(list.map(({ id }) => id)).toEqual([second, first]);
    expect(list[1]).toMatchObject({
      customerName: "Marta Soler Vidal",
      createdAt: new Date("2026-10-01"),
      proposedOffer: "Kilovatia · Tarifa Única",
      yearSavingsCents: 29370,
      status: "draft",
    });
  });

  it("L2 · el asesor cambia a mano el estado entre borrador, enviado, aceptado y contratado", async () => {
    const advisor = await createTestAdvisor();
    await offer(advisor.id, cheap);
    const id = await calculated(advisor.id);

    for (const status of ["sent", "accepted", "contracted", "draft"] as const) {
      expect((await setStudyStatus(advisor.id, id, status)).ok).toBe(true);
      expect((await study(advisor.id, id)).status).toBe(status);
    }
    expect((await setStudyStatus(advisor.id, id, "perdido")).ok).toBe(false);
  });

  it("L3 · un estudio que todavía no está calculado solo puede estar en borrador", async () => {
    const advisor = await createTestAdvisor();
    const created = await createStudy(advisor.id, PDF_BYTES);
    const id = created.ok ? created.value.id : "";

    expect((await setStudyStatus(advisor.id, id, "sent")).ok).toBe(false);
    expect((await study(advisor.id, id)).status).toBe("draft");
  });

  it("L4 · el asesor puede corregir los datos de un estudio y recalcularlo", async () => {
    const advisor = await createTestAdvisor();
    await offer(advisor.id, cheap);
    const id = await calculated(advisor.id);

    await saveStudyDocument(advisor.id, id, { ...invoice, energyKwh: { p1: 196, p2: 84, p3: 130 } });
    await calculateStudy(advisor.id, id);

    const { calculation } = await study(advisor.id, id);
    expect(calculation?.current.lines.find((line) => line.id === "energy-p1")?.operation).toBe("196 kWh × 0,215 €");
    expect(calculation?.current.totalCents).toBeGreaterThan(9365);
  });

  it("L5 · al borrar un estudio desaparecen sus datos y la factura guardada", async () => {
    const advisor = await createTestAdvisor();
    const id = await calculated(advisor.id);
    const file = await db.storedFile.findFirstOrThrow({ where: { userId: advisor.id } });
    const stored = () => (existsSync(process.env.STORAGE_DIR!) ? readdirSync(process.env.STORAGE_DIR!) : []);
    expect(stored()).toContain(file.storageKey);

    expect((await deleteStudy(advisor.id, id)).ok).toBe(true);

    expect(await getStudy(advisor.id, id)).toBeNull();
    expect(await db.storedFile.count({ where: { userId: advisor.id } })).toBe(0);
    expect(stored()).not.toContain(file.storageKey);
  });

  it("Permisos · un asesor no calcula, cambia de estado, elige tarifa ni borra el estudio de otro", async () => {
    const owner = await createTestAdvisor("Dueña");
    const other = await createTestAdvisor("Otro");
    const offerId = await offer(owner.id, cheap);
    const id = await calculated(owner.id);

    expect(await listStudies(other.id)).toEqual([]);
    expect((await calculateStudy(other.id, id)).ok).toBe(false);
    expect((await setStudyStatus(other.id, id, "sent")).ok).toBe(false);
    expect((await selectStudyOffer(other.id, id, offerId)).ok).toBe(false);
    expect((await deleteStudy(other.id, id)).ok).toBe(false);

    expect(await study(owner.id, id)).toMatchObject({ status: "draft", selectedOfferId: offerId });
  });
});
