import { describe, expect, it } from "vitest";

import { SAMPLE_OPENROUTER_MODELS } from "../../scripts/sample-ai-models";
import { readingModelsFrom } from "./openrouter";

describe("Los modelos de IA que se pueden elegir", () => {
  it("A6 · solo los que leen PDF y fotos y devuelven un formato fijo, con su precio por millón de tokens", () => {
    expect(readingModelsFrom(SAMPLE_OPENROUTER_MODELS)).toEqual([
      { id: "anthropic/claude-haiku-5.5", name: "Anthropic: Claude Haiku 5.5", inputPerMillion: 0.1, outputPerMillion: 0.5 },
      { id: "google/gemini-prueba-flash", name: "Google: Gemini Prueba Flash", inputPerMillion: 0.05, outputPerMillion: 0.2 },
      { id: "openai/gpt-prueba", name: "OpenAI: GPT Prueba", inputPerMillion: 1.25, outputPerMillion: 10 },
    ]);
    // Lo que llega de fuera se comprueba: si no tiene la forma esperada, no se usa.
    expect(readingModelsFrom({ modelos: [] })).toBeNull();
  });
});
