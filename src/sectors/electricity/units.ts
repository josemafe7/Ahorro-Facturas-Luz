import { DECIMALS, decimal, divideRounded } from "@/lib/decimal";
import { formatNumber } from "@/lib/format";

import { POWER_PRICE_UNIT_LABELS } from "./texts";

export const POWER_PRICE_UNITS = ["day", "month", "year"] as const;
export type PowerPriceUnit = (typeof POWER_PRICE_UNITS)[number];

/** El precio de la potencia tal como lo da la factura o el tarifario: por kW y día, mes o año. */
export type PowerPrice = { amount: number; unit: PowerPriceUnit };

const DAYS_PER_YEAR = 365n;
const MONTHS_PER_YEAR = 12n;

/**
 * Regla R4: pasa el precio de la potencia a euros por kW y día, con seis decimales como en las facturas.
 * El mensual se multiplica por 12 y se divide entre 365; el anual se divide entre 365.
 */
export function toPricePerDay({ amount, unit }: PowerPrice): number {
  if (unit === "day") return amount;
  const yearly = decimal(amount, DECIMALS.price).units * (unit === "month" ? MONTHS_PER_YEAR : 1n);
  return Number(divideRounded(yearly, DAYS_PER_YEAR)) / 10 ** DECIMALS.price;
}

/** La conversión, escrita para enseñarla: «45 € por año ÷ 365 = 0,123288 € por día». Vacía si ya es por día. */
export function conversionText(price: PowerPrice): string {
  if (price.unit === "day") return "";
  const operation = price.unit === "month" ? "× 12 ÷ 365" : "÷ 365";
  return `${formatNumber(price.amount)} € ${POWER_PRICE_UNIT_LABELS[price.unit]} ${operation} = ${formatNumber(toPricePerDay(price))} € ${POWER_PRICE_UNIT_LABELS.day}`;
}
