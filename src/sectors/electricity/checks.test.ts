import { describe, expect, it } from "vitest";

import { findInvoiceDoubts } from "./checks";
import { invoiceSchema } from "./schema";
import { DEFAULT_ELECTRICITY_SETTINGS } from "./settings";
import { conversionText, toPricePerDay } from "./units";

/** Una factura revisada y correcta: la del ejemplo de docs/calculo-luz.md. */
const invoice = {
  holder: "Persona de Ejemplo",
  accessTariff: "2.0TD",
  days: 30,
  powerKw: { p1: 4.6, p2: 4.6 },
  energyKwh: { p1: 96, p2: 84, p3: 130 },
  powerPrice: { p1: { amount: 0.123288, unit: "day" }, p2: { amount: 0.041096, unit: "day" } },
  energyPrice: { p1: 0.215, p2: 0.165, p3: 0.115 },
};

const doubtfulFields = (draft: Parameters<typeof findInvoiceDoubts>[0]) => findInvoiceDoubts(draft).map(({ field }) => field);

describe("Comprobaciones de una factura sin IA", () => {
  it("F6 · marca como dudoso un CUPS cuyas letras de control no cuadran", () => {
    expect(doubtfulFields({ cups: "ES 1234 1234 5678 9012 JY" })).toEqual([]);
    expect(doubtfulFields({ cups: "ES1234123456789012JX" })).toEqual(["cups"]);
  });

  it("F7 · marca como dudosos unos días que no coinciden con las fechas, y admite un día de diferencia", () => {
    const period = { periodStart: "2026-09-01", periodEnd: "2026-09-30" };

    // Del 1 al 30 hay 29 días, o 30 si se cuenta el último.
    expect(doubtfulFields({ ...period, days: 29 })).toEqual([]);
    expect(doubtfulFields({ ...period, days: 30 })).toEqual([]);
    expect(doubtfulFields({ ...period, days: 61 })).toEqual(["days"]);
    // Una fecha que no existe se marca ella, y no se cuentan días con ella.
    expect(doubtfulFields({ periodStart: "2026-13-45", periodEnd: "2026-09-30", days: 30 })).toEqual(["periodStart"]);
  });

  it("F8 · marca como dudoso un precio de 0 o disparatado", () => {
    expect(doubtfulFields({ energyPrice: { p1: 0.215, p2: 0, p3: 1.5 } })).toEqual(["energyPrice.p2", "energyPrice.p3"]);
    // 400 € por kW y año son 1,09 € por kW y día.
    expect(doubtfulFields({ powerPrice: { p1: { amount: 45, unit: "year" }, p2: { amount: 400, unit: "year" } } })).toEqual([
      "powerPrice.p2.amount",
    ]);
  });
});

describe("Lo que hace falta para calcular", () => {
  it("R3 · solo se admite la 2.0TD: otra tarifa de acceso o más de 15 kW no se calculan", () => {
    const messages = (data: unknown) => invoiceSchema.safeParse(data).error?.issues.map(({ message }) => message) ?? [];

    expect(invoiceSchema.safeParse(invoice).success).toBe(true);
    expect(messages({ ...invoice, accessTariff: "3.0TD" })).toEqual(["Solo se admite la tarifa de acceso 2.0TD."]);
    expect(messages({ ...invoice, powerKw: { p1: 17.3, p2: 4.6 } })).toEqual(["La tarifa 2.0TD admite hasta 15 kW de potencia."]);
  });

  it("R4 · el precio de la potencia por mes o por año se convierte a precio por día y se enseña la conversión", () => {
    expect(toPricePerDay({ amount: 0.123288, unit: "day" })).toBe(0.123288);
    // 45 ÷ 365 = 0,1232876…
    expect(toPricePerDay({ amount: 45, unit: "year" })).toBe(0.123288);
    // 3,75 × 12 ÷ 365 = 0,1232876…
    expect(toPricePerDay({ amount: 3.75, unit: "month" })).toBe(0.123288);
    expect(conversionText({ amount: 45, unit: "year" })).toBe("45 € por año ÷ 365 = 0,123288 € por día");
    expect(conversionText({ amount: 3.75, unit: "month" })).toBe("3,75 € por mes × 12 ÷ 365 = 0,123288 € por día");
  });
});

describe("Ajustes de impuestos y cargos", () => {
  it("A2 · la app trae de inicio los valores vigentes el 9 de octubre de 2026", () => {
    expect(DEFAULT_ELECTRICITY_SETTINGS).toEqual({
      vatPercent: 21,
      electricityTaxPercent: 5.11269632,
      electricityTaxMinPerMwh: 1,
      meterRentalPerDay: 0.02663,
      socialBonusPerDay: 0.024688,
    });
    // El alquiler son 0,81 € al mes y el bono social 9,011295 € al año, pasados a día.
    expect(toPricePerDay({ amount: 0.81, unit: "month" })).toBe(DEFAULT_ELECTRICITY_SETTINGS.meterRentalPerDay);
    expect(toPricePerDay({ amount: 9.011295, unit: "year" })).toBe(DEFAULT_ELECTRICITY_SETTINGS.socialBonusPerDay);
  });
});
