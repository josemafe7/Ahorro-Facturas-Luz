"use server";

import { revalidatePath } from "next/cache";

import { removeAiKey, saveAiKey, saveAiModel } from "@/data/ai-settings";
import { removeBrandLogo, saveBrand, saveBrandLogo } from "@/data/brand";
import { LOGO_UPLOAD } from "@/data/files";
import { saveSettings } from "@/data/settings";
import { failed, succeeded, type FormState } from "@/lib/form-state";
import { checkOpenRouterKey, fetchReadingModels } from "@/lib/openrouter";
import type { Result } from "@/lib/result";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";
import { sectorForms } from "@/sectors/forms";

export async function saveTaxSettingsAction(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();

  const result = await saveSettings(user.id, sectorForms.settings(form));
  if (!result.ok) return failed(result.message, form, result.fieldErrors);

  revalidatePath(routes.settings);
  return succeeded("Impuestos y cargos guardados.");
}

const BYTES_PER_MB = 1024 * 1024;

export async function saveBrandAction(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();

  const result = await saveBrand(user.id, Object.fromEntries(["businessName", "color", "phone", "email", "website"].map((field) => [field, form.get(field)])));
  if (!result.ok) return failed(result.message, form, result.fieldErrors);

  revalidatePath(routes.settings);
  return succeeded("Marca guardada.");
}

export async function saveBrandLogoAction(form: FormData): Promise<Result<unknown>> {
  const user = await requireUser();

  const file = form.get("file");
  if (!(file instanceof File)) return { ok: false, message: "Elige una imagen." };
  // Antes de cargarla en memoria: un archivo enorme no llega a leerse.
  if (file.size > LOGO_UPLOAD.maxMb * BYTES_PER_MB) {
    return { ok: false, message: `El archivo pasa de ${LOGO_UPLOAD.maxMb} MB. Súbelo más pequeño.` };
  }

  const result = await saveBrandLogo(user.id, new Uint8Array(await file.arrayBuffer()));
  revalidatePath(routes.settings);
  return result;
}

export async function removeBrandLogoAction(): Promise<void> {
  const user = await requireUser();
  await removeBrandLogo(user.id);
  revalidatePath(routes.settings);
}

/** Regla A5: comprueba la clave de OpenRouter del asesor y, si vale, la guarda cifrada. */
export async function saveAiKeyAction(_previous: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();

  const result = await saveAiKey(user.id, form.get("apiKey"), checkOpenRouterKey);
  // Lo escrito no se devuelve al navegador ni para volver a ponerlo en su campo: la clave no sale del servidor.
  if (!result.ok) return failed(result.message, new FormData(), result.fieldErrors);

  revalidatePath(routes.settings);
  return succeeded("Clave guardada.");
}

export async function removeAiKeyAction(): Promise<Result<null>> {
  const user = await requireUser();
  const result = await removeAiKey(user.id);
  revalidatePath(routes.settings);
  return result;
}

/** Regla A6: guarda el modelo elegido, si está en la lista de OpenRouter. */
export async function saveAiModelAction(model: string): Promise<Result<{ model: string }>> {
  const user = await requireUser();
  const result = await saveAiModel(user.id, model, await fetchReadingModels());
  revalidatePath(routes.settings);
  return result;
}
