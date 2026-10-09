import type { FieldErrors } from "@/lib/result";

/**
 * Lo que un formulario necesita saber para pintar sus campos: los errores, las dudas y lo que la persona
 * había escrito. Sin esto último, al fallar un envío el formulario volvería a los valores guardados y se
 * perdería lo escrito.
 */
export type FormFeedback = {
  errors: FieldErrors;
  /** Por qué conviene revisar cada campo dudoso (regla R1). */
  doubts?: Record<string, string>;
  /** Lo que se envió la última vez, tal como se escribió. */
  submitted?: Record<string, string>;
  /** Si hay varios formularios iguales en una pantalla, lo que distingue los campos de este. */
  scope?: string;
};

/** El identificador de un campo en la página. El nombre con el que se envía no cambia. */
export function fieldId(name: string, form: FormFeedback): string {
  return form.scope ? `${form.scope}-${name}` : name;
}

export const NO_FEEDBACK: FormFeedback = { errors: {} };

/** Lo que devuelve una Server Action de formulario. `null` antes del primer envío. */
export type FormState = { ok: boolean; message: string; feedback: FormFeedback } | null;

/** Los campos de texto de un formulario, tal como llegaron. */
export function submittedValues(form: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [name, value] of form.entries()) {
    if (typeof value === "string") values[name] = value;
  }
  return values;
}

export function failed(message: string, form: FormData, errors: FieldErrors = {}): NonNullable<FormState> {
  return { ok: false, message, feedback: { errors, submitted: submittedValues(form) } };
}

export function succeeded(message: string): NonNullable<FormState> {
  return { ok: true, message, feedback: NO_FEEDBACK };
}
