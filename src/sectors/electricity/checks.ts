import type { Doubt, Draft } from "@/engine/types";
import { formatNumber } from "@/lib/format";

import { isValidCups } from "./cups";
import { isRealDate, type Invoice } from "./schema";
import { toPricePerDay, type PowerPrice } from "./units";

const MS_PER_DAY = 86_400_000;
/** Regla F8: por encima de esto, un precio no es razonable. */
const MAX_REASONABLE_ENERGY_PRICE = 1;
const MAX_REASONABLE_POWER_PRICE_PER_DAY = 1;

function daysBetween(start: string, end: string): number {
  return Math.round((Date.parse(end) - Date.parse(start)) / MS_PER_DAY);
}

function isComplete(price: Draft<PowerPrice> | undefined): price is PowerPrice {
  return typeof price?.amount === "number" && price.unit !== undefined;
}

/**
 * Las comprobaciones de una factura que no necesitan IA (reglas F6, F7 y F8). Devuelven dudas, no errores:
 * el asesor decide si el dato está bien.
 */
export function findInvoiceDoubts(draft: Draft<Invoice>): Doubt[] {
  const doubts: Doubt[] = [];

  if (draft.cups && !isValidCups(draft.cups)) {
    doubts.push({ field: "cups", reason: "Las letras de control no cuadran con las cifras: revisa el CUPS." });
  }

  // Lo que lee la IA puede tener forma de fecha y no existir: se marca, y con ella no se cuentan días.
  const unrealDates = (["periodStart", "periodEnd"] as const).filter((field) => {
    const date = draft[field];
    return date !== undefined && !isRealDate(date);
  });
  for (const field of unrealDates) doubts.push({ field, reason: "Esa fecha no existe: revísala." });

  if (unrealDates.length === 0 && draft.periodStart && draft.periodEnd && draft.days !== undefined) {
    const between = daysBetween(draft.periodStart, draft.periodEnd);
    // Hay comercializadoras que cuentan el último día y otras que no.
    if (draft.days !== between && draft.days !== between + 1) {
      doubts.push({
        field: "days",
        reason: `Entre las dos fechas hay ${between} días (${between + 1} contando el último), no ${draft.days}.`,
      });
    }
  }

  for (const period of ["p1", "p2", "p3"] as const) {
    const price = draft.energyPrice?.[period];
    if (price !== undefined && (price <= 0 || price > MAX_REASONABLE_ENERGY_PRICE)) {
      doubts.push({ field: `energyPrice.${period}`, reason: unreasonablePrice(price, "kWh") });
    }
  }

  for (const period of ["p1", "p2"] as const) {
    const price = draft.powerPrice?.[period];
    if (!isComplete(price)) continue;
    const perDay = toPricePerDay(price);
    if (perDay <= 0 || perDay > MAX_REASONABLE_POWER_PRICE_PER_DAY) {
      // El nombre del campo del formulario donde se escribe ese precio: así la duda se ve en su sitio.
      doubts.push({ field: `powerPrice.${period}.amount`, reason: unreasonablePrice(perDay, "kW y día") });
    }
  }

  return doubts;
}

function unreasonablePrice(price: number, per: string): string {
  return price <= 0
    ? "Un precio de 0 no es normal: revísalo."
    : `${formatNumber(price)} € por ${per} es un precio muy alto: revísalo.`;
}
