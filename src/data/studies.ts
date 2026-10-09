import "server-only";

import type { LanguageModel } from "ai";
import { z } from "zod";

import { aiConfig } from "@/config/ai";
import { appConfig } from "@/config/app";
import { buildCalculation, calculationSchema, savingOffers, type CalculatedOffer, type Calculation } from "@/engine/calculation";
import { readWithAi, type DocumentReading } from "@/engine/reading";
import type { Doubt, Draft } from "@/engine/types";
import { db } from "@/lib/db";
import { invalid, parseJson, type Result } from "@/lib/result";
import { sector, type SectorDocument } from "@/sectors";

import { startAiReading } from "./ai-readings";
import { deleteFile, DOCUMENT_UPLOAD, getFile, saveUpload, type StoredFileRef } from "./files";
import { listActiveOffers } from "./offers";
import { getSettings } from "./settings";
import { STUDY_STATUSES, type StudyStatus } from "./study-status";

export { STUDY_STATUSES, type StudyStatus } from "./study-status";

const { texts } = appConfig.sector;

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
  /** El cálculo guardado, si ya se ha calculado. */
  calculation: Calculation | null;
  /** La oferta elegida para el estudio. `null` si no hay cálculo o ninguna oferta ahorra. */
  selectedOfferId: string | null;
};

/** Un estudio en la lista (regla L1). */
export type StudyRow = {
  id: string;
  status: StudyStatus;
  customerName: string | null;
  createdAt: Date;
  proposedOffer: string | null;
  yearSavingsCents: number | null;
};

/** El mismo mensaje si no existe y si es de otro asesor: no se revela cuál de las dos. */
const NOT_FOUND = { ok: false, message: "No existe o no es tuyo." } as const;
const ALREADY_REVIEWED = { ok: false, message: "Ya has revisado estos datos: corrígelos a mano." } as const;

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
 *
 * Regla F13: solo se lee mientras el estudio está sin revisar. Lo que el asesor ya ha dado por bueno no lo
 * sustituye una lectura, porque se calcularía con datos que nadie ha mirado.
 */
export async function readStudy(
  userId: string,
  id: string,
  model: LanguageModel | null,
): Promise<Result<{ status: ReadingStatus }>> {
  const study = await db.study.findFirst({ where: ownStudy(userId, id), select: { fileId: true, reviewedAt: true } });
  if (!study?.fileId) return NOT_FOUND;
  if (study.reviewedAt) return ALREADY_REVIEWED;

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

  return finish("read", readingData(outcome.value));
}

/** Lo que se guarda de un documento leído: sus datos, sus dudas y a nombre de quién está. */
function readingData(reading: DocumentReading<SectorDocument>) {
  return {
    draft: JSON.stringify(reading.draft),
    doubts: JSON.stringify(toDoubts(reading.doubts)),
    customerName: sector.customerName(reading.draft),
  };
}

/**
 * Deja en un estudio sin revisar una lectura ya hecha, como si la acabara de proponer la IA. Lo usan los
 * datos de ejemplo, que no llaman a la IA.
 */
export async function saveStudyReading(userId: string, id: string, reading: DocumentReading<SectorDocument>): Promise<Result<{ id: string }>> {
  const { count } = await db.study.updateMany({
    where: { ...ownStudy(userId, id), reviewedAt: null },
    data: { readingStatus: "read", ...readingData(reading) },
  });
  return count === 0 ? NOT_FOUND : { ok: true, value: { id } };
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
      calculation: true,
      selectedOfferId: true,
      file: { select: { id: true, mimeType: true } },
    },
  });
  if (!study) return null;

  const draft = sector.draftSchema.safeParse(parseJson(study.draft));
  const doubts = doubtsSchema.safeParse(parseJson(study.doubts));
  const calculation = study.calculation === null ? null : calculationSchema.safeParse(parseJson(study.calculation));
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
    calculation: calculation?.success ? calculation.data : null,
    selectedOfferId: study.selectedOfferId,
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
      // El cálculo que hubiera salió de otros datos: ya no vale hasta que se vuelva a calcular.
      calculation: null,
      ...selection(null),
    },
  });
  return { ok: true, value: { document } };
}

/** Regla L1: los estudios del asesor, los más recientes primero. */
export async function listStudies(userId: string): Promise<StudyRow[]> {
  const studies = await db.study.findMany({
    where: { userId, sector: sector.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, status: true, customerName: true, createdAt: true, proposedOffer: true, yearSavingsCents: true },
  });
  return studies.map(({ status, ...study }) => ({ ...study, status: oneOf(STUDY_STATUSES, status) ?? "draft" }));
}

/** Lo que se guarda de la oferta elegida: cuál es y, para la lista, su nombre y su ahorro anual. */
function selection(offer: CalculatedOffer | null) {
  return {
    selectedOfferId: offer?.id ?? null,
    proposedOffer: offer?.label ?? null,
    yearSavingsCents: offer?.savings.yearCents ?? null,
  };
}

/**
 * Calcula un estudio ya revisado contra las tarifas activas del asesor, con sus impuestos de ahora, y guarda
 * el resultado (reglas C8 a C12). Propone la tarifa de mayor ahorro (regla P1); si ninguna ahorra, ninguna,
 * y el estudio vuelve a borrador (regla L3). Sin ninguna tarifa activa no calcula nada (regla C10).
 */
export async function calculateStudy(userId: string, id: string): Promise<Result<{ calculation: Calculation }>> {
  const study = await db.study.findFirst({
    where: ownStudy(userId, id),
    select: { draft: true, reviewedAt: true, status: true, calculation: true },
  });
  if (!study) return NOT_FOUND;

  const document = sector.documentSchema.safeParse(parseJson(study.draft));
  if (!study.reviewedAt || !document.success) return { ok: false, message: "Revisa y guarda los datos antes de calcular." };

  const [offers, settings] = await Promise.all([listActiveOffers(userId), getSettings(userId)]);
  if (offers.length === 0) {
    // Regla C10: no se calcula, y lo que hubiera calculado se queda como estaba. Regla L3: si no hay cálculo,
    // el estudio solo puede ser borrador.
    if (study.calculation === null) await db.study.update({ where: { id }, data: { status: "draft" } });
    return { ok: false, message: texts.offer.noneActive };
  }
  const calculation = buildCalculation(sector, document.data, offers, settings);
  const best = savingOffers(calculation)[0] ?? null;

  await db.study.update({
    where: { id },
    data: { calculation: JSON.stringify(calculation), ...selection(best), status: best ? study.status : "draft" },
  });
  return { ok: true, value: { calculation } };
}

/** Regla P1: el asesor elige para el estudio otra de las tarifas que ahorran. */
export async function selectStudyOffer(userId: string, id: string, offerId: string): Promise<Result<{ id: string }>> {
  const study = await getStudy(userId, id);
  if (!study?.calculation) return NOT_FOUND;

  const offer = savingOffers(study.calculation).find((candidate) => candidate.id === offerId);
  if (!offer) return { ok: false, message: texts.offer.notSaving };

  await db.study.update({ where: { id }, data: selection(offer) });
  return { ok: true, value: { id } };
}

/** Reglas L2 y L3: el asesor cambia el estado a mano. Sin una tarifa propuesta, solo puede ser borrador. */
export async function setStudyStatus(userId: string, id: string, status: string): Promise<Result<{ status: StudyStatus }>> {
  const next = oneOf(STUDY_STATUSES, status);
  if (!next) return { ok: false, message: "Ese estado no existe." };

  const study = await db.study.findFirst({ where: ownStudy(userId, id), select: { selectedOfferId: true } });
  if (!study) return NOT_FOUND;
  if (next !== "draft" && !study.selectedOfferId) {
    return { ok: false, message: texts.study.calculateFirst };
  }

  await db.study.update({ where: { id }, data: { status: next } });
  return { ok: true, value: { status: next } };
}

/** Regla L5: borra un estudio con todos sus datos y la factura guardada. */
export async function deleteStudy(userId: string, id: string): Promise<Result<{ id: string }>> {
  const study = await db.study.findFirst({ where: ownStudy(userId, id), select: { fileId: true } });
  if (!study) return NOT_FOUND;

  await db.study.delete({ where: { id } });
  if (study.fileId) await deleteFile(userId, study.fileId);
  return { ok: true, value: { id } };
}
