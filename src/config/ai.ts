/**
 * LA IA, EN UN SOLO SITIO (docs/decisions/0006).
 *
 * La app usa la IA solo para leer documentos. El modelo se pide a OpenRouter. Cada asesor puede elegir el
 * suyo en Ajustes (regla A6); si no elige ninguno, se usa el de abajo, con su identificador tal como aparece
 * en https://openrouter.ai/models
 */
export const aiConfig = {
  /** El modelo que lee las facturas y los tarifarios si el asesor no ha elegido otro. */
  defaultReadingModel: "anthropic/claude-haiku-5.5",
  /** Regla F11: si la lectura tarda más, se da por fallida. */
  readingTimeoutMs: 60_000,
  /** Tope de la respuesta de cada lectura: lo que ocupa de sobra una factura o un tarifario. */
  maxOutputTokens: 4_000,
  /** Regla F12: lecturas de IA que puede pedir cada asesor en una hora. */
  maxReadingsPerHour: 30,
  /** Regla A5: claves de OpenRouter que puede comprobar cada asesor en una hora. */
  maxKeyChecksPerHour: 10,
  /** Cada cuánto se vuelve a pedir a OpenRouter la lista de modelos con sus precios, en segundos. */
  modelsCacheSeconds: 3_600,
} as const;
