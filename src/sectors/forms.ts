/** Cómo se leen los formularios del sector activo. Lo usan las Server Actions. */
import { parseSettingsForm, parseTariffForm } from "./electricity/forms";

export const sectorForms = {
  settings: parseSettingsForm,
  offer: parseTariffForm,
};
