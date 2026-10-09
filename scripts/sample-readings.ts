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

const sure = <T>(value: T) => ({ value, doubt: null });

/** Lo que leería una IA de una factura de ejemplo. De la que va como foto, con un dato dudoso. */
export function sampleReading(sample: SampleInvoice): InvoiceReading {
  const { data } = sample;
  const { lines, totalCents } = invoiceLines(sample);
  const meterRental = lines.find(({ id }) => id === "meter-rental")?.cents ?? 0;

  return {
    isElectricityInvoice: true,
    holder: sure(data.holder),
    supplyAddress: sure(data.supplyAddress),
    cups: sure(data.cups),
    currentProvider: sure(data.currentProvider ?? sample.provider.name),
    accessTariff: sure(data.accessTariff),
    periodStart: sure(data.periodStart),
    periodEnd: sure(data.periodEnd),
    days: sure(data.days),
    powerKwP1: sure(data.powerKw.p1),
    powerKwP2: sure(data.powerKw.p2),
    energyKwhP1: sure(data.energyKwh.p1),
    energyKwhP2: sample.asPhoto
      ? { value: data.energyKwh.p2, doubt: "La cifra se ve borrosa en la foto: puede ser 160 o 180." }
      : sure(data.energyKwh.p2),
    energyKwhP3: sure(data.energyKwh.p3),
    powerPriceP1: sure(data.powerPrice.p1.amount),
    powerPriceP2: sure(data.powerPrice.p2.amount),
    powerPriceUnit: sure(data.powerPrice.p1.unit),
    energyPriceP1: sure(data.energyPrice.p1),
    energyPriceP2: sure(data.energyPrice.p2),
    energyPriceP3: sure(data.energyPrice.p3),
    meterRental: sure(meterRental / CENTS_PER_EURO),
    invoiceTotal: sure(totalCents / CENTS_PER_EURO),
  };
}

const none = { value: null, doubt: null };

/** Lo que respondería una IA ante un documento que no es una factura de luz. */
export const NOT_AN_INVOICE: InvoiceReading = {
  isElectricityInvoice: false,
  holder: none,
  supplyAddress: none,
  cups: none,
  currentProvider: none,
  accessTariff: none,
  periodStart: none,
  periodEnd: none,
  days: none,
  powerKwP1: none,
  powerKwP2: none,
  energyKwhP1: none,
  energyKwhP2: none,
  energyKwhP3: none,
  powerPriceP1: none,
  powerPriceP2: none,
  powerPriceUnit: none,
  energyPriceP1: none,
  energyPriceP2: none,
  energyPriceP3: none,
  meterRental: none,
  invoiceTotal: none,
};
