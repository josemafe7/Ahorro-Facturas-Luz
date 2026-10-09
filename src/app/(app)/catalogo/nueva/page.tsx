import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { appConfig } from "@/config/app";
import { requireUser } from "@/lib/session";

import { OfferForm } from "../_components/offer-form";
import { createOfferAction } from "../actions";

const { offer: texts } = appConfig.sector.texts;

export const metadata: Metadata = { title: texts.add };

export default async function NewOfferPage() {
  await requireUser();

  return (
    <>
      <PageHeader title={texts.add} />
      <OfferForm action={createOfferAction} />
    </>
  );
}
