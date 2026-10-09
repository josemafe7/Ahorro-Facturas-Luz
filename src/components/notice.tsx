import { CircleAlertIcon, InfoIcon, TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const TONES = {
  /** Lo que conviene revisar, pero deja seguir. */
  warning: { icon: TriangleAlertIcon, className: "border-warning/50 bg-warning-soft text-warning-foreground" },
  /** Lo que impide seguir. */
  error: { icon: CircleAlertIcon, className: "border-destructive/30 bg-destructive-soft text-destructive" },
  /** Lo informativo. */
  info: { icon: InfoIcon, className: "border-border bg-muted text-muted-foreground" },
} as const;

/** Un aviso: una franja con icono y texto (DESIGN.md). */
export function Notice({
  tone,
  title,
  children,
  className,
}: {
  tone: keyof typeof TONES;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: toneClassName } = TONES[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg border p-3", toneClassName, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && "mt-0.5")}>{children}</div>}
      </div>
    </div>
  );
}
