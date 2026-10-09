"use client";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

import { deleteOfferAction } from "../actions";

export function DeleteOfferButton({ id, label }: { id: string; label: string }) {
  return (
    <ConfirmDeleteButton
      label={`Borrar ${label}`}
      title="¿Borrar esta tarifa?"
      description={`Se borrará «${label}» de tu catálogo. Los estudios que ya la usan no cambian.`}
      successMessage="Tarifa borrada."
      onConfirm={() => deleteOfferAction(id)}
    />
  );
}
