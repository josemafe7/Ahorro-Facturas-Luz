"use client";

import { CheckIcon } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { appConfig } from "@/config/app";
import type { CalculatedOffer } from "@/engine/calculation";
import { formatCents } from "@/lib/format";
import { cn } from "@/lib/utils";

import { selectStudyOfferAction } from "../../actions";

const { offer: texts } = appConfig.sector.texts;

/** Todas las tarifas comparadas, de mayor a menor ahorro (regla C8). Se puede elegir una que ahorre (P1). */
export function OffersTable({
  studyId,
  offers,
  selectedOfferId,
}: {
  studyId: string;
  offers: Pick<CalculatedOffer, "id" | "label" | "breakdown" | "savings">[];
  selectedOfferId: string | null;
}) {
  const [optimisticSelected, setOptimisticSelected] = useOptimistic(selectedOfferId);
  const [, startTransition] = useTransition();

  function select(offerId: string) {
    startTransition(async () => {
      setOptimisticSelected(offerId);
      const result = await selectStudyOfferAction({ studyId, offerId });
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4 text-muted-foreground">Tarifa</TableHead>
            <TableHead className="px-4 text-right text-muted-foreground">Pagaría</TableHead>
            <TableHead className="px-4 text-right text-muted-foreground">Ahorro al mes</TableHead>
            <TableHead className="px-4 text-right text-muted-foreground">Ahorro al año</TableHead>
            <TableHead className="px-4">
              <span className="sr-only">Elegir</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map(({ id, label, breakdown, savings }) => {
            const saves = savings.yearCents > 0;
            const selected = id === optimisticSelected;
            return (
              <TableRow key={id} className={cn("h-12", selected && "bg-primary-soft hover:bg-primary-soft", !saves && "text-muted-foreground")}>
                <TableCell className="px-4 font-medium">{label}</TableCell>
                <TableCell className="tabular px-4 text-right">{formatCents(breakdown.totalCents)}</TableCell>
                <TableCell className="tabular px-4 text-right">{saves ? formatCents(savings.monthCents) : "—"}</TableCell>
                <TableCell className={cn("tabular px-4 text-right font-semibold", saves && "text-primary")}>
                  {saves ? formatCents(savings.yearCents) : "No ahorra"}
                </TableCell>
                <TableCell className="px-4 text-right">
                  {selected ? (
                    <span className="inline-flex items-center gap-1 text-[13px] font-medium text-primary">
                      <CheckIcon className="size-4" aria-hidden />
                      {texts.proposed}
                    </span>
                  ) : (
                    saves && (
                      <Button variant="outline" size="sm" onClick={() => select(id)} aria-label={`Proponer ${label}`}>
                        Proponer
                      </Button>
                    )
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
