/**
 * Lo que tiene impreso cada factura de ejemplo y lo que una IA debería leer de ella. Lo usan el generador de
 * los PDF y la IA simulada de las pruebas.
 */
import type { BreakdownLine } from "@/engine/types";
import { scaleCents } from "@/lib/decimal";
import { formatCents, formatNumber } from "@/lib/format";
import { electricitySector } from "@/sectors/electricity";
import type { InvoiceReading } from "@/sectors/electricity/reading";
import { DEFAULT_ELECTRICITY_SETTINGS } from "@/sectors/electricity/settings";

import type { SampleInvoice } from "./sample-invoices";

const settings = DEFAULT_ELECTRICITY_SETTINGS;
const CENTS_PER_EURO = 100;

/** Las líneas de la factura tal como las imprimiría la comercializadora, con el servicio añadido si lo hay. */
export function invoiceLines(sample: SampleInvoice): { lines: BreakdownLine[]; totalCents: number } {
  const bill = electricitySector.currentCost(sample.data, settings);
  const beforeVat = bill.lines.filter(({ id }) => id !== "vat");
  if (sample.extraService) {
    beforeVat.push({ id: "extra", label: sample.extraService.label, operation: "Cuota del periodo", cents: sample.extraService.cents });
  }
  const base = beforeVat.reduce((sum, { cents }) => sum + cents, 0);
  const vat = scaleCents(base, settings.vatPercent, 100);
  const lines = [...beforeVat, { id: "vat", label: "IVA", operation: `${formatCents(base)} × ${formatNumber(settings.vatPercent)} %`, cents: vat }];
  return { lines, totalCents: base + vat };
}

/** Lo que leería una IA de una factura de ejemplo. De la que va como foto, con un dato dudoso. */
export function sampleReading(sample: SampleInvoice): InvoiceReading {
  const { data } = sample;
  const { lines, totalCents } = invoiceLines(sample);
  const meterRental = lines.find(({ id }) => id === "meter-rental")?.cents ?? 0;

  return {
    isElectricityInvoice: true,
    holder: data.holder,
    supplyAddress: data.supplyAddress,
    cups: data.cups,
    currentProvider: data.currentProvider ?? sample.provider.name,
    accessTariff: data.accessTariff,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    days: data.days,
    powerKwP1: data.powerKw.p1,
    powerKwP2: data.powerKw.p2,
    energyKwhP1: data.energyKwh.p1,
    energyKwhP2: data.energyKwh.p2,
    energyKwhP3: data.energyKwh.p3,
    powerPriceP1: data.powerPrice.p1.amount,
    powerPriceP2: data.powerPrice.p2.amount,
    powerPriceUnit: data.powerPrice.p1.unit,
    energyPriceP1: data.energyPrice.p1,
    energyPriceP2: data.energyPrice.p2,
    energyPriceP3: data.energyPrice.p3,
    meterRental: meterRental / CENTS_PER_EURO,
    invoiceTotal: totalCents / CENTS_PER_EURO,
    doubts: sample.asPhoto ? [{ field: "energyKwhP2", reason: "La cifra se ve borrosa en la foto: puede ser 160 o 180." }] : [],
  };
}

/** Lo que respondería una IA ante un documento que no es una factura de luz: todo vacío. */
export const NOT_AN_INVOICE: InvoiceReading = {
  isElectricityInvoice: false,
  holder: "",
  supplyAddress: "",
  cups: "",
  currentProvider: "",
  accessTariff: "",
  periodStart: "",
  periodEnd: "",
  days: -1,
  powerKwP1: -1,
  powerKwP2: -1,
  energyKwhP1: -1,
  energyKwhP2: -1,
  energyKwhP3: -1,
  powerPriceP1: -1,
  powerPriceP2: -1,
  powerPriceUnit: "unknown",
  energyPriceP1: -1,
  energyPriceP2: -1,
  energyPriceP3: -1,
  meterRental: -1,
  invoiceTotal: -1,
  doubts: [],
};
