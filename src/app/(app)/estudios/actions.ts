"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { DOCUMENT_UPLOAD } from "@/data/files";
import { calculateStudy, createStudy, deleteStudy, readStudy, saveStudyDocument, selectStudyOffer, setStudyStatus } from "@/data/studies";
import { getReadingModel } from "@/lib/ai";
import { failed, type FormState } from "@/lib/form-state";
import { idSchema } from "@/lib/ids";
import type { Result } from "@/lib/result";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";
import { sectorForms } from "@/sectors/forms";

const BYTES_PER_MB = 1024 * 1024;
const INVALID_REQUEST = { ok: false, message: "No se ha podido completar." } as const;

/**
 * Recibe la factura subida, crea el estudio y la lee con IA. Si la IA falla, el estudio queda igualmente
 * creado y la pantalla siguiente explica qué ha pasado (regla F11).
 */
export async function createStudyAction(form: FormData): Promise<Result<never>> {
  const user = await requireUser();

  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false, message: "Elige un archivo." };
  // Antes de cargarlo en memoria: un archivo enorme no llega a leerse.
  if (file.size > DOCUMENT_UPLOAD.maxMb * BYTES_PER_MB) {
    return { ok: false, message: `El archivo pasa de ${DOCUMENT_UPLOAD.maxMb} MB. Súbelo más pequeño.` };
  }

  const created = await createStudy(user.id, new Uint8Array(await file.arrayBuffer()));
  if (!created.ok) return created;

  await readStudy(user.id, created.value.id, getReadingModel());
  revalidatePath(routes.studies);
  redirect(routes.study(created.value.id));
}

/** Vuelve a leer con IA la factura de un estudio. */
export async function rereadStudyAction(id: string): Promise<Result<unknown>> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return INVALID_REQUEST;

  const result = await readStudy(user.id, parsedId.data, getReadingModel());
  revalidatePath(routes.study(parsedId.data));
  return result;
}

/** Guarda los datos que el asesor da por buenos, calcula el estudio y enseña la comparativa. */
export async function saveStudyDocumentAction(id: string, _previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return failed(INVALID_REQUEST.message, form);

  const saved = await saveStudyDocument(user.id, parsedId.data, sectorForms.document(form));
  if (!saved.ok) return failed(saved.message, form, saved.fieldErrors);

  // Si no se puede calcular porque no hay ofertas activas (regla C10), la comparativa lo dice y lleva al
  // catálogo: por eso se va a ella en los dos casos.
  await calculateStudy(user.id, parsedId.data);

  revalidatePath(routes.studies);
  redirect(routes.studyComparison(parsedId.data));
}

/** Vuelve a calcular un estudio con el catálogo y los impuestos de ahora. */
export async function recalculateStudyAction(id: string): Promise<Result<unknown>> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return INVALID_REQUEST;

  const result = await calculateStudy(user.id, parsedId.data);
  revalidatePath(routes.studies);
  revalidatePath(routes.studyComparison(parsedId.data));
  return result;
}

const selectOfferSchema = z.object({ studyId: idSchema, offerId: idSchema });

export async function selectStudyOfferAction(input: { studyId: string; offerId: string }): Promise<Result<unknown>> {
  const user = await requireUser();
  const parsed = selectOfferSchema.safeParse(input);
  if (!parsed.success) return INVALID_REQUEST;

  const result = await selectStudyOffer(user.id, parsed.data.studyId, parsed.data.offerId);
  revalidatePath(routes.studies);
  revalidatePath(routes.studyComparison(parsed.data.studyId));
  return result;
}

const setStatusSchema = z.object({ studyId: idSchema, status: z.string().max(20) });

export async function setStudyStatusAction(input: { studyId: string; status: string }): Promise<Result<unknown>> {
  const user = await requireUser();
  const parsed = setStatusSchema.safeParse(input);
  if (!parsed.success) return INVALID_REQUEST;

  const result = await setStudyStatus(user.id, parsed.data.studyId, parsed.data.status);
  revalidatePath(routes.studies);
  revalidatePath(routes.study(parsed.data.studyId));
  return result;
}

/** Borra un estudio con su factura. Lo confirma antes la persona en un diálogo. */
export async function deleteStudyAction(id: string): Promise<Result<unknown>> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return INVALID_REQUEST;

  const result = await deleteStudy(user.id, parsedId.data);
  revalidatePath(routes.studies);
  return result;
}
