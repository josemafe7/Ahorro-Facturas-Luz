import { z } from "zod";

const MAX_PERCENT = 100;
const MAX_DAILY_CHARGE = 10;

const percent = (name: string) =>
  z.number({ error: `${name}: escribe un número` }).min(0, `${name}: no puede ser negativo`).max(MAX_PERCENT, `${name}: no puede pasar de 100`);

const dailyCharge = (name: string) =>
  z.number({ error: `${name}: escribe un número` }).min(0, `${name}: no puede ser negativo`).max(MAX_DAILY_CHARGE, `${name}: es demasiado alto`);

/** Los impuestos y cargos regulados de la luz. El asesor los cambia en Ajustes (regla A1). */
export const electricitySettingsSchema = z.object({
  /** IVA, en tanto por ciento. */
  vatPercent: percent("IVA"),
  /** Impuesto especial sobre la electricidad, en tanto por ciento. */
  electricityTaxPercent: percent("Impuesto eléctrico"),
  /** Mínimo legal del impuesto eléctrico, en euros por MWh consumido. */
  electricityTaxMinPerMwh: dailyCharge("Mínimo del impuesto eléctrico"),
  /** Alquiler del contador, en euros al día. Solo se usa si la factura no trae el suyo. */
  meterRentalPerDay: dailyCharge("Alquiler del contador"),
  /** Financiación del bono social, en euros al día. */
  socialBonusPerDay: dailyCharge("Financiación del bono social"),
});

export type ElectricitySettings = z.infer<typeof electricitySettingsSchema>;

/**
 * Regla A2: los valores vigentes el 9 de octubre de 2026. Las fuentes oficiales de cada uno están en
 * docs/calculo-luz.md.
 */
export const DEFAULT_ELECTRICITY_SETTINGS: ElectricitySettings = {
  vatPercent: 21,
  electricityTaxPercent: 5.11269632,
  electricityTaxMinPerMwh: 1,
  // 0,81 € al mes × 12 ÷ 365
  meterRentalPerDay: 0.02663,
  // 9,011295 € al año ÷ 365
  socialBonusPerDay: 0.024688,
};
