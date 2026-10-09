import { formatNumber } from "@/lib/format";

import type { Tariff } from "../schema";
import { toPricePerDay } from "../units";

/** Las columnas de precios de una tarifa en la tabla del catálogo. La potencia, siempre por día. */
export const tariffColumns: ReadonlyArray<{ header: string; render: (tariff: Tariff) => string }> = [
  {
    header: "Potencia punta · valle",
    render: ({ powerPrice }) =>
      `${formatNumber(toPricePerDay(powerPrice.p1))} · ${formatNumber(toPricePerDay(powerPrice.p2))} €/kW día`,
  },
  {
    header: "Energía",
    render: ({ energyPrice }) =>
      energyPrice.kind === "single"
        ? `${formatNumber(energyPrice.price)} €/kWh`
        : `${formatNumber(energyPrice.p1)} · ${formatNumber(energyPrice.p2)} · ${formatNumber(energyPrice.p3)} €/kWh`,
  },
];
