import "server-only";

import type { LanguageModel } from "ai";

import { aiConfig } from "@/config/ai";
import { readWithAi } from "@/engine/reading";
import type { Draft } from "@/engine/types";
import type { Result } from "@/lib/result";
import { sector, type SectorOffer } from "@/sectors";

import { startAiReading } from "./ai-readings";
import { checkUpload, DOCUMENT_UPLOAD } from "./files";

/** Cómo ha ido la lectura de un tarifario. */
export type OffersImportStatus = "read" | "empty" | "failed" | "limit" | "not-configured";

/** Una tarifa propuesta por la IA: sus datos y por qué conviene revisar cada campo dudoso. */
export type ImportedOffer = { draft: Draft<SectorOffer>; doubts: Record<string, string> };

export type OffersImport = { status: OffersImportStatus; proposals: ImportedOffer[] };

/**
 * Regla T5: lee con IA el tarifario de una comercializadora y propone sus tarifas. No guarda nada, ni el
 * archivo ni las tarifas: se guardan una a una cuando el asesor las revisa. Cuenta para el límite de
 * lecturas de IA igual que una factura (regla F12).
 */
export async function readOffersDocument(userId: string, bytes: Uint8Array, model: LanguageModel | null): Promise<Result<OffersImport>> {
  const checked = checkUpload(bytes, DOCUMENT_UPLOAD);
  if (!checked.ok) return checked;

  const done = (status: OffersImportStatus, proposals: ImportedOffer[] = []) => ({ ok: true, value: { status, proposals } }) as const;

  if (!model) return done("not-configured");
  if (!(await startAiReading(userId))) return done("limit");

  const outcome = await readWithAi(model, sector.offersReader, { data: bytes, mediaType: checked.value.mimeType }, {
    timeoutMs: aiConfig.readingTimeoutMs,
    maxOutputTokens: aiConfig.maxOutputTokens,
  });
  if (!outcome.ok) return done("failed");

  const proposals = outcome.value.offers.map(({ draft, doubts }) => ({
    draft,
    doubts: Object.fromEntries(doubts.map(({ field, reason }) => [field, reason])),
  }));
  return done(proposals.length === 0 ? "empty" : "read", proposals);
}
