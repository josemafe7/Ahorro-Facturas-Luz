import { z } from "zod";

import type { Draft } from "@/engine/types";

import { ELECTRICITY_TEXTS } from "./texts";
import { POWER_PRICE_UNITS } from "./units";

export const MAX_POWER_KW = 15;
const MAX_ENERGY_KWH = 100_000;
const MAX_PRICE = 100;
const MAX_DAYS = 366;
const MAX_CENTS = 10_000_000;

const text = (max: number) => z.string().trim().max(max, `Como mucho ${max} caracteres`);
const optionalText = (max: number) => text(max).optional();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida");

const powerKw = z
  .number({ error: "Escribe la potencia en kW" })
  .positive("La potencia tiene que ser mayor que 0")
  .max(MAX_POWER_KW, ELECTRICITY_TEXTS.maxPower);

const energyKwh = z
  .number({ error: "Escribe el consumo en kWh" })
  .min(0, "El consumo no puede ser negativo")
  .max(MAX_ENERGY_KWH, "El consumo es demasiado alto");

const price = z
  .number({ error: "Escribe el precio" })
  .min(0, "El precio no puede ser negativo")
  .max(MAX_PRICE, "El precio es demasiado alto");

const amountCents = z
  .number({ error: "Escribe el importe en euros" })
  .int("Escribe el importe en euros")
  .min(0, "El importe no puede ser negativo")
  .max(MAX_CENTS, "El importe es demasiado alto");

/** «2.0 td», «2.0TD » o «2,0TD» son la misma tarifa de acceso. */
export function normalizeAccessTariff(tariff: string): string {
  return tariff.replace(/\s/g, "").replace(",", ".").toUpperCase();
}

/** El precio de la potencia, con la unidad en la que viene (regla R4). */
export const powerPriceSchema = z.object({
  amount: price,
  unit: z.enum(POWER_PRICE_UNITS, { error: "Elige si el precio es por día, por mes o por año" }),
});

/**
 * Los datos de una factura de luz ya revisados por el asesor: lo que hace falta para calcular (regla R2).
 * Todos los precios, sin impuestos (regla R5).
 */
export const invoiceSchema = z.object({
  holder: text(200).min(1, "Falta el titular"),
  supplyAddress: optionalText(300),
  cups: optionalText(30),
  currentProvider: optionalText(120),
  // Regla R3: solo 2.0TD.
  accessTariff: z
    .string({ error: ELECTRICITY_TEXTS.onlySupportedTariff })
    .refine((tariff) => normalizeAccessTariff(tariff) === ELECTRICITY_TEXTS.accessTariff, {
      error: ELECTRICITY_TEXTS.onlySupportedTariff,
    }),
  periodStart: isoDate.optional(),
  periodEnd: isoDate.optional(),
  days: z
    .number({ error: "Escribe los días facturados" })
    .int("Los días tienen que ser un número entero")
    .min(1, "Tiene que haber al menos un día facturado")
    .max(MAX_DAYS, "Una factura no puede pasar de 366 días"),
  powerKw: z.object({ p1: powerKw, p2: powerKw }),
  energyKwh: z.object({ p1: energyKwh, p2: energyKwh, p3: energyKwh }),
  powerPrice: z.object({ p1: powerPriceSchema, p2: powerPriceSchema }),
  energyPrice: z.object({ p1: price, p2: price, p3: price }),
  /** El alquiler del contador que trae la factura, en céntimos. */
  meterRentalCents: amountCents.optional(),
  /** El total impreso en la factura, en céntimos: sirve para avisar si el cálculo no cuadra (regla C9). */
  invoiceTotalCents: amountCents.optional(),
});

export type Invoice = z.infer<typeof invoiceSchema>;

const draftNumber = z.number().optional();
const draftText = z.string().optional();

/**
 * Una factura a medio revisar, tal como se guarda antes de darla por buena: los mismos datos, pero cualquiera
 * puede faltar o no ser válido todavía. Sirve para leer lo guardado sin fiarse de su forma.
 */
export const invoiceDraftSchema: z.ZodType<Draft<Invoice>> = z.object({
  holder: draftText,
  supplyAddress: draftText,
  cups: draftText,
  currentProvider: draftText,
  accessTariff: draftText,
  periodStart: draftText,
  periodEnd: draftText,
  days: draftNumber,
  powerKw: z.object({ p1: draftNumber, p2: draftNumber }).optional(),
  energyKwh: z.object({ p1: draftNumber, p2: draftNumber, p3: draftNumber }).optional(),
  powerPrice: z
    .object({
      p1: z.object({ amount: draftNumber, unit: z.enum(POWER_PRICE_UNITS).optional() }).optional(),
      p2: z.object({ amount: draftNumber, unit: z.enum(POWER_PRICE_UNITS).optional() }).optional(),
    })
    .optional(),
  energyPrice: z.object({ p1: draftNumber, p2: draftNumber, p3: draftNumber }).optional(),
  meterRentalCents: draftNumber,
  invoiceTotalCents: draftNumber,
});

/** Una tarifa del catálogo: de precio fijo, con uno o tres precios de energía (regla T2). */
export const tariffSchema = z.object({
  provider: text(120).min(1, "Falta la comercializadora"),
  name: text(120).min(1, "Falta el nombre de la tarifa"),
  powerPrice: z.object({ p1: powerPriceSchema, p2: powerPriceSchema }),
  energyPrice: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("single"), price }),
    z.object({ kind: z.literal("periods"), p1: price, p2: price, p3: price }),
  ]),
  notes: optionalText(500),
});

export type Tariff = z.infer<typeof tariffSchema>;
