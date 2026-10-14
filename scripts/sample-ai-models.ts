/**
 * Una lista de modelos como la que devuelve OpenRouter en `GET /models`, para las pruebas y para la IA
 * simulada. Solo lleva lo que la app usa de cada modelo. Salvo Claude Haiku 5.5, el modelo por defecto, los
 * modelos y sus precios son inventados.
 */

const model = (id: string, name: string, inputs: string[], parameters: string[], prompt: string, completion: string) => ({
  id,
  name,
  architecture: { input_modalities: inputs, output_modalities: ["text"] },
  supported_parameters: parameters,
  pricing: { prompt, completion },
});

const READS_DOCUMENTS = ["text", "image", "file"];
const STRUCTURED = ["max_tokens", "response_format", "structured_outputs"];

export const SAMPLE_OPENROUTER_MODELS = {
  data: [
    model("openai/gpt-prueba", "OpenAI: GPT Prueba", READS_DOCUMENTS, STRUCTURED, "0.00000125", "0.00001"),
    model("anthropic/claude-haiku-5.5", "Anthropic: Claude Haiku 5.5", READS_DOCUMENTS, STRUCTURED, "0.0000001", "0.0000005"),
    model("google/gemini-prueba-flash", "Google: Gemini Prueba Flash", READS_DOCUMENTS, STRUCTURED, "0.00000005", "0.0000002"),
    // Los que no sirven para leer documentos con la app.
    model("anthropic/claude-haiku-5.5:batch", "Anthropic: Claude Haiku 5.5 (batch)", READS_DOCUMENTS, STRUCTURED, "0.00000005", "0.00000025"),
    model("meta/solo-texto", "Meta: Solo Texto", ["text"], STRUCTURED, "0.0000001", "0.0000001"),
    model("mistral/sin-formato", "Mistral: Sin Formato", READS_DOCUMENTS, ["max_tokens"], "0.0000001", "0.0000001"),
    model("openrouter/auto", "Auto Router", READS_DOCUMENTS, STRUCTURED, "-1", "-1"),
  ],
};

/** Una clave que la IA simulada da por buena: empieza como las de verdad. Ninguna clave real empieza así. */
export const SAMPLE_VALID_KEY = "sk-or-v1-prueba-0000000000000000000000000000a1b2";
