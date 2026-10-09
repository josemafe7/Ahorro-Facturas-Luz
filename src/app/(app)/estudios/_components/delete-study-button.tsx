"use client";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { appConfig } from "@/config/app";
import { fill } from "@/lib/fill";

import { deleteStudyAction } from "../actions";

const { study: texts } = appConfig.sector.texts;

/** Regla L5: borra un estudio, tras confirmarlo, con sus datos y su factura. */
export function DeleteStudyButton({ id, customerName }: { id: string; customerName: string | null }) {
  const name = customerName ?? "sin revisar";
  return (
    <ConfirmDeleteButton
      label={fill(texts.deleteLabel, { nombre: name })}
      title={texts.deleteTitle}
      description={fill(texts.deleteDescription, { nombre: name })}
      successMessage={texts.deleted}
      onConfirm={() => deleteStudyAction(id)}
    />
  );
}
