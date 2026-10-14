import { MockLanguageModelV4 } from "ai/test";

import type { InvoiceReading } from "@/sectors/electricity/reading";

/** Un modelo simulado que responde `answer` sin llamar a ninguna IA. Las pruebas nunca gastan dinero. */
export function modelAnswering(answer: unknown) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: typeof answer === "string" ? answer : JSON.stringify(answer) }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 20, text: 20, reasoning: undefined },
      },
      warnings: [],
    }),
  });
}

/** Un modelo simulado que falla, como si la IA no respondiera. */
export function modelFailing() {
  return new MockLanguageModelV4({
    doGenerate: async () => {
      throw new Error("La IA no responde");
    },
  });
}

/** Lo que leería la IA de la primera factura de ejemplo (docs/calculo-luz.md), segura de todo. */
export function invoiceReading(overrides: Partial<InvoiceReading> = {}): InvoiceReading {
  return {
    isElectricityInvoice: true,
    holder: "Marta Soler Vidal",
    supplyAddress: "Calle del Roble 12, 2.º B, 46999 Villaejemplo (Valencia)",
    cups: "ES0999100000000015JY",
    currentProvider: "Tramontana Luz",
    accessTariff: "2.0TD",
    periodStart: "2026-09-01",
    periodEnd: "2026-09-30",
    days: 30,
    powerKwP1: 4.6,
    powerKwP2: 4.6,
    energyKwhP1: 96,
    energyKwhP2: 84,
    energyKwhP3: 130,
    powerPriceP1: 0.123288,
    powerPriceP2: 0.041096,
    powerPriceUnit: "day",
    energyPriceP1: 0.215,
    energyPriceP2: 0.165,
    energyPriceP3: 0.115,
    meterRental: 0.8,
    invoiceTotal: 93.65,
    doubts: [],
    ...overrides,
  };
}
