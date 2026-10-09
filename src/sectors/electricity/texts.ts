/** Los nombres propios de la luz: periodos, líneas del cálculo y campos de la factura. */

export const POWER_PERIODS = { p1: "punta", p2: "valle" } as const;
export const ENERGY_PERIODS = { p1: "punta", p2: "llano", p3: "valle" } as const;

export const LINE_LABELS = {
  "power-p1": "Potencia en punta",
  "power-p2": "Potencia en valle",
  "energy-p1": "Energía en punta",
  "energy-p2": "Energía en llano",
  "energy-p3": "Energía en valle",
  "social-bonus": "Financiación del bono social",
  "electricity-tax": "Impuesto eléctrico",
  "meter-rental": "Alquiler del contador",
  vat: "IVA",
} as const;

export type LineId = keyof typeof LINE_LABELS;

export const POWER_PRICE_UNIT_LABELS = {
  day: "por día",
  month: "por mes",
  year: "por año",
} as const;

export const ELECTRICITY_TEXTS = {
  accessTariff: "2.0TD",
  onlySupportedTariff: "Solo se admite la tarifa de acceso 2.0TD.",
  maxPower: "La tarifa 2.0TD admite hasta 15 kW de potencia.",
  minimumTaxNote: "Se aplica el mínimo legal del impuesto eléctrico.",
  meterRentalFromInvoice: "El importe de la factura",
} as const;
