"use server";

import { revalidatePath } from "next/cache";

import { saveSettings } from "@/data/settings";
import { failed, succeeded, type FormState } from "@/lib/form-state";
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
