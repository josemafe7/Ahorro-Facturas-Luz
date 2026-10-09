import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Una cifra destacada: una etiqueta pequeña arriba y la cifra grande (DESIGN.md). La del ahorro va sobre el
 * verde muy claro, con la cifra en verde.
 */
export function StatCard({
  label,
  value,
  detail,
  highlight = false,
}: {
  label: string;
  value: string;
  detail?: ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border p-5", highlight ? "border-primary/20 bg-primary-soft" : "bg-card")}>
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <p className={cn("tabular mt-1 text-3xl font-semibold", highlight && "text-primary")}>{value}</p>
      {detail && <p className="mt-1 text-[13px] text-muted-foreground">{detail}</p>}
    </div>
  );
}
