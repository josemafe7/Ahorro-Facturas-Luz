/**
 * El CUPS es el código que identifica un punto de suministro: «ES», 16 cifras, 2 letras de control y, a
 * veces, 2 caracteres más. Las letras de control se calculan a partir de las 16 cifras, así que un CUPS mal
 * leído casi siempre se detecta.
 */
const CUPS_FORMAT = /^ES(\d{16})([A-Z]{2})(\d[FPRCXYZ])?$/;
const CONTROL_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
const CONTROL_MODULUS = 529n;
const LETTER_COUNT = 23n;

/** Quita espacios y guiones y lo pasa a mayúsculas, que es como se guarda. */
export function normalizeCups(cups: string): string {
  return cups.replace(/[\s-]/g, "").toUpperCase();
}

/** Las dos letras de control que corresponden a las 16 cifras de un CUPS. */
export function cupsControlLetters(digits: string): string {
  const remainder = BigInt(digits) % CONTROL_MODULUS;
  return CONTROL_LETTERS[Number(remainder / LETTER_COUNT)] + CONTROL_LETTERS[Number(remainder % LETTER_COUNT)];
}

/** Regla F6: el formato es correcto y las letras de control cuadran con las cifras. */
export function isValidCups(cups: string): boolean {
  const match = CUPS_FORMAT.exec(normalizeCups(cups));
  return match !== null && cupsControlLetters(match[1]) === match[2];
}
