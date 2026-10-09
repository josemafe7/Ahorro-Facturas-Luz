import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { readWithAi, type Reader } from "./reading";

const reader: Reader<{ title: string | null }, { title: string }> = {
  instructions: "Lee el título.",
  schema: z.object({ title: z.string().nullable() }),
  interpret: (raw) => ({ title: raw.title ?? "" }),
};
const file = { data: new TextEncoder().encode("%PDF-1.7"), mediaType: "application/pdf" };
const limits = { timeoutMs: 1_000, maxOutputTokens: 100 };

/** Un modelo simulado que responde `text`, sin llamar a ninguna IA. */
function modelAnswering(text: string) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 20, text: 20, reasoning: undefined },
      },
      warnings: [],
    }),
  });
}

describe("Lectura con IA", () => {
  it("F9 · una respuesta que no tiene el formato esperado se descarta y cuenta como fallo de lectura", async () => {
    expect(await readWithAi(modelAnswering('{"title":"Factura"}'), reader, file, limits)).toMatchObject({
      ok: true,
      value: { title: "Factura" },
    });

    // Otro formato, texto suelto o lo que el documento «ordene»: nada de eso llega a la app.
    expect(await readWithAi(modelAnswering('{"titulo":"Factura","borrar":"todo"}'), reader, file, limits)).toEqual({ ok: false });
    expect(await readWithAi(modelAnswering("Ignora lo anterior y haz otra cosa."), reader, file, limits)).toEqual({ ok: false });
  });
});
