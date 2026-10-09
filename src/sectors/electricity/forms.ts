import { parseNumber } from "@/lib/format";

import { normalizeCups } from "./cups";
import { normalizeAccessTariff } from "./schema";

/**
 * Convierte lo que llega de un formulario en datos para validar con el esquema del sector. Un número que no
 * se entiende llega como `null`, y el esquema lo rechaza con su mensaje.
 */

function text(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(form: FormData, name: string): string | undefined {
  return text(form, name) || undefined;
}

function number(form: FormData, name: string): number | null {
  return parseNumber(text(form, name));
}

/** Un número que puede quedar vacío: vacío es «no hay dato»; algo que no se entiende es un error. */
function optionalNumber(form: FormData, name: string): number | null | undefined {
  return text(form, name) === "" ? undefined : number(form, name);
}

const CENTS_PER_EURO = 100;

/** Un importe en euros que puede quedar vacío, pasado a céntimos. */
function optionalCents(form: FormData, name: string): number | null | undefined {
  const euros = optionalNumber(form, name);
  return typeof euros === "number" ? Math.round(euros * CENTS_PER_EURO) : euros;
}

/** Los dos precios de la potencia comparten unidad en el formulario. */
function powerPrice(form: FormData) {
  const unit = text(form, "powerPrice.unit");
  return {
    p1: { amount: number(form, "powerPrice.p1.amount"), unit },
    p2: { amount: number(form, "powerPrice.p2.amount"), unit },
  };
}

export const ELECTRICITY_SETTING_FIELDS = [
  "vatPercent",
  "electricityTaxPercent",
  "electricityTaxMinPerMwh",
  "meterRentalPerDay",
  "socialBonusPerDay",
] as const;

export function parseSettingsForm(form: FormData): unknown {
  return Object.fromEntries(ELECTRICITY_SETTING_FIELDS.map((field) => [field, number(form, field)]));
}

/** Una tarifa del catálogo: con un solo precio de energía o con uno por periodo. */
export function parseTariffForm(form: FormData): unknown {
  const energyPrice =
    text(form, "energyPrice.kind") === "periods"
      ? {
          kind: "periods",
          p1: number(form, "energyPrice.p1"),
          p2: number(form, "energyPrice.p2"),
          p3: number(form, "energyPrice.p3"),
        }
      : { kind: "single", price: number(form, "energyPrice.price") };

  return {
    provider: text(form, "provider"),
    name: text(form, "name"),
    powerPrice: powerPrice(form),
    energyPrice,
    notes: optionalText(form, "notes"),
  };
}

/** Los datos de una factura, tal como los deja el asesor al revisarlos. */
export function parseInvoiceForm(form: FormData): unknown {
  const cups = optionalText(form, "cups");
  return {
    holder: text(form, "holder"),
    supplyAddress: optionalText(form, "supplyAddress"),
    cups: cups === undefined ? undefined : normalizeCups(cups),
    currentProvider: optionalText(form, "currentProvider"),
    accessTariff: normalizeAccessTariff(text(form, "accessTariff")),
    periodStart: optionalText(form, "periodStart"),
    periodEnd: optionalText(form, "periodEnd"),
    days: number(form, "days"),
    powerKw: { p1: number(form, "powerKw.p1"), p2: number(form, "powerKw.p2") },
    energyKwh: { p1: number(form, "energyKwh.p1"), p2: number(form, "energyKwh.p2"), p3: number(form, "energyKwh.p3") },
    powerPrice: powerPrice(form),
    energyPrice: { p1: number(form, "energyPrice.p1"), p2: number(form, "energyPrice.p2"), p3: number(form, "energyPrice.p3") },
    meterRentalCents: optionalCents(form, "meterRentalCents"),
    invoiceTotalCents: optionalCents(form, "invoiceTotalCents"),
  };
}
