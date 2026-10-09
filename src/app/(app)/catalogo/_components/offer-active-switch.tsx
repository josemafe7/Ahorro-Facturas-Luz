"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";

import { setOfferActiveAction } from "../actions";

/** Regla T4: activa o desactiva una tarifa sin borrarla. */
export function OfferActiveSwitch({ id, active, label }: { id: string; active: boolean; label: string }) {
  const [optimisticActive, setOptimisticActive] = useOptimistic(active);
  const [, startTransition] = useTransition();

  function handleChange(next: boolean) {
    startTransition(async () => {
      setOptimisticActive(next);
      const result = await setOfferActiveAction({ id, active: next });
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <Switch
      checked={optimisticActive}
      onCheckedChange={handleChange}
      aria-label={`${label}: ${optimisticActive ? "activa" : "inactiva"}`}
    />
  );
}
