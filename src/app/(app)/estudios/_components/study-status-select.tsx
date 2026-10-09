"use client";

import { ChevronDownIcon } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { STATUS_CLASSNAMES, STATUS_LABELS } from "@/components/status-badge";
import { STUDY_STATUSES, type StudyStatus } from "@/data/study-status";
import { cn } from "@/lib/utils";

import { setStudyStatusAction } from "../actions";

/** La etiqueta de estado de un estudio, que además es el desplegable para cambiarlo (regla L2). */
export function StudyStatusSelect({ studyId, status }: { studyId: string; status: StudyStatus }) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(status);
  const [, startTransition] = useTransition();

  function handleChange(next: StudyStatus) {
    startTransition(async () => {
      setOptimisticStatus(next);
      const result = await setStudyStatusAction({ studyId, status: next });
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <span className={cn("relative inline-flex h-6 items-center rounded-full text-[13px] font-medium", STATUS_CLASSNAMES[optimisticStatus])}>
      <select
        aria-label="Estado del estudio"
        value={optimisticStatus}
        onChange={(event) => handleChange(event.target.value as StudyStatus)}
        className="h-6 cursor-pointer appearance-none rounded-full bg-transparent py-0 pr-7 pl-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {STUDY_STATUSES.map((option) => (
          <option key={option} value={option}>
            {STATUS_LABELS[option]}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2 size-3.5" aria-hidden />
    </span>
  );
}
