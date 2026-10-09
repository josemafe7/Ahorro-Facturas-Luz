import { createOffer, listOffers, setOfferActive } from "@/data/offers";
import type { SectorOffer } from "@/sectors";

type SeedOffer = SectorOffer & { active?: boolean };

/**
 * Las tarifas de ejemplo. Las comercializadoras son inventadas: cualquier parecido con una real es
 * casualidad. La primera es la «tarifa propuesta» del ejemplo de docs/calculo-luz.md.
 */
export const DEMO_OFFERS: SeedOffer[] = [
  {
    provider: "Kilovatia",
    name: "Tarifa Única 24 h",
    powerPrice: { p1: { amount: 33, unit: "year" }, p2: { amount: 10, unit: "year" } },
    energyPrice: { kind: "single", price: 0.119 },
    notes: "Sin permanencia.",
  },
  {
    provider: "Kilovatia",
    name: "Tres Tramos",
    powerPrice: { p1: { amount: 0.0901, unit: "day" }, p2: { amount: 0.0274, unit: "day" } },
    energyPrice: { kind: "periods", p1: 0.169, p2: 0.121, p3: 0.084 },
    notes: "Sin permanencia. Interesa si se consume de noche y en fin de semana.",
  },
  {
    provider: "Cierzo Eléctrica",
    name: "Estable",
    powerPrice: { p1: { amount: 0.104, unit: "day" }, p2: { amount: 0.034, unit: "day" } },
    energyPrice: { kind: "single", price: 0.128 },
    notes: "Permanencia de 12 meses.",
  },
  {
    provider: "Cierzo Eléctrica",
    name: "Noche",
    powerPrice: { p1: { amount: 0.098, unit: "day" }, p2: { amount: 0.031, unit: "day" } },
    energyPrice: { kind: "periods", p1: 0.189, p2: 0.129, p3: 0.069 },
  },
  {
    provider: "Albor Energía",
    name: "Hogar Fijo",
    powerPrice: { p1: { amount: 3.1, unit: "month" }, p2: { amount: 0.95, unit: "month" } },
    energyPrice: { kind: "single", price: 0.124 },
    notes: "El tarifario da la potencia por mes.",
  },
  {
    provider: "Lumbre Energía",
    name: "Clásica",
    powerPrice: { p1: { amount: 0.123, unit: "day" }, p2: { amount: 0.045, unit: "day" } },
    energyPrice: { kind: "single", price: 0.159 },
  },
  {
    provider: "Lumbre Energía",
    name: "Promoción de verano",
    powerPrice: { p1: { amount: 0.095, unit: "day" }, p2: { amount: 0.03, unit: "day" } },
    energyPrice: { kind: "single", price: 0.109 },
    notes: "Ya no se puede contratar.",
    active: false,
  },
];

/** Carga las tarifas de ejemplo en el catálogo de un asesor, si todavía no tiene ninguna. */
export async function seedOffers(userId: string): Promise<void> {
  if ((await listOffers(userId)).length > 0) return;

  for (const { active = true, ...offer } of DEMO_OFFERS) {
    const result = await createOffer(userId, offer);
    if (!result.ok) throw new Error(`Tarifa de ejemplo no válida: ${offer.name}`);
    if (!active) await setOfferActive(userId, result.value.id, false);
  }
}
