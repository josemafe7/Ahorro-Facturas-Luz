import { generateText, Output, type LanguageModel } from "ai";
import type { z } from "zod";

import type { Doubt, Draft } from "./types";

/** Lo que un sector le pide a la IA que lea de un documento, y cómo se interpreta lo leído. */
export type Reader<TRaw, TInterpreted> = {
  /** Qué tiene que leer y con qué reglas. */
  instructions: string;
  /** El formato exacto de la respuesta. Lo que no lo cumpla se descarta (regla F9). */
  schema: z.ZodType<TRaw>;
  /** Convierte la respuesta de la IA en lo que usa la app. Aquí no hay IA: es código. */
  interpret(raw: TRaw): TInterpreted;
};

/** Un documento leído: si es lo que se esperaba, sus datos y cuáles conviene revisar. */
export type DocumentReading<TDocument> = {
  recognized: boolean;
  draft: Draft<TDocument>;
  doubts: Doubt[];
};

export type ReadableFile = { data: Uint8Array; mediaType: string };

export type ReadingLimits = { timeoutMs: number; maxOutputTokens: number };

/** Lo que consumió la lectura, para poder medir su coste. */
export type ReadingUsage = { inputTokens: number | undefined; outputTokens: number | undefined; costUsd: number | undefined };

export type ReadingOutcome<T> = { ok: true; value: T; usage: ReadingUsage } | { ok: false };

const USER_MESSAGE = "Lee el documento adjunto y devuelve sus datos con el formato pedido.";

function costFrom(providerMetadata: unknown): number | undefined {
  const cost = (providerMetadata as { openrouter?: { usage?: { cost?: unknown } } } | undefined)?.openrouter?.usage?.cost;
  return typeof cost === "number" ? cost : undefined;
}

/**
 * Lee un documento con la IA. La IA no tiene herramientas ni permisos: recibe el documento y devuelve datos
 * con un formato fijo, que se valida antes de usarlo. Cualquier fallo (la IA no responde, tarda demasiado o
 * devuelve otra cosa) se trata igual: la lectura no ha salido (reglas F9 y F11).
 */
export async function readWithAi<TRaw, TInterpreted>(
  model: LanguageModel,
  reader: Reader<TRaw, TInterpreted>,
  file: ReadableFile,
  limits: ReadingLimits,
): Promise<ReadingOutcome<TInterpreted>> {
  try {
    const { output, usage, providerMetadata } = await generateText({
      model,
      instructions: reader.instructions,
      output: Output.object({ schema: reader.schema }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: USER_MESSAGE },
            { type: "file", mediaType: file.mediaType, data: file.data },
          ],
        },
      ],
      maxOutputTokens: limits.maxOutputTokens,
      timeout: limits.timeoutMs,
      maxRetries: 1,
    });

    return {
      ok: true,
      value: reader.interpret(output),
      usage: { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens, costUsd: costFrom(providerMetadata) },
    };
  } catch (error) {
    // Solo el tipo de error: el mensaje puede traer trozos del documento, que lleva datos personales.
    console.error("Lectura con IA fallida:", error instanceof Error ? error.name : "error desconocido");
    return { ok: false };
  }
}
