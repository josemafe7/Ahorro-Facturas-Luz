import "server-only";

import type { LanguageModel } from "ai";
import { z } from "zod";

import { aiConfig } from "@/config/ai";
import { readWithAi } from "@/engine/reading";
import type { Doubt, Draft } from "@/engine/types";
import { db } from "@/lib/db";
import { invalid, parseJson, type Result } from "@/lib/result";
import { sector, type SectorDocument } from "@/sectors";

import { startAiReading } from "./ai-readings";
import { DOCUMENT_UPLOAD, getFile, saveUpload, type StoredFileRef } from "./files";

export const STUDY_STATUSES = ["draft", "sent", "accepted", "contracted"] as const;
export type StudyStatus = (typeof STUDY_STATUSES)[number];

/** Cómo fue la última lectura con IA de un estudio. */
export const READING_STATUSES = ["read", "not-recognized", "failed", "limit", "not-configured"] as const;
export type ReadingStatus = (typeof READING_STATUSES)[number];

/** Por qué conviene revisar cada campo dudoso: `{ "energyKwh.p2": "La cifra está borrosa" }`. */
export type Doubts = Record<string, string>;

/** Un estudio, tal como lo necesitan sus pantallas. */
export type StudyDetail = {
  id: string;
  status: StudyStatus;
  customerName: string | null;
  createdAt: Date;
  file: StoredFileRef | null;
  readingStatus: ReadingStatus | null;
  /** Los datos del documento tal como están ahora, revisados o no. */
  draft: Draft<SectorDocument>;
  doubts: Doubts;
  /** Si el asesor ya ha dado los datos por buenos. Sin eso no hay cálculo. */
  reviewed: boolean;
};

/** Un estudio en la lista. */
export type StudyRow = {
  id: string;
  status: StudyStatus;
  customerName: string | null;
  createdAt: Date;
  reviewed: boolean;
};

/** El mismo mensaje si no existe y si es de otro asesor: no se revela cuál de las dos. */
const NOT_FOUND = { ok: false, message: "No existe o no es tuyo." } as const;

const doubtsSchema = z.record(z.string(), z.string());

const ownStudy = (userId: string, id: string) => ({ id, userId, sector: sector.id });

function toDoubts(doubts: Doubt[]): Doubts {
  return Object.fromEntries(doubts.map(({ field, reason }) => [field, reason]));
}

function oneOf<T extends string>(values: readonly T[], value: string | null): T | null {
  return values.find((candidate) => candidate === value) ?? null;
}

/**
 * Reglas F1 y F2: comprueba la factura subida, la guarda en privado y crea su estudio en borrador. Si la
 * factura no vale, no se guarda nada.
 */
export async function createStudy(userId: string, bytes: Uint8Array): Promise<Result<{ id: string }>> {
  const upload = await saveUpload(userId, bytes, DOCUMENT_UPLOAD);
  if (!upload.ok) return upload;

  const study = await db.study.create({
    data: { userId, sector: sector.id, fileId: upload.value.id },
    select: { id: true },
  });
  return { ok: true, value: study };
}

/**
 * Lee con IA la factura de un estudio y deja la propuesta como borrador para revisar (reglas F3, F5 y F9 a
 * F12). `model` es `null` si la app no tiene la IA configurada. Pase lo que pase con la IA, el estudio y su
 * factura se conservan: lo que cambia es `readingStatus`.
 */
export async function readStudy(
  userId: string,
  id: string,
  model: LanguageModel | null,
): Promise<Result<{ status: ReadingStatus }>> {
  const study = await db.study.findFirst({ where: ownStudy(userId, id), select: { fileId: true } });
  if (!study?.fileId) return NOT_FOUND;

  const finish = async (status: ReadingStatus, data: { draft?: string; doubts?: string; customerName?: string } = {}) => {
    await db.study.update({ where: { id }, data: { readingStatus: status, ...data } });
    return { ok: true, value: { status } } as const;
  };

  if (!model) return finish("not-configured");
  if (!(await startAiReading(userId))) return finish("limit");

  const file = await getFile(userId, study.fileId);
  if (!file) return NOT_FOUND;

  const outcome = await readWithAi(model, sector.documentReader, { data: file.bytes, mediaType: file.mimeType }, {
    timeoutMs: aiConfig.readingTimeoutMs,
    maxOutputTokens: aiConfig.maxOutputTokens,
  });
  if (!outcome.ok) return finish("failed");
  if (!outcome.value.recognized) return finish("not-recognized", { draft: "{}", doubts: "{}" });

  return finish("read", {
    draft: JSON.stringify(outcome.value.draft),
    doubts: JSON.stringify(toDoubts(outcome.value.doubts)),
    customerName: sector.customerName(outcome.value.draft),
  });
}

/** Regla R1: un estudio con todos sus datos y sus dudas. `null` si no existe o es de otro asesor. */
export async function getStudy(userId: string, id: string): Promise<StudyDetail | null> {
  const study = await db.study.findFirst({
    where: ownStudy(userId, id),
    select: {
      id: true,
      status: true,
      customerName: true,
      createdAt: true,
      readingStatus: true,
      draft: true,
      doubts: true,
      reviewedAt: true,
      file: { select: { id: true, mimeType: true } },
    },
  });
  if (!study) return null;

  const draft = sector.draftSchema.safeParse(parseJson(study.draft));
  const doubts = doubtsSchema.safeParse(parseJson(study.doubts));
  return {
    id: study.id,
    status: oneOf(STUDY_STATUSES, study.status) ?? "draft",
    customerName: study.customerName,
    createdAt: study.createdAt,
    file: study.file,
    readingStatus: oneOf(READING_STATUSES, study.readingStatus),
    draft: draft.success ? draft.data : {},
    doubts: doubts.success ? doubts.data : {},
    reviewed: study.reviewedAt !== null,
  };
}

/**
 * Reglas R2 y R3: guarda los datos que el asesor da por buenos. Si falta o no es válido alguno necesario,
 * no se guarda nada y se señala cuál. Al guardar se quitan las dudas ya revisadas y quedan solo las que la
 * app sigue viendo en los datos.
 */
export async function saveStudyDocument(userId: string, id: string, input: unknown): Promise<Result<{ document: SectorDocument }>> {
  const exists = await db.study.findFirst({ where: ownStudy(userId, id), select: { id: true } });
  if (!exists) return NOT_FOUND;

  const parsed = sector.documentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const document = parsed.data;
  await db.study.update({
    where: { id },
    data: {
      draft: JSON.stringify(document),
      doubts: JSON.stringify(toDoubts(sector.findDoubts(document))),
      customerName: sector.customerName(document),
      reviewedAt: new Date(),
    },
  });
  return { ok: true, value: { document } };
}

/** Regla L1: los estudios del asesor, los más recientes primero. */
export async function listStudies(userId: string): Promise<StudyRow[]> {
  const studies = await db.study.findMany({
    where: { userId, sector: sector.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, customerName: true, createdAt: true, reviewedAt: true },
  });
  return studies.map(({ reviewedAt, status, ...study }) => ({
    ...study,
    status: oneOf(STUDY_STATUSES, status) ?? "draft",
    reviewed: reviewedAt !== null,
  }));
}
