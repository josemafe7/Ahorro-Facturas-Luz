import "server-only";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

import { aiConfig } from "@/config/ai";

/**
 * El modelo de IA que lee los documentos, o `null` si la app no tiene clave de OpenRouter (regla F11).
 * La clave solo existe en el servidor. `OPENROUTER_BASE_URL` permite a las pruebas apuntar a un servidor
 * simulado, para no llamar a la IA de verdad.
 */
export function getReadingModel(): LanguageModel | null {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const openrouter = createOpenRouter({ apiKey, baseURL: process.env.OPENROUTER_BASE_URL });
  return openrouter.chat(aiConfig.readingModel, { usage: { include: true } });
}
