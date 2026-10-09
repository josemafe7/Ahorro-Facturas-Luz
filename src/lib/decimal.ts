/**
 * Aritmética decimal exacta para el dinero.
 *
 * Los números de JavaScript no representan bien los decimales (0,1 + 0,2 no da 0,3), y un cálculo con
 * dinero no puede bailar un céntimo. Aquí cada valor se guarda como un entero y su número de decimales, y
 * solo se redondea donde lo dice la especificación: al céntimo, con el medio céntimo hacia arriba.
 */
export type Decimal = { readonly units: bigint; readonly scale: number };

/** Los decimales con los que se guarda cada tipo de dato. */
export const DECIMALS = {
  /** Potencia, en kW. */
  power: 3,
  /** Energía, en kWh. */
  energy: 3,
  /** Precios y cargos, en euros: los de la luz se dan con seis decimales. */
  price: 6,
  /** Porcentajes: el impuesto eléctrico tiene ocho decimales. */
  percent: 8,
} as const;

const CENT_SCALE = 2;

/** Convierte un número en un decimal exacto con `decimals` decimales. */
export function decimal(value: number, decimals: number): Decimal {
  if (!Number.isFinite(value)) throw new RangeError(`No es un número: ${value}`);
  const [whole, fraction = ""] = value.toFixed(decimals).split(".");
  return { units: BigInt(whole + fraction), scale: decimals };
}

/** Un importe en céntimos como decimal exacto. */
export function fromCents(cents: number): Decimal {
  return { units: BigInt(cents), scale: CENT_SCALE };
}

/** Un número entero (días, por ejemplo) como decimal exacto. */
export function integer(value: number): Decimal {
  if (!Number.isInteger(value)) throw new RangeError(`No es un entero: ${value}`);
  return { units: BigInt(value), scale: 0 };
}

export function multiply(...factors: Decimal[]): Decimal {
  return factors.reduce((product, factor) => ({
    units: product.units * factor.units,
    scale: product.scale + factor.scale,
  }));
}

/** División de enteros redondeando al más cercano, con el medio hacia arriba (y hacia abajo en negativos). */
export function divideRounded(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new RangeError("El divisor tiene que ser positivo");
  const sign = numerator < 0n ? -1n : 1n;
  const absolute = numerator * sign;
  return sign * ((absolute * 2n + denominator) / (denominator * 2n));
}

/** El valor como entero con `decimals` decimales, redondeando si hace falta. */
function rescale(value: Decimal, decimals: number): bigint {
  return value.scale <= decimals
    ? value.units * 10n ** BigInt(decimals - value.scale)
    : divideRounded(value.units, 10n ** BigInt(value.scale - decimals));
}

/** Redondea a `decimals` decimales y lo devuelve como número. */
export function round(value: Decimal, decimals: number): number {
  return Number(rescale(value, decimals)) / 10 ** decimals;
}

/** Redondea al céntimo, con el medio céntimo hacia arriba. Devuelve céntimos enteros. */
export function toCents(value: Decimal): number {
  return Number(rescale(value, CENT_SCALE));
}

/** `value` × `numerator` ÷ `denominator`, en céntimos enteros y redondeando al final. */
export function scaleCents(cents: number, numerator: number, denominator: number): number {
  return Number(divideRounded(BigInt(cents) * BigInt(numerator), BigInt(denominator)));
}
