import "server-only";

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

import { aiConfig } from "@/config/ai";

/** Con qué se lee un documento: la clave de OpenRouter que paga la lectura y el modelo que la hace. */
export type ReadingCredentials = { apiKey: string; model: string };

/**
 * La clave de la instalación, la de `.env.local`, con el modelo por defecto. Es la que se usa cuando el
 * asesor no ha puesto la suya en Ajustes (regla A7). `null` si no hay.
 */
export function installationCredentials(): ReadingCredentials | null {
  const apiKey = process.env.OPENROUTER_API_KEY;
  return apiKey ? { apiKey, model: aiConfig.defaultReadingModel } : null;
}

/**
 * El modelo de IA que lee los documentos. La clave solo existe en el servidor. `OPENROUTER_BASE_URL` permite
 * a las pruebas apuntar a un servidor simulado, para no llamar a la IA de verdad.
 */
export function createReadingModel({ apiKey, model }: ReadingCredentials): LanguageModel {
  const openrouter = createOpenRouter({ apiKey, baseURL: process.env.OPENROUTER_BASE_URL });
  return openrouter.chat(model, { usage: { include: true } });
}
