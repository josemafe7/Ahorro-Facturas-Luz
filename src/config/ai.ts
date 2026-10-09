/**
 * LA IA, EN UN SOLO SITIO (docs/decisions/0006).
 *
 * La app usa la IA solo para leer documentos. El modelo se pide a OpenRouter: para cambiarlo basta el
 * identificador de abajo, tal como aparece en https://openrouter.ai/models
 */
export const aiConfig = {
  /** El modelo que lee las facturas y los tarifarios. */
  readingModel: "anthropic/claude-haiku-5.5",
  /** Regla F11: si la lectura tarda más, se da por fallida. */
  readingTimeoutMs: 60_000,
  /** Tope de la respuesta de cada lectura: lo que ocupa de sobra una factura o un tarifario. */
  maxOutputTokens: 4_000,
  /** Regla F12: lecturas de IA que puede pedir cada asesor en una hora. */
  maxReadingsPerHour: 30,
} as const;
