import { CalculatorIcon, DownloadIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BreakdownTable } from "@/components/breakdown-table";
import { EmptyState } from "@/components/empty-state";
import { Notice } from "@/components/notice";
import { StatCard } from "@/components/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { appConfig } from "@/config/app";
import { listActiveOffers } from "@/data/offers";
import { getStudy } from "@/data/studies";
import { mismatchCents, savingOffers } from "@/engine/calculation";
import { fill } from "@/lib/fill";
import { formatCents, formatDate } from "@/lib/format";
import { parseId } from "@/lib/ids";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";

import { StudyStatusControl } from "../../_components/study-status-select";
import { OffersTable } from "../_components/offers-table";
import { RecalculateButton } from "../_components/recalculate-button";
import { StudyHeader } from "../_components/study-header";

const { texts } = appConfig.sector;

export const metadata: Metadata = { title: texts.study.title };

/** Regla C10: sin ofertas activas no hay con qué comparar. La app lo dice y lleva al catálogo. */
function NoActiveOffersNotice() {
  return (
    <Notice tone="warning" title={texts.offer.noneActive}>
      <Link href={routes.catalog} className="underline underline-offset-4">
        Ve al catálogo
      </Link>{" "}
      para añadir o activar alguna y después vuelve a calcular.
    </Notice>
  );
}

export default async function StudyComparisonPage({ params }: PageProps<"/estudios/[id]/comparativa">) {
  const user = await requireUser();
  const id = parseId((await params).id);

  // Si no existe o es de otro asesor, la misma pantalla de «no encontrado».
  const study = id ? await getStudy(user.id, id) : null;
  if (!study) notFound();

  const hasActiveOffers = (await listActiveOffers(user.id)).length > 0;
  const { calculation } = study;
  if (!calculation) {
    return (
      <>
        <StudyHeader studyId={study.id} customerName={study.customerName} active="comparison" />
        <div className="flex flex-col gap-6">
          {!hasActiveOffers && <NoActiveOffersNotice />}
          <EmptyState
            icon={CalculatorIcon}
            title={texts.study.notCalculated}
            description={texts.study.notCalculatedHint}
            action={
              <Link href={routes.study(study.id)} className={buttonVariants()}>
                Revisar los datos
              </Link>
            }
          />
        </div>
      </>
    );
  }

  const selected = calculation.offers.find((offer) => offer.id === study.selectedOfferId) ?? null;
  const mismatch = mismatchCents(calculation);
  const periodDetail = fill(texts.document.periodDetail, { dias: calculation.periodDays });

  return (
    <>
      <StudyHeader
        studyId={study.id}
        customerName={study.customerName}
        active="comparison"
        action={
          <>
            <StudyStatusControl studyId={study.id} status={study.status} hasProposal={study.selectedOfferId !== null} />
            {selected && (
              <a href={routes.studyPdf(study.id)} className={buttonVariants()}>
                <DownloadIcon aria-hidden />
                Descargar PDF
              </a>
            )}
          </>
        }
      />

      <div className="flex flex-col gap-6">
        {/* Regla C9 */}
        {mismatch !== null && calculation.printedTotalCents !== undefined && (
          <Notice tone="warning" title={texts.document.mismatchTitle}>
            {fill(texts.document.mismatch, {
              calculado: formatCents(calculation.current.totalCents),
              impreso: formatCents(calculation.printedTotalCents),
              diferencia: formatCents(Math.abs(mismatch)),
            })}
          </Notice>
        )}

        {/* El catálogo se ha quedado sin ofertas activas después de calcular: recalcular no se puede. */}
        {!hasActiveOffers && <NoActiveOffersNotice />}

        {/* Regla C11 */}
        {savingOffers(calculation).length === 0 && <Notice tone="warning" title={texts.offer.noneSaves} />}

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Hoy paga" value={formatCents(calculation.current.totalCents)} detail={periodDetail} />
          <StatCard
            label={selected ? `Pagaría con ${selected.label}` : "Pagaría"}
            value={selected ? formatCents(selected.breakdown.totalCents) : "—"}
            detail={selected ? periodDetail : undefined}
          />
          <StatCard
            highlight
            label="Ahorro al año"
            value={selected ? formatCents(selected.savings.yearCents) : "—"}
            detail={selected ? `${formatCents(selected.savings.monthCents)} al mes` : undefined}
          />
        </div>

        <section>
          <h2 className="mb-3 font-semibold">{texts.offer.compared}</h2>
          <OffersTable
            studyId={study.id}
            selectedOfferId={study.selectedOfferId}
            offers={calculation.offers.map(({ id: offerId, label, breakdown, savings }) => ({ id: offerId, label, breakdown, savings }))}
          />
        </section>

        {selected && (
          <section>
            <h2 className="mb-3 font-semibold">{texts.pdf.breakdownTitle}</h2>
            <BreakdownTable current={calculation.current} proposed={selected.breakdown} proposedLabel={selected.label} />
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-muted-foreground">{fill(texts.study.calculatedNote, { fecha: formatDate(calculation.calculatedAt) })}</p>
          <RecalculateButton studyId={study.id} />
        </div>
      </div>
    </>
  );
}
