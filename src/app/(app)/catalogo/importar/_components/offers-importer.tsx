"use client";

import { CheckIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { FormSection } from "@/components/form/form-section";
import { FormShell } from "@/components/form/form-shell";
import { Notice } from "@/components/notice";
import { Button, buttonVariants } from "@/components/ui/button";
import { UploadZone } from "@/components/upload-zone";
import { aiConfig } from "@/config/ai";
import { appConfig } from "@/config/app";
import type { ImportedOffer, OffersImport, OffersImportStatus } from "@/data/offer-import";
import { routes } from "@/lib/routes";
import { OfferFields } from "@/sectors/ui";

import { importOffersAction, saveProposedOfferAction } from "../../actions";

const { offer: texts } = appConfig.sector.texts;

/** Qué ha pasado cuando la lectura no trae tarifas. */
const EMPTY_MESSAGES: Record<Exclude<OffersImportStatus, "read">, string> = {
  empty: "La IA no ha encontrado en ese documento ninguna tarifa que se pueda cargar.",
  failed: "La IA no ha podido leer el documento. Vuelve a intentarlo o añade las tarifas a mano.",
  limit: `Has llegado al límite de ${aiConfig.maxReadingsPerHour} lecturas con IA por hora. Inténtalo más tarde o añade las tarifas a mano.`,
  "not-configured": "La lectura con IA no está configurada: falta la clave de OpenRouter en el servidor. Añade las tarifas a mano.",
};

type Decision = "pending" | "saved" | "discarded";

/** Una tarifa propuesta: el asesor la revisa, la corrige y decide si la guarda o la descarta. */
function ProposalCard({ proposal, index, total }: { proposal: ImportedOffer; index: number; total: number }) {
  const [decision, setDecision] = useState<Decision>("pending");
  const title = [proposal.draft.provider, proposal.draft.name].filter(Boolean).join(" · ") || `Tarifa ${index + 1}`;
  const doubtCount = Object.keys(proposal.doubts).length;

  if (decision !== "pending") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-5 py-3">
        <p className="font-medium">{title}</p>
        {decision === "saved" ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary">
            <CheckIcon className="size-4" aria-hidden />
            Guardada en tu catálogo
          </span>
        ) : (
          <span className="text-[13px] text-muted-foreground">Descartada</span>
        )}
      </div>
    );
  }

  return (
    <FormSection
      title={title}
      description={
        doubtCount === 0
          ? `Propuesta ${index + 1} de ${total}. Compárala con el tarifario antes de guardarla.`
          : `Propuesta ${index + 1} de ${total}. Tiene ${doubtCount === 1 ? "1 dato" : `${doubtCount} datos`} que conviene revisar, en ámbar.`
      }
    >
      <FormShell
        action={saveProposedOfferAction}
        submitLabel={texts.save}
        scope={`propuesta-${index}`}
        doubts={proposal.doubts}
        successMessage="Tarifa guardada."
        onSuccess={() => setDecision("saved")}
      >
        {(form) => <OfferFields value={proposal.draft} form={form} />}
      </FormShell>
      <Button type="button" variant="ghost" className="mt-2 text-muted-foreground" onClick={() => setDecision("discarded")}>
        Descartar esta tarifa
      </Button>
    </FormSection>
  );
}

/** Regla T5: se sube el tarifario, la IA propone sus tarifas y el asesor guarda las que quiere. */
export function OffersImporter({ accept, typesLabel, maxMb }: { accept: string; typesLabel: string; maxMb: number }) {
  const [result, setResult] = useState<OffersImport | null>(null);

  if (result?.status === "read") {
    return (
      <div className="flex flex-col gap-6">
        <Notice tone="info" title={result.proposals.length === 1 ? "La IA ha encontrado 1 tarifa" : `La IA ha encontrado ${result.proposals.length} tarifas`}>
          Ninguna está guardada todavía. Revisa cada una, corrige lo que haga falta y guarda las que quieras.
        </Notice>
        {result.proposals.map((proposal, index) => (
          <ProposalCard key={index} proposal={proposal} index={index} total={result.proposals.length} />
        ))}
        <div className="flex gap-2">
          <Link href={routes.catalog} className={buttonVariants({ variant: "outline" })}>
            Volver al catálogo
          </Link>
          <Button type="button" variant="ghost" onClick={() => setResult(null)}>
            Subir otro tarifario
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {result && <Notice tone="warning">{EMPTY_MESSAGES[result.status]}</Notice>}
      <UploadZone
        action={importOffersAction}
        onSuccess={setResult}
        title={texts.importTitle}
        hint={texts.importHint}
        busyLabel="Leyendo el tarifario…"
        accept={accept}
        typesLabel={typesLabel}
        maxMb={maxMb}
      />
    </div>
  );
}
