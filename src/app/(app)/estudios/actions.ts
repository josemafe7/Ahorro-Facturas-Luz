"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { DOCUMENT_UPLOAD } from "@/data/files";
import { createStudy, readStudy, saveStudyDocument } from "@/data/studies";
import { getReadingModel } from "@/lib/ai";
import { failed, succeeded, type FormState } from "@/lib/form-state";
import type { Result } from "@/lib/result";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";
import { sectorForms } from "@/sectors/forms";

const BYTES_PER_MB = 1024 * 1024;
const idSchema = z.string().min(1).max(64);
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

/** Guarda los datos que el asesor da por buenos. */
export async function saveStudyDocumentAction(id: string, _previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return failed(INVALID_REQUEST.message, form);

  const result = await saveStudyDocument(user.id, parsedId.data, sectorForms.document(form));
  if (!result.ok) return failed(result.message, form, result.fieldErrors);

  revalidatePath(routes.studies);
  revalidatePath(routes.study(parsedId.data));
  return succeeded("Datos guardados.");
}
