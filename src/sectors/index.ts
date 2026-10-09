/**
 * El sector con el que trabaja la app. Para añadir otro: se escribe su módulo junto a `electricity/`, se
 * exporta desde aquí y se pone su identificador en `src/config/app.ts`.
 */
import { appConfig } from "@/config/app";

import { electricitySector } from "./electricity";

if (appConfig.sector.id !== electricitySector.id) {
  throw new Error(`No existe el sector «${appConfig.sector.id}» de src/config/app.ts`);
}

export const sector = electricitySector;

export type { ElectricitySettings as SectorSettings, Invoice as SectorDocument, Tariff as SectorOffer } from "./electricity";
