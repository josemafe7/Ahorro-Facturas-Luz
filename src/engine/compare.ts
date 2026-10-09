import { scaleCents } from "@/lib/decimal";

import type { Breakdown, Savings, Sector } from "./types";

const DAYS_PER_YEAR = 365;
const MONTHS_PER_YEAR = 12;

/**
 * Regla C7: el ahorro del periodo es lo que paga hoy menos lo que pagaría; el anual lo proyecta a 365 días;
 * el mensual es el anual entre 12.
 */
export function projectSavings(currentCents: number, offerCents: number, periodDays: number): Savings {
  const periodCents = currentCents - offerCents;
  const yearCents = scaleCents(periodCents, DAYS_PER_YEAR, periodDays);
  return { periodCents, yearCents, monthCents: scaleCents(yearCents, 1, MONTHS_PER_YEAR) };
}

/** Una oferta del catálogo, con el identificador con el que está guardada. */
export type CatalogOffer<TOffer> = { id: string; offer: TOffer };

export type ComparedOffer<TOffer> = CatalogOffer<TOffer> & {
  label: string;
  breakdown: Breakdown;
  savings: Savings;
};

export type Comparison<TOffer> = {
  /** Lo que paga hoy. */
  current: Breakdown;
  periodDays: number;
  /** Todas las ofertas, de mayor a menor ahorro anual (regla C8). */
  offers: ComparedOffer<TOffer>[];
};

/** Calcula lo que paga hoy y lo que pagaría con cada oferta, y las ordena por ahorro. */
export function compareOffers<TDocument, TOffer, TSettings>(
  sector: Sector<TDocument, TOffer, TSettings>,
  document: TDocument,
  offers: CatalogOffer<TOffer>[],
  settings: TSettings,
): Comparison<TOffer> {
  const current = sector.currentCost(document, settings);
  const periodDays = sector.periodDays(document);

  const compared = offers.map(({ id, offer }) => {
    const breakdown = sector.offerCost(document, offer, settings);
    return {
      id,
      offer,
      label: sector.offerLabel(offer),
      breakdown,
      savings: projectSavings(current.totalCents, breakdown.totalCents, periodDays),
    };
  });

  // A igual ahorro, por nombre: el orden no puede depender de cómo vengan de la base de datos.
  compared.sort((a, b) => b.savings.yearCents - a.savings.yearCents || a.label.localeCompare(b.label, "es"));

  return { current, periodDays, offers: compared };
}
