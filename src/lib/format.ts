/** Cómo se escriben los números y las fechas: formato español (DESIGN.md). */

const LOCALE = "es-ES";

const moneyFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: "always",
});

const numberFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 8, useGrouping: "always" });

const dateFormat = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric" });

/** `9365` → `93,65 €` */
export function formatCents(cents: number): string {
  return `${moneyFormat.format(cents / 100)} €`;
}

/** Un importe en euros sin el símbolo, para un campo de formulario: `0.8` → `0,80` */
export function formatAmount(euros: number): string {
  return moneyFormat.format(euros);
}

/** Una cantidad o un precio, con los decimales que tenga: `0.123288` → `0,123288` */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** `2026-10-09` → `9 oct 2026` */
export function formatDate(date: Date | string): string {
  return dateFormat.format(typeof date === "string" ? new Date(date) : date);
}

/**
 * Lee un número escrito a la española: coma para los decimales y, si acaso, punto para los miles.
 * Devuelve `null` si no se entiende. Un punto que no separa miles («0.12») no se acepta: sería adivinar.
 */
export function parseNumber(text: string): number | null {
  const clean = text.trim().replace(/\s/g, "");
  if (!/^-?(\d+|\d{1,3}(\.\d{3})+)(,\d+)?$/.test(clean)) return null;
  const value = Number(clean.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
}
