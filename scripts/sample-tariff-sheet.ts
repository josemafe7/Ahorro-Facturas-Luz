/**
 * EL TARIFARIO DE EJEMPLO (regla D2). Inventado, como la comercializadora.
 *
 * Trae a propósito dos tarifas que la app tiene que ignorar (una 3.0TD y una indexada) y un precio con una
 * nota al pie que lo hace dudoso, para enseñar en la demo que la IA filtra y avisa.
 */
import type { TariffsReading } from "@/sectors/electricity/tariff-reading";

export const SAMPLE_TARIFF_SHEET = {
  file: "tarifario-cierzo-electrica",
  provider: { name: "Cierzo Eléctrica", color: "#7c3aed" },
  title: "Tarifas de luz para hogares y negocios",
  validity: "Precios sin impuestos. Válidos para contratos firmados hasta el 31 de diciembre de 2026.",
  rows: [
    {
      name: "Hogar 2027",
      access: "2.0TD",
      power: "34,50 · 11,00",
      energy: "0,121 (precio único, las 24 h)",
      notes: "Permanencia de 12 meses",
    },
    {
      name: "Fin de Semana",
      access: "2.0TD",
      power: "34,50 · 11,00 (*)",
      energy: "Punta 0,182 · Llano 0,131 · Valle 0,079",
      notes: "Sin permanencia",
    },
    {
      name: "Negocio Plus",
      access: "3.0TD",
      power: "Seis periodos: consultar",
      energy: "Seis periodos: consultar",
      notes: "Potencias de más de 15 kW",
    },
    {
      name: "Indexada Mercado",
      access: "2.0TD",
      power: "34,50 · 11,00",
      energy: "Precio horario del mercado + 0,012",
      notes: "El precio cambia cada hora",
    },
  ],
  footnote: "(*) En la tarifa Fin de Semana, el precio de la potencia en valle es promocional durante los 6 primeros meses. Después, 14,00 €/kW año.",
} as const;

/** Lo que una IA debería leer del tarifario de ejemplo: solo las dos tarifas 2.0TD de precio fijo. */
export const SAMPLE_TARIFF_SHEET_READING: TariffsReading = {
  tariffs: [
    {
      provider: "Cierzo Eléctrica",
      name: "Hogar 2027",
      powerPriceP1: 34.5,
      powerPriceP2: 11,
      powerPriceUnit: "year",
      energyPriceP1: 0.121,
      energyPriceP2: 0.121,
      energyPriceP3: 0.121,
      notes: "Permanencia de 12 meses.",
      doubts: [],
    },
    {
      provider: "Cierzo Eléctrica",
      name: "Fin de Semana",
      powerPriceP1: 34.5,
      powerPriceP2: 11,
      powerPriceUnit: "year",
      energyPriceP1: 0.182,
      energyPriceP2: 0.131,
      energyPriceP3: 0.079,
      notes: "Sin permanencia.",
      doubts: [{ field: "powerPriceP2", reason: "Hay dos precios: 11,00 € es promocional durante 6 meses y después son 14,00 €." }],
    },
  ],
};
