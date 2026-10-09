"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createOffer, deleteOffer, setOfferActive, updateOffer } from "@/data/offers";
import { failed, type FormState } from "@/lib/form-state";
import type { Result } from "@/lib/result";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";
import { sectorForms } from "@/sectors/forms";

const idSchema = z.string().min(1).max(64);
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
