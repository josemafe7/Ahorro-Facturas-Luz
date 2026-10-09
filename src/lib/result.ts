import type { z } from "zod";

/** Los errores de un formulario, por campo: `{ "powerKw.p1": "La potencia tiene que ser mayor que 0" }`. */
export type FieldErrors = Record<string, string>;

/**
 * El resultado de algo que puede fallar por un motivo esperado (un dato no válido, algo que no existe o que
 * no es de quien lo pide). Los errores esperados se devuelven así y se explican a la persona; los
 * inesperados se lanzan (docs/conventions.md).
 */
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; message: string; fieldErrors?: FieldErrors };

export const INVALID_DATA_MESSAGE = "Revisa los datos marcados.";

/** El primer error de cada campo, con el nombre del campo escrito con puntos. */
export function fieldErrorsFrom(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path.join(".");
    errors[field] ??= issue.message;
  }
  return errors;
}

export function invalid(error: z.ZodError): { ok: false; message: string; fieldErrors: FieldErrors } {
  return { ok: false, message: INVALID_DATA_MESSAGE, fieldErrors: fieldErrorsFrom(error) };
}

/** Lee un JSON guardado sin lanzar si está estropeado. */
export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
