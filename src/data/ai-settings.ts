import "server-only";

import type { LanguageModel } from "ai";
import { z } from "zod";

import { aiConfig } from "@/config/ai";
import { createReadingModel, installationCredentials, type ReadingCredentials } from "@/lib/ai";
import { db } from "@/lib/db";
import type { KeyCheck, ReadingModelOption } from "@/lib/openrouter";
import { invalid, type Result } from "@/lib/result";
import { decryptSecret, encryptSecret } from "@/lib/secrets";

/** Lo que se puede enseñar de la IA de un asesor. Nunca lleva la clave (regla A5). */
export type AiSettings = {
  /** Los cuatro últimos caracteres de la clave del asesor, para reconocerla; `null` si no tiene. */
  keyHint: string | null;
  /** Si hay una clave de la instalación, la de `.env.local`, para cuando el asesor no pone la suya. */
  installationKey: boolean;
  /** El modelo con el que se leen sus documentos. */
  model: string;
};

const KEY_HINT_LENGTH = 4;
const MS_PER_HOUR = 3_600_000;

const apiKeySchema = z.object({
  apiKey: z
    .string({ error: "Pega la clave de OpenRouter" })
    .trim()
    .min(1, "Pega la clave de OpenRouter")
    .max(200, "Eso no parece una clave de OpenRouter")
    .regex(/^\S+$/, "Eso no parece una clave de OpenRouter: no lleva espacios"),
});

const modelSchema = z.string().trim().min(1).max(200);

/** Lo cifrado se ata a su dueño: copiado al registro de otro asesor, no se puede descifrar. */
const owner = (userId: string) => `openrouter:${userId}`;

async function ownApiKey(userId: string): Promise<{ apiKey: string | null; model: string | null }> {
  const row = await db.aiSettings.findUnique({ where: { userId }, select: { encryptedApiKey: true, model: true } });
  const apiKey = row?.encryptedApiKey ? decryptSecret(row.encryptedApiKey, owner(userId)) : null;
  return { apiKey, model: row?.model ?? null };
}

export async function getAiSettings(userId: string): Promise<AiSettings> {
  const { apiKey, model } = await ownApiKey(userId);
  return {
    keyHint: apiKey ? apiKey.slice(-KEY_HINT_LENGTH) : null,
    installationKey: installationCredentials() !== null,
    model: model ?? aiConfig.defaultReadingModel,
  };
}

/** Las comprobaciones de clave de cada asesor en la última hora. Viven en memoria: el límite es por proceso. */
const keyChecks = new Map<string, number[]>();

function mayCheckKey(userId: string): boolean {
  const now = Date.now();
  const recent = (keyChecks.get(userId) ?? []).filter((at) => now - at < MS_PER_HOUR);
  const allowed = recent.length < aiConfig.maxKeyChecksPerHour;
  keyChecks.set(userId, allowed ? [...recent, now] : recent);
  return allowed;
}

/**
 * Regla A5: guarda la clave de OpenRouter del asesor, cifrada, si OpenRouter dice que vale. `checkKey` es la
 * comprobación con OpenRouter; las pruebas la simulan.
 */
export async function saveAiKey(userId: string, input: unknown, checkKey: (apiKey: string) => Promise<KeyCheck>): Promise<Result<{ keyHint: string }>> {
  const parsed = apiKeySchema.safeParse({ apiKey: input });
  if (!parsed.success) return invalid(parsed.error);
  if (!mayCheckKey(userId)) {
    return { ok: false, message: `Has probado demasiadas claves en una hora: como mucho ${aiConfig.maxKeyChecksPerHour}. Inténtalo más tarde.` };
  }

  const { apiKey } = parsed.data;
  const check = await checkKey(apiKey);
  if (check === "unavailable") return { ok: false, message: "No se ha podido comprobar la clave con OpenRouter. Inténtalo en un rato." };
  if (check === "invalid") {
    return {
      ok: false,
      message: "La clave no se ha guardado.",
      fieldErrors: { apiKey: "OpenRouter dice que esta clave no vale. Cópiala otra vez desde openrouter.ai/keys." },
    };
  }

  const encryptedApiKey = encryptSecret(apiKey, owner(userId));
  await db.aiSettings.upsert({ where: { userId }, create: { userId, encryptedApiKey }, update: { encryptedApiKey } });
  return { ok: true, value: { keyHint: apiKey.slice(-KEY_HINT_LENGTH) } };
}

/** Regla A5: quita la clave del asesor. Sus lecturas vuelven a usar la de la instalación, si la hay. */
export async function removeAiKey(userId: string): Promise<Result<null>> {
  await db.aiSettings.updateMany({ where: { userId }, data: { encryptedApiKey: null } });
  return { ok: true, value: null };
}

/**
 * Regla A6: guarda el modelo que elige el asesor, si está entre los que sirven para leer documentos. `models`
 * es la lista de OpenRouter; `null` si no se ha podido conseguir, y entonces no se cambia nada.
 */
export async function saveAiModel(userId: string, input: unknown, models: ReadingModelOption[] | null): Promise<Result<{ model: string }>> {
  if (!models) return { ok: false, message: "No se ha podido cargar la lista de modelos de OpenRouter. Inténtalo en un rato." };

  const parsed = modelSchema.safeParse(input);
  const model = parsed.success ? models.find(({ id }) => id === parsed.data) : undefined;
  if (!model) return { ok: false, message: "Ese modelo no está entre los que pueden leer los documentos." };

  await db.aiSettings.upsert({ where: { userId }, create: { userId, model: model.id }, update: { model: model.id } });
  return { ok: true, value: { model: model.id } };
}

/**
 * Regla A7: con qué se leen los documentos de un asesor. Su clave y su modelo; si no tiene clave, la de la
 * instalación. `null` si no hay ninguna clave: la app lo dice y se sigue a mano (regla F11).
 */
export async function getReadingCredentials(userId: string): Promise<ReadingCredentials | null> {
  const own = await ownApiKey(userId);
  const apiKey = own.apiKey ?? installationCredentials()?.apiKey;
  if (!apiKey) return null;
  return { apiKey, model: own.model ?? aiConfig.defaultReadingModel };
}

/** El modelo que lee los documentos de un asesor, listo para usar. `null` si no hay clave. */
export async function getReadingModel(userId: string): Promise<LanguageModel | null> {
  const credentials = await getReadingCredentials(userId);
  return credentials ? createReadingModel(credentials) : null;
}
