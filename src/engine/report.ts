import { formatDate } from "@/lib/format";

import type { Calculation } from "./calculation";
import type { Breakdown, Savings } from "./types";

/** La marca de quien firma el estudio: sale en la cabecera y en el pie del PDF (regla P3). */
export type ReportBrand = {
  businessName: string;
  /** El color principal, como #RRGGBB. */
  color: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: { data: Uint8Array; format: "png" | "jpg" };
};

/** Los textos fijos del estudio, que dependen del sector y vienen de la configuración. */
export type ReportTexts = {
  title: string;
  currentLabel: string;
  proposedLabel: string;
  savingsYearLabel: string;
  savingsMonthLabel: string;
  breakdownTitle: string;
  projectionNote: string;
  disclaimer: string;
};

/**
 * Todo lo que lleva el estudio que recibe el cliente. El PDF solo pinta esto: no calcula nada. Los importes
 * son los del cálculo guardado, los mismos que se ven en pantalla (regla P4).
 */
export type StudyReport = {
  brand: ReportBrand;
  texts: ReportTexts;
  /** Quién es el cliente y de qué documento sale el estudio. */
  customer: Array<{ label: string; value: string }>;
  offerLabel: string;
  current: Breakdown;
  proposed: Breakdown;
  savings: Savings;
  periodDays: number;
  /** De dónde sale la estimación, cuándo se calculó y qué significa el ahorro anual (regla P5). */
  notes: string[];
};

/** Monta el estudio a partir del cálculo guardado. `null` si no hay ninguna oferta elegida (regla C11). */
export function buildStudyReport(input: {
  calculation: Calculation;
  selectedOfferId: string | null;
  customer: StudyReport["customer"];
  brand: ReportBrand;
  texts: ReportTexts;
}): StudyReport | null {
  const { calculation, brand, texts, customer } = input;
  const offer = calculation.offers.find(({ id }) => id === input.selectedOfferId);
  if (!offer || offer.savings.yearCents <= 0) return null;

  return {
    brand,
    texts,
    customer,
    offerLabel: offer.label,
    current: calculation.current,
    proposed: offer.breakdown,
    savings: offer.savings,
    periodDays: calculation.periodDays,
    notes: [
      `Estudio calculado el ${formatDate(calculation.calculatedAt)} a partir de una factura de ${calculation.periodDays} días.`,
      texts.projectionNote,
      texts.disclaimer,
    ],
  };
}
