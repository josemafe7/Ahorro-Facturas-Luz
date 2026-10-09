"use client";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

import { deleteStudyAction } from "../actions";

/** Regla L5: borra un estudio, tras confirmarlo, con sus datos y su factura. */
export function DeleteStudyButton({ id, customerName }: { id: string; customerName: string | null }) {
  const name = customerName ?? "sin revisar";
  return (
    <ConfirmDeleteButton
      label={`Borrar el estudio de ${name}`}
      title="¿Borrar este estudio?"
      description={`Se borrarán el estudio de «${name}», sus datos y la factura guardada. No se puede deshacer.`}
      successMessage="Estudio borrado."
      onConfirm={() => deleteStudyAction(id)}
    />
  );
}
