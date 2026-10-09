/**
 * EL SECTOR DE LA LUZ: todo lo que la app sabe de facturas de electricidad 2.0TD.
 *
 * Es el único sitio donde aparecen potencias, periodos, CUPS e impuestos eléctricos. El motor lo usa a
 * través del contrato `Sector` de `src/engine/types.ts`.
 */
import type { Sector } from "@/engine/types";

import { findInvoiceDoubts } from "./checks";
import { calculateBill, type BillInput } from "./formula";
import { invoiceSchema, tariffSchema, type Invoice, type Tariff } from "./schema";
import { DEFAULT_ELECTRICITY_SETTINGS, electricitySettingsSchema, type ElectricitySettings } from "./settings";
import { toPricePerDay } from "./units";

/** Lo que no cambia entre hoy y una tarifa: el periodo, las potencias, los consumos y el alquiler. */
function billBase(invoice: Invoice): Pick<BillInput, "days" | "powerKw" | "energyKwh" | "meterRentalCents"> {
  return {
    days: invoice.days,
    powerKw: invoice.powerKw,
    energyKwh: invoice.energyKwh,
    meterRentalCents: invoice.meterRentalCents,
  };
}

function tariffEnergyPrice(tariff: Tariff): BillInput["energyPrice"] {
  const { energyPrice } = tariff;
  return energyPrice.kind === "single"
    ? { p1: energyPrice.price, p2: energyPrice.price, p3: energyPrice.price }
    : { p1: energyPrice.p1, p2: energyPrice.p2, p3: energyPrice.p3 };
}

export const electricitySector: Sector<Invoice, Tariff, ElectricitySettings> = {
  id: "electricity",
  documentSchema: invoiceSchema,
  offerSchema: tariffSchema,
  settingsSchema: electricitySettingsSchema,
  defaultSettings: DEFAULT_ELECTRICITY_SETTINGS,

  periodDays: (invoice) => invoice.days,

  currentCost: (invoice, settings) =>
    calculateBill(
      {
        ...billBase(invoice),
        powerPricePerDay: { p1: toPricePerDay(invoice.powerPrice.p1), p2: toPricePerDay(invoice.powerPrice.p2) },
        energyPrice: invoice.energyPrice,
      },
      settings,
    ),

  offerCost: (invoice, tariff, settings) =>
    calculateBill(
      {
        ...billBase(invoice),
        powerPricePerDay: { p1: toPricePerDay(tariff.powerPrice.p1), p2: toPricePerDay(tariff.powerPrice.p2) },
        energyPrice: tariffEnergyPrice(tariff),
      },
      settings,
    ),

  findDoubts: findInvoiceDoubts,

  offerLabel: (tariff) => `${tariff.provider} · ${tariff.name}`,
};

export type { Invoice, Tariff } from "./schema";
export type { ElectricitySettings } from "./settings";
