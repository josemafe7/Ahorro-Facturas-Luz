import { parseNumber } from "@/lib/format";

/**
 * Convierte lo que llega de un formulario en datos para validar con el esquema del sector. Un número que no
 * se entiende llega como `null`, y el esquema lo rechaza con su mensaje.
 */

function number(form: FormData, name: string): number | null {
  return parseNumber(String(form.get(name) ?? ""));
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
