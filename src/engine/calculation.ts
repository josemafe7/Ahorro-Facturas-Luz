import { z } from "zod";

import { compareOffers, type CatalogOffer } from "./compare";
import type { Sector } from "./types";

/** Regla C9: a partir de esta diferencia con el total impreso, el cálculo «no cuadra». */
export const MISMATCH_TOLERANCE_CENTS = 50;

const breakdownSchema = z.object({
  lines: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      operation: z.string(),
      cents: z.number().int(),
      note: z.string().optional(),
    }),
  ),
  totalCents: z.number().int(),
});

const savingsSchema = z.object({
  periodCents: z.number().int(),
  yearCents: z.number().int(),
  monthCents: z.number().int(),
});

/**
 * El cálculo guardado de un estudio (regla C12): lo que paga hoy y lo que pagaría con cada oferta, con cada
 * operación escrita, más una copia de los datos, las ofertas y los impuestos con los que se hizo. Es una
 * foto: aunque después cambien el catálogo o los ajustes, esto no cambia hasta que se recalcula.
 */
export const calculationSchema = z.object({
  calculatedAt: z.string(),
  periodDays: z.number().int(),
  current: breakdownSchema,
  /** El total impreso en el documento, si lo trae, para saber si el cálculo cuadra. */
  printedTotalCents: z.number().int().optional(),
  /** Todas las ofertas, de mayor a menor ahorro anual. */
  offers: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      breakdown: breakdownSchema,
      savings: savingsSchema,
      /** La oferta tal como estaba en el catálogo al calcular. */
      offer: z.unknown(),
    }),
  ),
  /** Los datos del documento y los ajustes con los que se calculó. */
  document: z.unknown(),
  settings: z.unknown(),
});

export type Calculation = z.infer<typeof calculationSchema>;
export type CalculatedOffer = Calculation["offers"][number];

/** Calcula un estudio: compara el documento con las ofertas y guarda con qué se hizo. */
export function buildCalculation<TDocument, TOffer, TSettings>(
  sector: Sector<TDocument, TOffer, TSettings>,
  document: TDocument,
  offers: CatalogOffer<TOffer>[],
  settings: TSettings,
  now: Date = new Date(),
): Calculation {
  const comparison = compareOffers(sector, document, offers, settings);
  return {
    calculatedAt: now.toISOString(),
    periodDays: comparison.periodDays,
    current: comparison.current,
    printedTotalCents: sector.printedTotalCents(document),
    offers: comparison.offers.map(({ id, label, breakdown, savings, offer }) => ({ id, label, breakdown, savings, offer })),
    document,
    settings,
  };
}

/**
 * Regla C9: cuánto se aparta lo calculado para hoy del total impreso en el documento, si pasa de la
 * tolerancia. `null` si cuadra o si el documento no trae total.
 */
export function mismatchCents(calculation: Calculation): number | null {
  if (calculation.printedTotalCents === undefined) return null;
  const difference = calculation.current.totalCents - calculation.printedTotalCents;
  return Math.abs(difference) > MISMATCH_TOLERANCE_CENTS ? difference : null;
}

/** Regla P1: las ofertas que se pueden proponer son las que ahorran. Vienen ya ordenadas por ahorro. */
export function savingOffers(calculation: Calculation): CalculatedOffer[] {
  return calculation.offers.filter(({ savings }) => savings.yearCents > 0);
}
