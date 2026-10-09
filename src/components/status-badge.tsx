import type { StudyStatus } from "@/data/study-status";
import { cn } from "@/lib/utils";

/** Los cuatro estados de un estudio, con su nombre y su color (DESIGN.md). */
export const STATUS_LABELS: Record<StudyStatus, string> = {
  draft: "Borrador",
  sent: "Enviado",
  accepted: "Aceptado",
  contracted: "Contratado",
};

export const STATUS_CLASSNAMES: Record<StudyStatus, string> = {
  draft: "bg-status-draft text-status-draft-foreground",
  sent: "bg-status-sent text-status-sent-foreground",
  accepted: "bg-status-accepted text-status-accepted-foreground",
  contracted: "bg-status-contracted text-status-contracted-foreground",
};

export function StatusBadge({ status, className }: { status: StudyStatus; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[13px] font-medium", STATUS_CLASSNAMES[status], className)}>
      {STATUS_LABELS[status]}
    </span>
  );
}
