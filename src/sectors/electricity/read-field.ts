import { z } from "zod";

/**
 * Cómo se le piden los datos a la IA, en una forma que aceptan todos los modelos de la lista de Ajustes.
 * Cada dato es un valor sencillo, sin «nulo» ni alternativas (Claude acepta como mucho 16 campos así), y el
 * formato es pequeño (Claude rechaza uno demasiado grande). Lo que no aparece va vacío, o -1 si es un
 * número, y las dudas van juntas en una lista aparte (regla F5).
 */

/** El número que pone la IA cuando no encuentra un dato: ninguno de los que lee puede ser negativo. */
export const NOT_FOUND_NUMBER = -1;
/** La unidad del precio de la potencia cuando la IA no sabe si es por día, por mes o por año. */
export const UNKNOWN_UNIT = "unknown";

export function readText(description: string) {
  return z.string().describe(`${description}. Texto vacío si no aparece`);
}

export function readNumber(description: string) {
  return z.number().describe(`${description}. ${NOT_FOUND_NUMBER} si no aparece`);
}

/** La lista de dudas: de qué dato y por qué. Solo se puede dudar de un dato del formato. */
export function readDoubts<const Field extends string>(fields: readonly [Field, ...Field[]]) {
  return z
    .array(
      z.object({
        field: z.enum(fields),
        reason: z.string().describe("Por qué dudas, en una frase corta en español"),
      }),
    )
    .describe("Los datos de los que dudas: se leen mal, hay varios candidatos o no está claro a qué corresponden. Vacía si estás seguro de todos");
}

/** Un texto leído, o `undefined` si la IA no lo ha encontrado. */
export function textValue(value: string): string | undefined {
  return value.trim() || undefined;
}

/** Un número leído, o `undefined` si la IA no lo ha encontrado. */
export function numberValue(value: number): number | undefined {
  return value < 0 ? undefined : value;
}

/** Si la IA no ha encontrado un dato: un texto vacío, un número negativo o una unidad desconocida. */
export function isMissing(value: string | number): boolean {
  if (typeof value === "number") return numberValue(value) === undefined;
  return textValue(value) === undefined || value === UNKNOWN_UNIT;
}
