import "server-only";

import { z } from "zod";

import { aiConfig } from "@/config/ai";

/**
 * Lo que la app le pregunta a OpenRouter fuera de las lecturas: la lista de modelos con sus precios y si una
 * clave vale. Lo que responde es un dato de fuera: se comprueba antes de usarlo.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1";
const REQUEST_TIMEOUT_MS = 10_000;
const TOKENS_PER_MILLION = 1_000_000;
/** Lo que necesita un modelo para leer documentos con la app: que acepte PDF y fotos y un formato fijo. */
const REQUIRED_INPUTS = ["image", "file"];
const REQUIRED_PARAMETER = "structured_outputs";
/** Las variantes `:batch` son para lotes que tardan horas: no valen para leer un documento al momento. */
const BATCH_SUFFIX = ":batch";

/** La dirección de una ruta de la API. Las pruebas apuntan `OPENROUTER_BASE_URL` a una IA simulada. */
export function openRouterUrl(path: string): string {
  return `${process.env.OPENROUTER_BASE_URL ?? OPENROUTER_API_URL}${path}`;
}

/** Un modelo que se puede elegir, con su precio en dólares por millón de tokens (regla A6). */
export type ReadingModelOption = {
  id: string;
  name: string;
  inputPerMillion: number;
  outputPerMillion: number;
};

const modelsResponseSchema = z.object({
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      architecture: z.object({ input_modalities: z.array(z.string()).optional() }).optional(),
      supported_parameters: z.array(z.string()).nullish(),
      pricing: z.object({ prompt: z.string(), completion: z.string() }),
    }),
  ),
});

/** El precio por token que da OpenRouter, pasado a precio por millón. `null` si no es un precio fijo. */
function perMillion(pricePerToken: string): number | null {
  const price = Number(pricePerToken);
  if (!Number.isFinite(price) || price < 0) return null;
  return Number((price * TOKENS_PER_MILLION).toFixed(6));
}

/**
 * Regla A6: de la lista de modelos de OpenRouter, los que sirven para leer documentos, por orden
 * alfabético. Se quedan fuera los que no aceptan PDF o fotos, los que no devuelven un formato fijo, las
 * variantes por lotes y los que no tienen un precio fijo, como los que reparten entre varios modelos.
 * `null` si la respuesta no tiene la forma esperada.
 */
export function readingModelsFrom(response: unknown): ReadingModelOption[] | null {
  const parsed = modelsResponseSchema.safeParse(response);
  if (!parsed.success) return null;

  return parsed.data.data
    .flatMap((model) => {
      const inputs = model.architecture?.input_modalities ?? [];
      const readsDocuments = REQUIRED_INPUTS.every((input) => inputs.includes(input));
      const structured = model.supported_parameters?.includes(REQUIRED_PARAMETER) ?? false;
      const inputPerMillion = perMillion(model.pricing.prompt);
      const outputPerMillion = perMillion(model.pricing.completion);
      if (!readsDocuments || !structured || model.id.endsWith(BATCH_SUFFIX) || inputPerMillion === null || outputPerMillion === null) {
        return [];
      }
      return [{ id: model.id, name: model.name, inputPerMillion, outputPerMillion }];
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}

/** Los modelos que se pueden elegir. Se guardan una hora. `null` si OpenRouter no responde o responde mal. */
export async function fetchReadingModels(): Promise<ReadingModelOption[] | null> {
  try {
    const response = await fetch(openRouterUrl("/models"), {
      next: { revalidate: aiConfig.modelsCacheSeconds },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return readingModelsFrom(await response.json());
  } catch {
    return null;
  }
}

/** Lo que dice OpenRouter de una clave: que vale, que no vale o que no ha podido saberse. */
export type KeyCheck = "valid" | "invalid" | "unavailable";

const UNAUTHORIZED = [401, 403];

/** Regla A5: pregunta a OpenRouter si una clave vale, antes de guardarla. No gasta saldo. */
export async function checkOpenRouterKey(apiKey: string): Promise<KeyCheck> {
  try {
    const response = await fetch(openRouterUrl("/key"), {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.ok) return "valid";
    return UNAUTHORIZED.includes(response.status) ? "invalid" : "unavailable";
  } catch {
    return "unavailable";
  }
}
