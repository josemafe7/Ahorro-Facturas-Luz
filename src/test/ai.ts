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

const sure = <T>(value: T) => ({ value, doubt: null });

/** Lo que leería la IA de la primera factura de ejemplo (docs/calculo-luz.md), segura de todo. */
export function invoiceReading(overrides: Partial<InvoiceReading> = {}): InvoiceReading {
  return {
    isElectricityInvoice: true,
    holder: sure("Marta Soler Vidal"),
    supplyAddress: sure("Calle del Roble 12, 2.º B, 46999 Villaejemplo (Valencia)"),
    cups: sure("ES0999100000000015JY"),
    currentProvider: sure("Tramontana Luz"),
    accessTariff: sure("2.0TD"),
    periodStart: sure("2026-09-01"),
    periodEnd: sure("2026-09-30"),
    days: sure(30),
    powerKwP1: sure(4.6),
    powerKwP2: sure(4.6),
    energyKwhP1: sure(96),
    energyKwhP2: sure(84),
    energyKwhP3: sure(130),
    powerPriceP1: sure(0.123288),
    powerPriceP2: sure(0.041096),
    powerPriceUnit: sure("day"),
    energyPriceP1: sure(0.215),
    energyPriceP2: sure(0.165),
    energyPriceP3: sure(0.115),
    meterRental: sure(0.8),
    invoiceTotal: sure(93.65),
    ...overrides,
  };
}
