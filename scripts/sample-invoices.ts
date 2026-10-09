/**
 * LAS FACTURAS DE EJEMPLO (regla D2).
 *
 * Todo es inventado: las personas, las direcciones, los CUPS y las comercializadoras. Cualquier parecido con
 * algo real es casualidad. Los CUPS usan un código de distribuidora que no existe (0999) y llevan sus letras
 * de control bien calculadas, como los de verdad.
 *
 * De aquí salen los PDF de `ejemplos/` (`pnpm samples`) y lo que la IA simulada de las pruebas «lee» de
 * cada uno.
 */
import type { Invoice } from "@/sectors/electricity/schema";

export type SampleInvoice = {
  /** El nombre del archivo en `ejemplos/`, sin extensión. */
  file: string;
  /** Si se entrega como foto en vez de como PDF. */
  asPhoto?: boolean;
  invoiceNumber: string;
  issuedOn: string;
  /** La comercializadora inventada que emite la factura y su color. */
  provider: { name: string; tagline: string; color: string };
  /** Los datos que la app tiene que leer. */
  data: Required<Pick<Invoice, "holder" | "supplyAddress" | "cups" | "periodStart" | "periodEnd">> & Omit<Invoice, "meterRentalCents" | "invoiceTotalCents">;
  /** Un servicio añadido que la app no contempla: hace que el total no cuadre (regla C9). */
  extraService?: { label: string; cents: number };
};

const TRAMONTANA = { name: "Tramontana Luz", tagline: "Energía para tu casa", color: "#1d4ed8" };
const MAREA = { name: "Marea Eléctrica", tagline: "La luz de siempre", color: "#0f766e" };

/** Las facturas para subir en la demo. Se generan en `ejemplos/`. */
export const SAMPLE_INVOICES: SampleInvoice[] = [
  {
    // La factura del ejemplo hecho a mano de docs/calculo-luz.md: total 93,65 €.
    file: "factura-1-hogar",
    invoiceNumber: "TL-2026-0098213",
    issuedOn: "2026-10-02",
    provider: TRAMONTANA,
    data: {
      holder: "Marta Soler Vidal",
      supplyAddress: "Calle del Roble 12, 2.º B, 46999 Villaejemplo (Valencia)",
      cups: "ES0999100000000015JY",
      currentProvider: "Tramontana Luz",
      accessTariff: "2.0TD",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      days: 30,
      powerKw: { p1: 4.6, p2: 4.6 },
      energyKwh: { p1: 96, p2: 84, p3: 130 },
      powerPrice: { p1: { amount: 0.123288, unit: "day" }, p2: { amount: 0.041096, unit: "day" } },
      energyPrice: { p1: 0.215, p2: 0.165, p3: 0.115 },
    },
  },
  {
    // Dos meses, un solo precio de energía, la potencia por año y un servicio añadido: el total no cuadra.
    file: "factura-2-con-mantenimiento",
    invoiceNumber: "ME/26/441907",
    issuedOn: "2026-10-05",
    provider: MAREA,
    data: {
      holder: "Andrés Molina Prieto",
      supplyAddress: "Avenida de los Almendros 48, 29999 Puertoejemplo (Málaga)",
      cups: "ES0999100000000027JH",
      currentProvider: "Marea Eléctrica",
      accessTariff: "2.0TD",
      periodStart: "2026-08-01",
      periodEnd: "2026-09-30",
      days: 61,
      powerKw: { p1: 3.45, p2: 3.45 },
      energyKwh: { p1: 180, p2: 150, p3: 260 },
      powerPrice: { p1: { amount: 41.5, unit: "year" }, p2: { amount: 12.9, unit: "year" } },
      energyPrice: { p1: 0.172, p2: 0.172, p3: 0.172 },
    },
    extraService: { label: "Servicio Marea Hogar (mantenimiento)", cents: 595 },
  },
  {
    // La misma comercializadora que la primera, otro cliente, entregada como foto hecha con el móvil.
    file: "factura-3-foto",
    asPhoto: true,
    invoiceNumber: "TL-2026-0091177",
    issuedOn: "2026-09-03",
    provider: TRAMONTANA,
    data: {
      holder: "Carmen Ibáñez Roca",
      supplyAddress: "Plaza de la Fuente 3, bajo, 50999 Valdejemplo (Zaragoza)",
      cups: "ES0999100000000039ZF",
      currentProvider: "Tramontana Luz",
      accessTariff: "2.0TD",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      days: 31,
      powerKw: { p1: 5.75, p2: 5.75 },
      energyKwh: { p1: 210, p2: 160, p3: 290 },
      powerPrice: { p1: { amount: 0.123288, unit: "day" }, p2: { amount: 0.041096, unit: "day" } },
      energyPrice: { p1: 0.215, p2: 0.165, p3: 0.115 },
    },
  },
];

/**
 * Las facturas de los estudios que ya vienen cargados con `pnpm seed`. Son de otros clientes, también
 * inventados, para que la lista no esté vacía. Se generan en `prisma/seed/facturas/`.
 */
export const SEED_INVOICES: SampleInvoice[] = [
  {
    file: "factura-elena-navarro",
    invoiceNumber: "ME/26/398114",
    issuedOn: "2026-09-04",
    provider: MAREA,
    data: {
      holder: "Elena Navarro Gil",
      supplyAddress: "Calle de la Ribera 7, 1.º A, 41999 Altoejemplo (Sevilla)",
      cups: "ES0999100000000040ZP",
      currentProvider: MAREA.name,
      accessTariff: "2.0TD",
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
      days: 31,
      powerKw: { p1: 5.5, p2: 5.5 },
      energyKwh: { p1: 240, p2: 190, p3: 310 },
      powerPrice: { p1: { amount: 41.5, unit: "year" }, p2: { amount: 12.9, unit: "year" } },
      energyPrice: { p1: 0.172, p2: 0.172, p3: 0.172 },
    },
  },
  {
    file: "factura-hugo-castillo",
    invoiceNumber: "TL-2026-0093355",
    issuedOn: "2026-09-18",
    provider: TRAMONTANA,
    data: {
      holder: "Hugo Castillo Rey",
      supplyAddress: "Camino de la Sierra 21, 18999 Montejemplo (Granada)",
      cups: "ES0999100000000052ZC",
      currentProvider: TRAMONTANA.name,
      accessTariff: "2.0TD",
      periodStart: "2026-08-15",
      periodEnd: "2026-09-14",
      days: 31,
      powerKw: { p1: 3.45, p2: 3.45 },
      energyKwh: { p1: 70, p2: 65, p3: 110 },
      powerPrice: { p1: { amount: 0.123288, unit: "day" }, p2: { amount: 0.041096, unit: "day" } },
      energyPrice: { p1: 0.215, p2: 0.165, p3: 0.115 },
    },
  },
  {
    file: "factura-bar-la-esquina",
    invoiceNumber: "ME/26/451020",
    issuedOn: "2026-10-01",
    provider: MAREA,
    data: {
      holder: "Bar La Esquina del Ejemplo, S.L.",
      supplyAddress: "Plaza Mayor 2, local, 37999 Villaejemplo de Tormes (Salamanca)",
      cups: "ES0999100000000064SD",
      currentProvider: MAREA.name,
      accessTariff: "2.0TD",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-30",
      days: 30,
      powerKw: { p1: 9.9, p2: 9.9 },
      energyKwh: { p1: 520, p2: 410, p3: 380 },
      powerPrice: { p1: { amount: 41.5, unit: "year" }, p2: { amount: 12.9, unit: "year" } },
      energyPrice: { p1: 0.172, p2: 0.172, p3: 0.172 },
    },
  },
  {
    file: "factura-irene-pascual",
    invoiceNumber: "TL-2026-0099402",
    issuedOn: "2026-10-06",
    provider: TRAMONTANA,
    data: {
      holder: "Irene Pascual Mora",
      supplyAddress: "Calle del Olivo 15, 3.º C, 30999 Campoejemplo (Murcia)",
      cups: "ES0999100000000076SK",
      currentProvider: TRAMONTANA.name,
      accessTariff: "2.0TD",
      periodStart: "2026-09-05",
      periodEnd: "2026-10-04",
      days: 30,
      powerKw: { p1: 4.6, p2: 4.6 },
      energyKwh: { p1: 110, p2: 95, p3: 150 },
      powerPrice: { p1: { amount: 0.123288, unit: "day" }, p2: { amount: 0.041096, unit: "day" } },
      energyPrice: { p1: 0.215, p2: 0.165, p3: 0.115 },
    },
  },
];
