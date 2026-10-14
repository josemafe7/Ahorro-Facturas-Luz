import { afterEach, describe, expect, it, vi } from "vitest";

import { aiConfig } from "@/config/ai";
import { db } from "@/lib/db";
import { readingModelsFrom, type KeyCheck } from "@/lib/openrouter";
import { createTestAdvisor } from "@/test/users";

import { SAMPLE_OPENROUTER_MODELS } from "../../scripts/sample-ai-models";
import { getAiSettings, getReadingCredentials, removeAiKey, saveAiKey, saveAiModel } from "./ai-settings";

const KEY = "sk-or-v1-0123456789abcdef0123456789abcdefd4e5";
const MODELS = readingModelsFrom(SAMPLE_OPENROUTER_MODELS)!;

/** OpenRouter simulado: responde siempre lo mismo y apunta qué claves le han llegado. */
function openRouterSays(answer: KeyCheck) {
  return vi.fn<(apiKey: string) => Promise<KeyCheck>>(async () => answer);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("La clave de OpenRouter", () => {
  it("A5 · se comprueba antes de guardarla, se guarda cifrada y nunca se vuelve a enseñar; se puede quitar", async () => {
    const advisor = await createTestAdvisor();

    // Una clave que OpenRouter no reconoce no se guarda, y la app lo dice en su campo.
    const rejected = await saveAiKey(advisor.id, "sk-or-v1-mal-copiada", openRouterSays("invalid"));
    expect(rejected).toMatchObject({ ok: false, fieldErrors: { apiKey: expect.stringContaining("no vale") } });
    expect((await getAiSettings(advisor.id)).keyHint).toBeNull();

    // Una buena se guarda, sin los espacios que se cuelan al pegarla…
    const checked = openRouterSays("valid");
    expect((await saveAiKey(advisor.id, `  ${KEY} `, checked)).ok).toBe(true);
    expect(checked).toHaveBeenCalledWith(KEY);
    // …cifrada: en la base de datos no está tal cual…
    const stored = await db.aiSettings.findUniqueOrThrow({ where: { userId: advisor.id } });
    expect(JSON.stringify(stored)).not.toContain(KEY.slice(9, 30));
    // …y lo único que se enseña es que está puesta y sus cuatro últimos caracteres.
    const settings = await getAiSettings(advisor.id);
    expect(settings).toMatchObject({ keyHint: "d4e5" });
    expect(JSON.stringify(settings)).not.toContain(KEY.slice(9, 30));
    expect((await getReadingCredentials(advisor.id))?.apiKey).toBe(KEY);

    expect((await removeAiKey(advisor.id)).ok).toBe(true);
    expect((await getAiSettings(advisor.id)).keyHint).toBeNull();
    expect(await getReadingCredentials(advisor.id)).toBeNull();
  });

  it("A5 · como mucho 10 comprobaciones de clave por hora y asesor", async () => {
    const advisor = await createTestAdvisor();
    const check = openRouterSays("invalid");

    for (let attempt = 0; attempt < aiConfig.maxKeyChecksPerHour; attempt++) {
      await saveAiKey(advisor.id, `sk-or-v1-intento-${attempt}`, check);
    }
    const blocked = await saveAiKey(advisor.id, "sk-or-v1-un-intento-mas", check);

    expect(blocked).toMatchObject({ ok: false, message: expect.stringContaining("Has probado demasiadas claves") });
    expect(check).toHaveBeenCalledTimes(aiConfig.maxKeyChecksPerHour);
  });
});

describe("El modelo de IA", () => {
  it("A6 · se elige uno de la lista y no se guarda uno que no esté en ella", async () => {
    const advisor = await createTestAdvisor();
    expect((await getAiSettings(advisor.id)).model).toBe(aiConfig.defaultReadingModel);

    expect((await saveAiModel(advisor.id, "google/gemini-prueba-flash", MODELS)).ok).toBe(true);
    expect((await getAiSettings(advisor.id)).model).toBe("google/gemini-prueba-flash");

    // Ni uno que no sirve para leer documentos, ni cualquier cosa si OpenRouter no da la lista.
    expect((await saveAiModel(advisor.id, "meta/solo-texto", MODELS)).ok).toBe(false);
    expect((await saveAiModel(advisor.id, "openai/gpt-prueba", null)).ok).toBe(false);
    expect((await getAiSettings(advisor.id)).model).toBe("google/gemini-prueba-flash");
  });
});

describe("Con qué se lee", () => {
  it("A7 · cada lectura usa la clave y el modelo del asesor; sin clave propia, la de la instalación", async () => {
    const advisor = await createTestAdvisor();

    // Sin ninguna clave no hay con qué leer: la app lo dice y se sigue a mano (regla F11).
    expect(await getReadingCredentials(advisor.id)).toBeNull();

    vi.stubEnv("OPENROUTER_API_KEY", "sk-or-v1-de-la-instalacion");
    expect(await getReadingCredentials(advisor.id)).toEqual({ apiKey: "sk-or-v1-de-la-instalacion", model: aiConfig.defaultReadingModel });
    expect(await getAiSettings(advisor.id)).toMatchObject({ keyHint: null, installationKey: true });

    await saveAiKey(advisor.id, KEY, openRouterSays("valid"));
    await saveAiModel(advisor.id, "openai/gpt-prueba", MODELS);
    expect(await getReadingCredentials(advisor.id)).toEqual({ apiKey: KEY, model: "openai/gpt-prueba" });

    // Si lo guardado se estropea o se cifró con otra llave, no se usa: se vuelve a la de la instalación.
    await db.aiSettings.update({ where: { userId: advisor.id }, data: { encryptedApiKey: "v1:estropeada:del:todo" } });
    expect(await getReadingCredentials(advisor.id)).toEqual({ apiKey: "sk-or-v1-de-la-instalacion", model: "openai/gpt-prueba" });
    expect((await getAiSettings(advisor.id)).keyHint).toBeNull();
  });

  it("Permisos · la clave y el modelo de un asesor no los ve, no los usa ni los cambia otro", async () => {
    const owner = await createTestAdvisor("Dueña");
    const other = await createTestAdvisor("Otro");
    await saveAiKey(owner.id, KEY, openRouterSays("valid"));
    await saveAiModel(owner.id, "openai/gpt-prueba", MODELS);

    expect(await getAiSettings(other.id)).toMatchObject({ keyHint: null, model: aiConfig.defaultReadingModel });
    expect(await getReadingCredentials(other.id)).toBeNull();

    await removeAiKey(other.id);
    await saveAiModel(other.id, "google/gemini-prueba-flash", MODELS);
    expect(await getReadingCredentials(owner.id)).toEqual({ apiKey: KEY, model: "openai/gpt-prueba" });
  });
});
