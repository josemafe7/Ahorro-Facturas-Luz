import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { Doubt } from "@/engine/types";
import { invoiceReading } from "@/test/ai";

import { interpretInvoiceReading, type InvoiceReading } from "../reading";
import { InvoiceFields } from "./invoice-fields";
import { TariffFields } from "./tariff-fields";

const asRecord = (doubts: Doubt[]) => Object.fromEntries(doubts.map(({ field, reason }) => [field, reason]));

/** El formulario de la factura tal como lo pinta el servidor, con las dudas de una lectura. */
function invoiceForm(reading: InvoiceReading) {
  const { draft, doubts } = interpretInvoiceReading(reading);
  return { doubts, html: renderToStaticMarkup(createElement(InvoiceFields, { value: draft, form: { errors: {}, doubts: asRecord(doubts) } })) };
}

describe("Lo que se ve al revisar", () => {
  it("R1 · cada dato dudoso se ve en su campo con el motivo: los que señala la IA y los que detecta la app", () => {
    // La IA duda de todos y cada uno de los datos que lee.
    const everything = Object.fromEntries(
      Object.entries(invoiceReading()).map(([key, read]) => [key, typeof read === "boolean" ? read : { ...read, doubt: `Duda de ${key}.` }]),
    ) as InvoiceReading;
    const fromAi = invoiceForm(everything);
    expect(fromAi.doubts).toHaveLength(21);
    for (const { reason } of fromAi.doubts) expect(fromAi.html).toContain(reason);

    // La IA no avisa de nada, pero el CUPS, los días y dos precios no cuadran: lo detecta la app (F6 a F8).
    const fromChecks = invoiceForm(
      invoiceReading({
        cups: { value: "ES0999100000000015JX", doubt: null },
        days: { value: 61, doubt: null },
        energyPriceP2: { value: 0, doubt: null },
        powerPriceP1: { value: 400, doubt: null },
        powerPriceUnit: { value: "year", doubt: null },
      }),
    );
    expect(fromChecks.doubts.map(({ field }) => field)).toEqual(["cups", "days", "energyPrice.p2", "powerPrice.p1.amount"]);
    for (const { reason } of fromChecks.doubts) expect(fromChecks.html).toContain(reason);
  });

  it("R4 · bajo un precio de potencia por mes o por año se ve su conversión a precio por día", () => {
    const yearly = { p1: { amount: 45, unit: "year" as const }, p2: { amount: 15, unit: "year" as const } };
    const form = { errors: {} };

    const invoice = renderToStaticMarkup(createElement(InvoiceFields, { value: { powerPrice: yearly }, form }));
    const tariff = renderToStaticMarkup(createElement(TariffFields, { value: { powerPrice: yearly }, form }));

    for (const html of [invoice, tariff]) {
      expect(html).toContain("45 € por año ÷ 365 = 0,123288 € por día");
      expect(html).toContain("15 € por año ÷ 365 = 0,041096 € por día");
    }
    // Si ya viene por día, no hay nada que convertir.
    const daily = { p1: { amount: 0.123288, unit: "day" as const }, p2: { amount: 0.041096, unit: "day" as const } };
    expect(renderToStaticMarkup(createElement(InvoiceFields, { value: { powerPrice: daily }, form }))).not.toContain("÷ 365");
  });
});
