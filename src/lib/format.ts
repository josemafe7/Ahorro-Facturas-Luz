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

/** Miles a la española: grupos de tres cifras detrás de un grupo que no empieza por cero («1.234»). */
const SPANISH_NUMBER = /^-?([1-9]\d{0,2}(\.\d{3})+|\d+)(,\d+)?$/;
/** Con punto decimal y sin miles: «0.084» o «93.65». */
const DOT_DECIMAL_NUMBER = /^-?\d+\.\d+$/;

/**
 * Lee un número escrito a mano (regla R6): con coma decimal y, si acaso, punto para los miles («1.234,56»),
 * o con punto decimal («0.084»), como sale de muchos teclados numéricos. «1.234» es mil doscientos treinta y
 * cuatro, a la española. Devuelve `null` si no se entiende: no se adivina.
 */
export function parseNumber(text: string): number | null {
  const clean = text.trim().replace(/\s/g, "");
  const normalized = SPANISH_NUMBER.test(clean) ? clean.replace(/\./g, "").replace(",", ".") : DOT_DECIMAL_NUMBER.test(clean) ? clean : null;
  if (normalized === null) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
