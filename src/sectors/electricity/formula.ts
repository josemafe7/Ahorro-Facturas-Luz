import type { Breakdown, BreakdownLine } from "@/engine/types";
import { DECIMALS, decimal, fromCents, integer, multiply, toCents, type Decimal } from "@/lib/decimal";
import { formatCents, formatNumber } from "@/lib/format";

import type { ElectricitySettings } from "./settings";
import { ELECTRICITY_TEXTS, LINE_LABELS, type LineId } from "./texts";

/**
 * Lo que hace falta para calcular una factura 2.0TD de un periodo: días, potencias, consumos y precios.
 * Vale igual para lo que el cliente paga hoy y para lo que pagaría con una tarifa: solo cambian los precios.
 */
export type BillInput = {
  days: number;
  powerKw: { p1: number; p2: number };
  energyKwh: { p1: number; p2: number; p3: number };
  /** En euros por kW y día. */
  powerPricePerDay: { p1: number; p2: number };
  /** En euros por kWh. */
  energyPrice: { p1: number; p2: number; p3: number };
  /** El alquiler del contador que trae la factura. Si no lo trae, se calcula con el de los ajustes. */
  meterRentalCents?: number;
};

const KWH_PER_MWH_DECIMALS = 3;
const PERCENT: Decimal = { units: 1n, scale: 2 };

function line(id: LineId, operation: string, cents: number, note?: string): BreakdownLine {
  return { id, label: LINE_LABELS[id], operation, cents, ...(note ? { note } : {}) };
}

function daysText(days: number): string {
  return `${days} ${days === 1 ? "día" : "días"}`;
}

function sum(lines: BreakdownLine[]): number {
  return lines.reduce((total, { cents }) => total + cents, 0);
}

/** Un porcentaje de un importe ya redondeado, al céntimo. */
function percentOf(baseCents: number, percent: number): number {
  return toCents(multiply(fromCents(baseCents), decimal(percent, DECIMALS.percent), PERCENT));
}

/**
 * La fórmula de una factura de luz 2.0TD (reglas C1 a C6 de docs/spec.md; explicada en docs/calculo-luz.md).
 * Cada línea se redondea al céntimo y el total es la suma de las líneas ya redondeadas.
 */
export function calculateBill(input: BillInput, settings: ElectricitySettings): Breakdown {
  const days = integer(input.days);

  const power = (["p1", "p2"] as const).map((period) =>
    line(
      `power-${period}`,
      `${formatNumber(input.powerKw[period])} kW × ${daysText(input.days)} × ${formatNumber(input.powerPricePerDay[period])} €`,
      toCents(multiply(decimal(input.powerKw[period], DECIMALS.power), days, decimal(input.powerPricePerDay[period], DECIMALS.price))),
    ),
  );

  const energy = (["p1", "p2", "p3"] as const).map((period) =>
    line(
      `energy-${period}`,
      `${formatNumber(input.energyKwh[period])} kWh × ${formatNumber(input.energyPrice[period])} €`,
      toCents(multiply(decimal(input.energyKwh[period], DECIMALS.energy), decimal(input.energyPrice[period], DECIMALS.price))),
    ),
  );

  const socialBonus = line(
    "social-bonus",
    `${daysText(input.days)} × ${formatNumber(settings.socialBonusPerDay)} €`,
    toCents(multiply(days, decimal(settings.socialBonusPerDay, DECIMALS.price))),
  );

  const supply = [...power, ...energy, socialBonus];
  const electricityTax = electricityTaxLine(input, sum(supply), settings);

  const meterRental =
    input.meterRentalCents === undefined
      ? line(
          "meter-rental",
          `${daysText(input.days)} × ${formatNumber(settings.meterRentalPerDay)} €`,
          toCents(multiply(days, decimal(settings.meterRentalPerDay, DECIMALS.price))),
        )
      : line("meter-rental", ELECTRICITY_TEXTS.meterRentalFromInvoice, input.meterRentalCents);

  const beforeVat = [...supply, electricityTax, meterRental];
  const vatBase = sum(beforeVat);
  const vat = line("vat", `${formatCents(vatBase)} × ${formatNumber(settings.vatPercent)} %`, percentOf(vatBase, settings.vatPercent));

  const lines = [...beforeVat, vat];
  return { lines, totalCents: sum(lines) };
}

/** Regla C5: el impuesto eléctrico es un porcentaje, pero nunca menos que su mínimo por MWh consumido. */
function electricityTaxLine(input: BillInput, baseCents: number, settings: ElectricitySettings): BreakdownLine {
  const byPercent = percentOf(baseCents, settings.electricityTaxPercent);

  const { p1, p2, p3 } = input.energyKwh;
  const totalKwh = decimal(p1, DECIMALS.energy).units + decimal(p2, DECIMALS.energy).units + decimal(p3, DECIMALS.energy).units;
  const mwh: Decimal = { units: totalKwh, scale: DECIMALS.energy + KWH_PER_MWH_DECIMALS };
  const minimum = toCents(multiply(mwh, decimal(settings.electricityTaxMinPerMwh, DECIMALS.price)));

  if (minimum > byPercent) {
    const mwhText = formatNumber(Number(totalKwh) / 10 ** mwh.scale);
    return line(
      "electricity-tax",
      `${mwhText} MWh × ${formatNumber(settings.electricityTaxMinPerMwh)} €`,
      minimum,
      ELECTRICITY_TEXTS.minimumTaxNote,
    );
  }
  return line("electricity-tax", `${formatCents(baseCents)} × ${formatNumber(settings.electricityTaxPercent)} %`, byPercent);
}
