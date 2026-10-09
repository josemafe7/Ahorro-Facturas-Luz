"use client";

import { useState } from "react";

import { NumberField } from "@/components/form/number-field";
import { TextField } from "@/components/form/text-field";
import type { Draft } from "@/engine/types";
import type { FormFeedback } from "@/lib/form-state";
import { cn } from "@/lib/utils";

import type { Tariff } from "../schema";
import { ENERGY_PERIODS } from "../texts";
import { PowerPriceFields } from "./power-price-fields";

const ENERGY_KINDS = [
  { value: "single", label: "Un precio para todo el día" },
  { value: "periods", label: "Un precio por periodo" },
] as const;

/** Los campos de una tarifa de luz 2.0TD de precio fijo. Vale para una guardada y para una a medio revisar. */
export function TariffFields({ value, form }: { value?: Draft<Tariff>; form: FormFeedback }) {
  const [kind, setKind] = useState<string>(form.submitted?.["energyPrice.kind"] ?? value?.energyPrice?.kind ?? "single");
  const energy = value?.energyPrice;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-5 md:grid-cols-2">
        <TextField name="provider" label="Comercializadora" value={value?.provider} form={form} />
        <TextField name="name" label="Nombre de la tarifa" value={value?.name} form={form} />
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 font-medium">Potencia</legend>
        <PowerPriceFields value={value?.powerPrice} form={form} label={(period) => `Precio en ${period}`} />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 font-medium">Energía</legend>
        <div role="radiogroup" aria-label="Cómo se cobra la energía" className="flex flex-wrap gap-2">
          {ENERGY_KINDS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-3 font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                kind === option.value ? "border-primary bg-primary-soft text-primary" : "bg-card hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="energyPrice.kind"
                value={option.value}
                checked={kind === option.value}
                onChange={() => setKind(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
        {kind === "periods" ? (
          <div className="grid gap-5 md:grid-cols-3">
            {(["p1", "p2", "p3"] as const).map((period) => (
              <NumberField
                key={period}
                name={`energyPrice.${period}`}
                label={`Precio en ${ENERGY_PERIODS[period]}`}
                unit="€/kWh"
                value={energy?.kind === "periods" ? energy[period] : undefined}
                form={form}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            <NumberField
              name="energyPrice.price"
              label="Precio"
              unit="€/kWh"
              value={energy?.kind === "single" ? energy.price : undefined}
              form={form}
            />
          </div>
        )}
      </fieldset>

      <TextField
        name="notes"
        label="Notas (opcional)"
        value={value?.notes}
        form={form}
        multiline
        help="Permanencia, condiciones o lo que quieras recordar. No sale en el estudio."
      />
      <p className="text-[13px] text-muted-foreground">Todos los precios, sin impuestos.</p>
    </div>
  );
}
