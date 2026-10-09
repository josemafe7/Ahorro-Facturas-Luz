import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";
import { z } from "zod";

import { compareOffers } from "./compare";
import type { Breakdown, Sector } from "./types";

/**
 * Un sector inventado para las pruebas, que no tiene nada que ver con la luz: una línea de móvil. Si el
 * motor funciona con él, es que no depende de ningún sector concreto.
 */
type PhoneBill = { monthlyFeeCents: number; days: number };
type PhonePlan = { operator: string; monthlyFeeCents: number };

const fee = (cents: number): Breakdown => ({
  lines: [{ id: "fee", label: "Cuota", operation: "cuota mensual", cents }],
  totalCents: cents,
});

const phoneSector: Sector<PhoneBill, PhonePlan, Record<string, never>> = {
  id: "phone",
  documentSchema: z.object({ monthlyFeeCents: z.number(), days: z.number() }),
  draftSchema: z.object({ monthlyFeeCents: z.number().optional(), days: z.number().optional() }),
  documentReader: {
    instructions: "Lee la factura del móvil.",
    schema: z.object({ fee: z.number() }),
    interpret: (raw: { fee: number }) => ({ recognized: true, draft: { monthlyFeeCents: raw.fee }, doubts: [] }),
  },
  offerSchema: z.object({ operator: z.string(), monthlyFeeCents: z.number() }),
  settingsSchema: z.object({}),
  defaultSettings: {},
  offersReader: {
    instructions: "Lee los planes de la operadora.",
    schema: z.object({ plans: z.array(z.string()) }),
    interpret: () => ({ offers: [] }),
  },
  periodDays: (bill) => bill.days,
  currentCost: (bill) => fee(bill.monthlyFeeCents),
  offerCost: (_bill, plan) => fee(plan.monthlyFeeCents),
  findDoubts: () => [],
  printedTotalCents: () => undefined,
  documentSummary: () => [],
  customerName: () => undefined,
  offerLabel: (plan) => plan.operator,
};

describe("El motor", () => {
  it("C8 · calcula todas las ofertas y las ordena de mayor a menor ahorro anual", () => {
    const bill: PhoneBill = { monthlyFeeCents: 3000, days: 30 };
    const plans = [
      { id: "cara", offer: { operator: "Cara", monthlyFeeCents: 3500 } },
      { id: "barata", offer: { operator: "Barata", monthlyFeeCents: 1000 } },
      { id: "media", offer: { operator: "Media", monthlyFeeCents: 2000 } },
    ];

    const comparison = compareOffers(phoneSector, bill, plans, {});

    expect(comparison.current.totalCents).toBe(3000);
    expect(comparison.offers.map(({ id, savings }) => [id, savings.yearCents])).toEqual([
      ["barata", 24333],
      ["media", 12167],
      ["cara", -6083],
    ]);
  });

  it("M2 · no contiene nada propio de la luz: funciona con otro sector y no importa ninguno", () => {
    // Que funciona con otro sector lo demuestra la prueba anterior. Aquí, que no depende de ninguno.
    const engineDir = path.resolve("src/engine");
    const imports = readdirSync(engineDir)
      .filter((file) => !file.endsWith(".test.ts"))
      .flatMap((file) => readFileSync(path.join(engineDir, file), "utf8").match(/from "[^"]+"/g) ?? []);

    expect(imports.filter((source) => source.includes("sectors"))).toEqual([]);
  });
});
