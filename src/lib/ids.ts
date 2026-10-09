import { z } from "zod";

/**
 * El identificador de un registro tal como llega de fuera, en una dirección o en una acción. Se valida antes
 * de usarlo, como todo lo que llega del usuario (docs/security.md).
 */
export const idSchema = z.string().regex(/^[a-z0-9]{1,64}$/i);

/** El identificador, o `null` si lo que llega no tiene forma de identificador. */
export function parseId(value: unknown): string | null {
  const parsed = idSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
