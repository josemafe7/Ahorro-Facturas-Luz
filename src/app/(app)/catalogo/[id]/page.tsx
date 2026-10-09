import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { appConfig } from "@/config/app";
import { getOffer } from "@/data/offers";
import { requireUser } from "@/lib/session";

import { OfferForm } from "../_components/offer-form";
import { updateOfferAction } from "../actions";

const { offer: texts } = appConfig.sector.texts;

export const metadata: Metadata = { title: texts.edit };

export default async function EditOfferPage({ params }: PageProps<"/catalogo/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  // Si no existe o es de otro asesor, la misma pantalla de «no encontrado».
  const row = await getOffer(user.id, id);
  if (!row) notFound();

  return (
    <>
      <PageHeader title={texts.edit} description={row.label} />
      <OfferForm action={updateOfferAction.bind(null, row.id)} value={row.offer} />
    </>
  );
}
