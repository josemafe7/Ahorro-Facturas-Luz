/**
 * EL MOTOR: de un documento a una propuesta.
 *
 * El motor sabe subir un documento, leerlo con IA, dejar que se revise, compararlo con un catálogo de
 * ofertas y generar la propuesta. No sabe nada de ningún negocio: qué se lee, cómo se comprueba y cómo se
 * calcula lo aporta un módulo de sector (`src/sectors/`), que cumple el contrato `Sector` de este archivo.
 * Para llevar la app a otro nicho se escribe otro módulo; el motor no se toca.
 */
import type { z } from "zod";

import type { DocumentReading, Reader } from "./reading";

/** Una línea de un cálculo: qué es, cómo se ha calculado y cuánto da. */
export type BreakdownLine = {
  id: string;
  label: string;
  /** La operación completa, para enseñarla: «4,6 kW × 30 días × 0,123288 €». */
  operation: string;
  cents: number;
  /** Una aclaración cuando la línea no sigue el caso normal. */
  note?: string;
};

/** Un cálculo con cada operación a la vista. El total es la suma de sus líneas. */
export type Breakdown = {
  lines: BreakdownLine[];
  totalCents: number;
};

/** Lo que se ahorra con una oferta: en el periodo del documento, al año y al mes. */
export type Savings = {
  periodCents: number;
  yearCents: number;
  monthCents: number;
};

/** Un documento a medio revisar: cualquier dato puede faltar todavía. */
export type Draft<T> = T extends object ? { [K in keyof T]?: Draft<T[K]> } : T;

/** Un dato que conviene revisar antes de calcular, y por qué. */
export type Doubt = {
  /** El campo del documento, con puntos: `powerKw.p1`. */
  field: string;
  reason: string;
};

/**
 * Lo que un sector le cuenta al motor.
 *
 * - `TDocument`: los datos del documento ya revisados, listos para calcular.
 * - `TOffer`: una oferta del catálogo.
 * - `TSettings`: los valores que no dependen del documento ni de la oferta (impuestos, cargos).
 */
export type Sector<TDocument, TOffer, TSettings> = {
  id: string;
  /** Valida los datos revisados del documento. Lo que no pase por aquí no se calcula. */
  documentSchema: z.ZodType<TDocument>;
  /** Lee un documento guardado a medio revisar sin fiarse de su forma. */
  draftSchema: z.ZodType<Draft<TDocument>>;
  offerSchema: z.ZodType<TOffer>;
  settingsSchema: z.ZodType<TSettings>;
  defaultSettings: TSettings;
  /** Los días que cubre el documento, para proyectar el ahorro a un año. */
  periodDays(document: TDocument): number;
  /** Lo que el cliente paga hoy, según su documento. */
  currentCost(document: TDocument, settings: TSettings): Breakdown;
  /** Lo que pagaría con una oferta, para el mismo periodo y el mismo consumo. */
  offerCost(document: TDocument, offer: TOffer, settings: TSettings): Breakdown;
  /** Cómo se lee el documento con IA. El tipo de lo que devuelve la IA es cosa del sector. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cada sector define su propio formato de lectura
  documentReader: Reader<any, DocumentReading<TDocument>>;
  /** Las comprobaciones que no necesitan IA: datos que no cuadran o que no son razonables. */
  findDoubts(draft: Draft<TDocument>): Doubt[];
  /** El total impreso en el documento, si lo trae: sirve para avisar de que el cálculo no cuadra. */
  printedTotalCents(document: TDocument): number | undefined;
  /** Los datos del cliente que identifican el estudio en el PDF: titular, dirección… */
  documentSummary(document: TDocument): Array<{ label: string; value: string }>;
  /** A nombre de quién está el documento, si ya se sabe, para reconocer el estudio en la lista. */
  customerName(draft: Draft<TDocument>): string | undefined;
  /** Cómo se llama una oferta en una lista: «Comercializadora · Tarifa». */
  offerLabel(offer: TOffer): string;
};
