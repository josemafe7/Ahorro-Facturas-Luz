import { FileTextIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { appConfig } from "@/config/app";
import { listStudies, type StudyRow } from "@/data/studies";
import { formatCents, formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";

import { DeleteStudyButton } from "./_components/delete-study-button";
import { StudyStatusControl } from "./_components/study-status-select";

const { study: texts, offer: offerTexts } = appConfig.sector.texts;

export const metadata: Metadata = { title: texts.plural };

function NewStudyButton() {
  return (
    <Link href={routes.newStudy} className={buttonVariants()}>
      <PlusIcon aria-hidden />
      {texts.new}
    </Link>
  );
}

/** Un estudio ya calculado se abre por su comparativa; el resto, por la revisión de sus datos. */
function StudyLink({ study }: { study: StudyRow }) {
  return (
    <Link
      href={study.proposedOffer ? routes.studyComparison(study.id) : routes.study(study.id)}
      className="font-medium hover:text-primary hover:underline"
    >
      {study.customerName ?? "Sin revisar"}
    </Link>
  );
}

function YearSavings({ cents }: { cents: number | null }) {
  if (cents === null) return <span className="text-muted-foreground">—</span>;
  return <span className="tabular font-semibold text-primary">{formatCents(cents)}</span>;
}

export default async function StudiesPage() {
  const user = await requireUser();
  const studies = await listStudies(user.id);

  if (studies.length === 0) {
    return (
      <>
        <PageHeader title={texts.plural} />
        <EmptyState icon={FileTextIcon} title={texts.empty} description={texts.emptyHint} action={<NewStudyButton />} />
      </>
    );
  }

  return (
    <>
      <PageHeader title={texts.plural} action={<NewStudyButton />} />

      {/* En móvil la tabla no cabe: cada estudio es una tarjeta con los mismos datos. */}
      <ul className="flex flex-col gap-3 md:hidden">
        {studies.map((study) => (
          <li key={study.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <StudyLink study={study} />
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {formatDate(study.createdAt)}
                  {study.proposedOffer && ` · ${study.proposedOffer}`}
                </p>
              </div>
              <div className="-mt-1.5 -mr-2 shrink-0">
                <DeleteStudyButton id={study.id} customerName={study.customerName} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <StudyStatusControl studyId={study.id} status={study.status} hasProposal={study.proposedOffer !== null} />
              <p className="text-[13px] text-muted-foreground">
                Ahorro al año <YearSavings cents={study.yearSavingsCents} />
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 text-muted-foreground">{texts.customer}</TableHead>
              <TableHead className="px-4 text-muted-foreground">Fecha</TableHead>
              <TableHead className="px-4 text-muted-foreground">{offerTexts.proposed}</TableHead>
              <TableHead className="px-4 text-right text-muted-foreground">Ahorro al año</TableHead>
              <TableHead className="px-4 text-muted-foreground">Estado</TableHead>
              <TableHead className="px-4">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studies.map((study) => (
              <TableRow key={study.id} className="h-12">
                <TableCell className="px-4">
                  <StudyLink study={study} />
                </TableCell>
                <TableCell className="px-4 text-muted-foreground">{formatDate(study.createdAt)}</TableCell>
                <TableCell className="px-4">{study.proposedOffer ?? <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="px-4 text-right">
                  <YearSavings cents={study.yearSavingsCents} />
                </TableCell>
                <TableCell className="px-4">
                  <StudyStatusControl studyId={study.id} status={study.status} hasProposal={study.proposedOffer !== null} />
                </TableCell>
                <TableCell className="px-4 text-right">
                  <DeleteStudyButton id={study.id} customerName={study.customerName} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
