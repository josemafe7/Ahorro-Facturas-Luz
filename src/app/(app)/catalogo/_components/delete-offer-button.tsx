"use client";

import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { appConfig } from "@/config/app";

import { deleteOfferAction } from "../actions";

const { offer: texts } = appConfig.sector.texts;

export function DeleteOfferButton({ id, label }: { id: string; label: string }) {
  return (
    <ConfirmDeleteButton
      label={`Borrar ${label}`}
      title={texts.deleteTitle}
      description={`Se borrará «${label}» de tu catálogo. ${texts.deleteNote}`}
      successMessage={texts.deleted}
      onConfirm={() => deleteOfferAction(id)}
    />
  );
}
