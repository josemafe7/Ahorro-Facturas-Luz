import { FileTextIcon, PlusIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { appConfig } from "@/config/app";
import { listStudies } from "@/data/studies";
import { formatDate } from "@/lib/format";
import { routes } from "@/lib/routes";
import { requireUser } from "@/lib/session";

const { study: texts } = appConfig.sector.texts;

export const metadata: Metadata = { title: texts.plural };

function NewStudyButton() {
  return (
    <Link href={routes.newStudy} className={buttonVariants()}>
      <PlusIcon aria-hidden />
      {texts.new}
    </Link>
  );
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
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 text-muted-foreground">{texts.customer}</TableHead>
              <TableHead className="px-4 text-muted-foreground">Fecha</TableHead>
              <TableHead className="px-4 text-muted-foreground">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {studies.map((study) => (
              <TableRow key={study.id} className="h-12">
                <TableCell className="px-4 font-medium">
                  <Link href={routes.study(study.id)} className="hover:text-primary hover:underline">
                    {study.customerName ?? "Sin revisar"}
                  </Link>
                </TableCell>
                <TableCell className="px-4 text-muted-foreground">{formatDate(study.createdAt)}</TableCell>
                <TableCell className="px-4">
                  <StatusBadge status={study.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
