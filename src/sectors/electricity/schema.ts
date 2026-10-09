import { z } from "zod";

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
  accessTariff: z.literal(ELECTRICITY_TEXTS.accessTariff, { error: ELECTRICITY_TEXTS.onlySupportedTariff }),
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
  meterRentalCents: z.number().int().min(0).max(MAX_CENTS).optional(),
  /** El total impreso en la factura, en céntimos: sirve para avisar si el cálculo no cuadra (regla C9). */
  invoiceTotalCents: z.number().int().min(0).max(MAX_CENTS).optional(),
});

export type Invoice = z.infer<typeof invoiceSchema>;

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
