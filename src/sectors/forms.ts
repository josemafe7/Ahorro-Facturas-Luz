/** Cómo se leen los formularios del sector activo. Lo usan las Server Actions. */
import { parseInvoiceForm, parseSettingsForm, parseTariffForm } from "./electricity/forms";

export const sectorForms = {
  settings: parseSettingsForm,
  offer: parseTariffForm,
  document: parseInvoiceForm,
};
