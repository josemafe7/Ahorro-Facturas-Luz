import { describe, expect, it } from "vitest";

import { projectSavings } from "@/engine/compare";

import { calculateBill, type BillInput } from "./formula";
import { DEFAULT_ELECTRICITY_SETTINGS } from "./settings";

/**
 * El ejemplo hecho a mano de docs/calculo-luz.md: la primera factura de ejemplo. Si alguna de estas cifras
 * cambia, o el código está mal o hay que rehacer el ejemplo a mano.
 */
const invoice = {
  days: 30,
  powerKw: { p1: 4.6, p2: 4.6 },
  energyKwh: { p1: 96, p2: 84, p3: 130 },
  meterRentalCents: 80,
};
const today: BillInput = {
  ...invoice,
  powerPricePerDay: { p1: 0.123288, p2: 0.041096 },
  energyPrice: { p1: 0.215, p2: 0.165, p3: 0.115 },
};
const proposal: BillInput = {
  ...invoice,
  powerPricePerDay: { p1: 0.090411, p2: 0.027397 },
  energyPrice: { p1: 0.119, p2: 0.119, p3: 0.119 },
};
const settings = DEFAULT_ELECTRICITY_SETTINGS;

function cents(input: BillInput, lineId: string, using = settings): number {
  const line = calculateBill(input, using).lines.find(({ id }) => id === lineId);
  if (!line) throw new Error(`No existe la línea ${lineId}`);
  return line.cents;
}

describe("Cálculo de una factura 2.0TD", () => {
  it("C1 · lo que pagaría con una tarifa: potencia, energía, bono social, impuesto eléctrico, alquiler e IVA, por este orden", () => {
    const bill = calculateBill(proposal, settings);

    expect(bill.lines.map(({ id, cents }) => [id, cents])).toEqual([
      ["power-p1", 1248],
      ["power-p2", 378],
      ["energy-p1", 1142],
      ["energy-p2", 1000],
      ["energy-p3", 1547],
      ["social-bonus", 74],
      ["electricity-tax", 276],
      ["meter-rental", 80],
      ["vat", 1206],
    ]);
    expect(bill.totalCents).toBe(6951);
  });

  it("C2 · lo que paga hoy sale de la misma fórmula, con los precios de su factura", () => {
    const bill = calculateBill(today, settings);

    expect(bill.lines.map(({ cents }) => cents)).toEqual([1701, 567, 2064, 1386, 1495, 74, 373, 80, 1625]);
    expect(bill.totalCents).toBe(9365);
  });

  it("C3 · cada línea enseña su operación completa", () => {
    const operations = Object.fromEntries(calculateBill(today, settings).lines.map(({ id, operation }) => [id, operation]));

    expect(operations["power-p1"]).toBe("4,6 kW × 30 días × 0,123288 €");
    expect(operations["energy-p3"]).toBe("130 kWh × 0,115 €");
    expect(operations["social-bonus"]).toBe("30 días × 0,024688 €");
    expect(operations["electricity-tax"]).toBe("72,87 € × 5,11269632 %");
    expect(operations["vat"]).toBe("77,40 € × 21 %");
  });

  it("C4 · cada línea se redondea al céntimo con el medio céntimo hacia arriba, y el total suma las líneas ya redondeadas", () => {
    // 1 kWh a 0,125 € son 12,5 céntimos: sube a 13. Con un cálculo en coma flotante, 1,005 € bajaría a 1,00.
    const halfCent: BillInput = { ...today, energyKwh: { p1: 1, p2: 1, p3: 0 }, energyPrice: { p1: 0.125, p2: 1.005, p3: 0 } };

    expect(cents(halfCent, "energy-p1")).toBe(13);
    expect(cents(halfCent, "energy-p2")).toBe(101);

    const bill = calculateBill(today, settings);
    expect(bill.totalCents).toBe(bill.lines.reduce((sum, line) => sum + line.cents, 0));
  });

  it("C5 · el impuesto eléctrico nunca baja de su mínimo legal, y la línea lo dice", () => {
    const reducedRate = { ...settings, electricityTaxPercent: 0.5 };

    // Con el tipo rebajado: 53,89 € × 0,5 % = 0,27 €, menos que 0,310 MWh × 1 € = 0,31 €.
    const line = calculateBill(proposal, reducedRate).lines.find(({ id }) => id === "electricity-tax");

    expect(line?.cents).toBe(31);
    expect(line?.operation).toBe("0,31 MWh × 1 €");
    expect(line?.note).toMatch(/mínimo legal/i);
    // Con el tipo normal el mínimo no se alcanza y la línea no lleva aviso.
    expect(calculateBill(proposal, settings).lines.find(({ id }) => id === "electricity-tax")?.note).toBeUndefined();
  });

  it("C6 · el alquiler del contador es el de la factura y, si no lo trae, el de los ajustes por los días", () => {
    const withoutRental: BillInput = { ...today, meterRentalCents: undefined };

    expect(cents({ ...today, meterRentalCents: 136 }, "meter-rental")).toBe(136);
    // 30 días × 0,026630 € = 0,7989 €
    expect(cents(withoutRental, "meter-rental")).toBe(80);
    expect(calculateBill(withoutRental, settings).lines.find(({ id }) => id === "meter-rental")?.operation).toBe(
      "30 días × 0,02663 €",
    );
  });

  it("C7 · el ahorro en la factura, al año (× 365 ÷ días) y al mes (÷ 12)", () => {
    const savings = projectSavings(calculateBill(today, settings).totalCents, calculateBill(proposal, settings).totalCents, invoice.days);

    expect(savings).toEqual({ periodCents: 2414, yearCents: 29370, monthCents: 2448 });
  });
});
