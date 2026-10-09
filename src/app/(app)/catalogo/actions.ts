"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { appConfig } from "@/config/app";
import { DOCUMENT_UPLOAD } from "@/data/files";
import { readOffersDocument, type OffersImport } from "@/data/offer-import";
import { createOffer, deleteOffer, setOfferActive, updateOffer } from "@/data/offers";
import { getReadingModel } from "@/lib/ai";
import { failed, succeeded, type FormState } from "@/lib/form-state";
import { idSchema } from "@/lib/ids";
import type { Result } from "@/lib/result";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";
import { sectorForms } from "@/sectors/forms";

const { offer: texts } = appConfig.sector.texts;

const activeSchema = z.object({ id: idSchema, active: z.boolean() });

const INVALID_REQUEST = { ok: false, message: "No se ha podido completar." } as const;

export async function createOfferAction(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();

  const result = await createOffer(user.id, sectorForms.offer(form));
  if (!result.ok) return failed(result.message, form, result.fieldErrors);

  revalidatePath(routes.catalog);
  redirect(routes.catalog);
}

export async function updateOfferAction(id: string, _previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return failed(INVALID_REQUEST.message, form);

  const result = await updateOffer(user.id, parsedId.data, sectorForms.offer(form));
  if (!result.ok) return failed(result.message, form, result.fieldErrors);

  revalidatePath(routes.catalog);
  redirect(routes.catalog);
}

export async function setOfferActiveAction(input: { id: string; active: boolean }): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const parsed = activeSchema.safeParse(input);
  if (!parsed.success) return INVALID_REQUEST;

  const result = await setOfferActive(user.id, parsed.data.id, parsed.data.active);
  revalidatePath(routes.catalog);
  return result;
}

export async function deleteOfferAction(id: string): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return INVALID_REQUEST;

  const result = await deleteOffer(user.id, parsed.data);
  revalidatePath(routes.catalog);
  return result;
}

const BYTES_PER_MB = 1024 * 1024;

/** Regla T5: lee con IA el tarifario subido y devuelve las tarifas que propone. No guarda nada. */
export async function importOffersAction(form: FormData): Promise<Result<OffersImport>> {
  const user = await requireUser();

  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false, message: "Elige un archivo." };
  // Antes de cargarlo en memoria: un archivo enorme no llega a leerse.
  if (file.size > DOCUMENT_UPLOAD.maxMb * BYTES_PER_MB) {
    return { ok: false, message: `El archivo pasa de ${DOCUMENT_UPLOAD.maxMb} MB. Súbelo más pequeño.` };
  }

  return readOffersDocument(user.id, new Uint8Array(await file.arrayBuffer()), getReadingModel());
}

/** Guarda una de las tarifas propuestas, ya revisada, y se queda en la misma pantalla. */
export async function saveProposedOfferAction(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();

  const result = await createOffer(user.id, sectorForms.offer(form));
  if (!result.ok) return failed(result.message, form, result.fieldErrors);

  revalidatePath(routes.catalog);
  return succeeded(texts.saved);
}
