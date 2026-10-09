import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Breakdown } from "@/engine/types";
import { formatCents } from "@/lib/format";

/**
 * El desglose comparado, línea a línea: lo que paga hoy y lo que pagaría, con la operación completa de cada
 * importe (regla C3).
 */
export function BreakdownTable({
  current,
  proposed,
  proposedLabel,
}: {
  current: Breakdown;
  proposed: Breakdown;
  proposedLabel: string;
}) {
  const proposedById = new Map(proposed.lines.map((line) => [line.id, line]));

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4 text-muted-foreground">Concepto</TableHead>
            <TableHead className="px-4 text-muted-foreground">Hoy</TableHead>
            <TableHead className="px-4 text-right text-muted-foreground">Importe</TableHead>
            <TableHead className="px-4 text-muted-foreground">Con {proposedLabel}</TableHead>
            <TableHead className="px-4 text-right text-muted-foreground">Importe</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {current.lines.map((line) => {
            const other = proposedById.get(line.id);
            return (
              <TableRow key={line.id} className="hover:bg-transparent">
                <TableCell className="px-4 font-medium">{line.label}</TableCell>
                <TableCell className="tabular px-4 text-muted-foreground">
                  {line.operation}
                  {line.note && <span className="block text-[13px] text-warning-foreground">{line.note}</span>}
                </TableCell>
                <TableCell className="tabular px-4 text-right">{formatCents(line.cents)}</TableCell>
                <TableCell className="tabular px-4 text-muted-foreground">
                  {other?.operation}
                  {other?.note && <span className="block text-[13px] text-warning-foreground">{other.note}</span>}
                </TableCell>
                <TableCell className="tabular px-4 text-right">{other ? formatCents(other.cents) : ""}</TableCell>
              </TableRow>
            );
          })}
          <TableRow className="border-t-2 hover:bg-transparent">
            <TableCell className="px-4 font-semibold">Total</TableCell>
            <TableCell />
            <TableCell className="tabular px-4 text-right font-semibold">{formatCents(current.totalCents)}</TableCell>
            <TableCell />
            <TableCell className="tabular px-4 text-right font-semibold">{formatCents(proposed.totalCents)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
