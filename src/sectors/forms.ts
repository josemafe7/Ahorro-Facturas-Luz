/** Cómo se leen los formularios del sector activo. Lo usan las Server Actions. */
import { parseSettingsForm } from "./electricity/forms";

export const sectorForms = {
  settings: parseSettingsForm,
};
