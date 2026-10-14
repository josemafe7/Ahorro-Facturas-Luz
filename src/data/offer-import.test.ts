import { describe, expect, it } from "vitest";

import { aiConfig } from "@/config/ai";
import { db } from "@/lib/db";
import type { TariffsReading } from "@/sectors/electricity/tariff-reading";
import { modelAnswering, modelFailing } from "@/test/ai";
import { EXE_BYTES, PDF_BYTES } from "@/test/files";
import { createTestAdvisor } from "@/test/users";

import { readOffersDocument } from "./offer-import";
import { createOffer, listOffers } from "./offers";

/** Lo que leería la IA de un tarifario con dos tarifas 2.0TD de precio fijo. */
const reading: TariffsReading = {
  tariffs: [
    {
      provider: "Cierzo Eléctrica",
      name: "Hogar 2027",
      powerPriceP1: 34.5,
      powerPriceP2: 11,
      powerPriceUnit: "year",
      energyPriceP1: 0.121,
      energyPriceP2: 0.121,
      energyPriceP3: 0.121,
      notes: "Permanencia de 12 meses.",
      doubts: [],
    },
    {
      provider: "Cierzo Eléctrica",
      name: "Fin de Semana",
      powerPriceP1: 34.5,
      powerPriceP2: 11,
      powerPriceUnit: "year",
      energyPriceP1: 0.182,
      energyPriceP2: 0.131,
      // No lo encuentra.
      energyPriceP3: -1,
      notes: "",
      doubts: [{ field: "energyPriceP2", reason: "La celda está partida entre dos líneas." }],
    },
  ],
};

describe("Subir un tarifario", () => {
  it("T5 · la IA propone las tarifas con sus datos dudosos marcados, y no se guarda ninguna hasta que el asesor la revisa", async () => {
    const advisor = await createTestAdvisor();

    const result = await readOffersDocument(advisor.id, PDF_BYTES, modelAnswering(reading));

    expect(result).toMatchObject({ ok: true, value: { status: "read" } });
    const { proposals } = result.ok ? result.value : { proposals: [] };
    expect(proposals.map(({ draft }) => [draft.provider, draft.name, draft.energyPrice?.kind])).toEqual([
      ["Cierzo Eléctrica", "Hogar 2027", "single"],
      ["Cierzo Eléctrica", "Fin de Semana", "periods"],
    ]);
    expect(proposals[0].doubts).toEqual({});
    expect(proposals[1].doubts).toEqual({
      "energyPrice.p2": "La celda está partida entre dos líneas.",
      "energyPrice.p3": "No lo he encontrado en el tarifario.",
    });
    expect(await listOffers(advisor.id)).toEqual([]);
    expect(await db.storedFile.count({ where: { userId: advisor.id } })).toBe(0);

    // El asesor da por buena la primera y la guarda; la segunda, incompleta, no se puede guardar tal cual.
    expect((await createOffer(advisor.id, proposals[0].draft)).ok).toBe(true);
    expect((await createOffer(advisor.id, proposals[1].draft)).ok).toBe(false);
    expect((await listOffers(advisor.id)).map(({ label }) => label)).toEqual(["Cierzo Eléctrica · Hogar 2027"]);
  });

  it("T5 · si el archivo no vale, la IA falla o no encuentra tarifas, la app lo dice y no propone nada", async () => {
    const advisor = await createTestAdvisor();

    expect(await readOffersDocument(advisor.id, EXE_BYTES, modelAnswering(reading))).toMatchObject({ ok: false });
    expect(await readOffersDocument(advisor.id, PDF_BYTES, modelFailing())).toMatchObject({ value: { status: "failed", proposals: [] } });
    expect(await readOffersDocument(advisor.id, PDF_BYTES, null)).toMatchObject({ value: { status: "not-configured" } });
    expect(await readOffersDocument(advisor.id, PDF_BYTES, modelAnswering({ tariffs: [] }))).toMatchObject({ value: { status: "empty" } });
  });

  it("F12 · los tarifarios cuentan para el mismo límite de lecturas de IA que las facturas", async () => {
    const advisor = await createTestAdvisor();
    await db.aiReading.createMany({ data: Array.from({ length: aiConfig.maxReadingsPerHour }, () => ({ userId: advisor.id })) });

    expect(await readOffersDocument(advisor.id, PDF_BYTES, modelAnswering(reading))).toMatchObject({ value: { status: "limit", proposals: [] } });
  });
});
