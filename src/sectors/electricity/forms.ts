import { parseNumber } from "@/lib/format";

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
