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
import { getStudy } from "@/data/studies";
import { mismatchCents, savingOffers } from "@/engine/calculation";
import { formatCents, formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";

import { StudyStatusControl } from "../../_components/study-status-select";
import { OffersTable } from "../_components/offers-table";
import { RecalculateButton } from "../_components/recalculate-button";
import { StudyHeader } from "../_components/study-header";

const { texts } = appConfig.sector;

export const metadata: Metadata = { title: texts.study.title };

export default async function StudyComparisonPage({ params }: PageProps<"/estudios/[id]/comparativa">) {
  const user = await requireUser();
  const { id } = await params;

  // Si no existe o es de otro asesor, la misma pantalla de «no encontrado».
  const study = await getStudy(user.id, id);
  if (!study) notFound();

  const { calculation } = study;
  if (!calculation) {
    return (
      <>
        <StudyHeader studyId={study.id} customerName={study.customerName} active="comparison" />
        <EmptyState
          icon={CalculatorIcon}
          title="Este estudio todavía no está calculado"
          description="Revisa los datos de la factura y pulsa «Calcular»."
          action={
            <Link href={routes.study(study.id)} className={buttonVariants()}>
              Revisar los datos
            </Link>
          }
        />
      </>
    );
  }

  const selected = calculation.offers.find((offer) => offer.id === study.selectedOfferId) ?? null;
  const mismatch = mismatchCents(calculation);
  const hasSavingOffers = savingOffers(calculation).length > 0;
  const periodDetail = `en una factura de ${calculation.periodDays} días`;

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
          <Notice tone="warning" title="El cálculo no cuadra con el total de la factura">
            Con los precios de la factura salen {formatCents(calculation.current.totalCents)}, y la factura dice{" "}
            {formatCents(calculation.printedTotalCents)}: {formatCents(Math.abs(mismatch))} de diferencia. Puede llevar descuentos o
            servicios añadidos, o ser de una fecha con otros impuestos. Revisa los datos o sigue si es correcto.
          </Notice>
        )}

        {/* Regla C10 */}
        {calculation.offers.length === 0 && (
          <Notice tone="warning" title={texts.offer.noneActive}>
            <Link href={routes.catalog} className="underline underline-offset-4">
              Ve al catálogo
            </Link>{" "}
            para añadir o activar alguna y después recalcula.
          </Notice>
        )}

        {/* Regla C11 */}
        {calculation.offers.length > 0 && !hasSavingOffers && <Notice tone="warning" title={texts.offer.noneSaves} />}

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

        {calculation.offers.length > 0 && (
          <section>
            <h2 className="mb-3 font-semibold">{texts.offer.compared}</h2>
            <OffersTable
              studyId={study.id}
              selectedOfferId={study.selectedOfferId}
              offers={calculation.offers.map(({ id: offerId, label, breakdown, savings }) => ({ id: offerId, label, breakdown, savings }))}
            />
          </section>
        )}

        {selected && (
          <section>
            <h2 className="mb-3 font-semibold">{texts.pdf.breakdownTitle}</h2>
            <BreakdownTable current={calculation.current} proposed={selected.breakdown} proposedLabel={selected.label} />
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-muted-foreground">
            Calculado el {formatDate(calculation.calculatedAt)} con las tarifas y los impuestos de ese día. El ahorro anual proyecta esta
            factura a 365 días.
          </p>
          <RecalculateButton studyId={study.id} />
        </div>
      </div>
    </>
  );
}
