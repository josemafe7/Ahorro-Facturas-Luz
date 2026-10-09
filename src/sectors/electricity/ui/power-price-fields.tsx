"use client";

import { useState } from "react";

import { FieldMessages, NumberField } from "@/components/form/number-field";
import { Select } from "@/components/form/select";
import type { Draft } from "@/engine/types";
import { formatNumber, parseNumber } from "@/lib/format";
import { fieldId, type FormFeedback } from "@/lib/form-state";

import { POWER_PERIODS, POWER_PRICE_UNIT_LABELS } from "../texts";
import { conversionText, POWER_PRICE_UNITS, type PowerPrice, type PowerPriceUnit } from "../units";

const UNIT_FIELD = "powerPrice.unit";
const PERIODS = ["p1", "p2"] as const;

const isUnit = (value: string): value is PowerPriceUnit => POWER_PRICE_UNITS.some((unit) => unit === value);

/** La conversión de lo que hay escrito en un campo, o nada si ya es por día o todavía no es un número. */
function conversion(text: string, unit: string): string | undefined {
  const amount = parseNumber(text);
  if (amount === null || !isUnit(unit) || unit === "day") return undefined;
  return conversionText({ amount, unit });
}

/**
 * Los precios de la potencia de una factura o de una tarifa: en qué unidad vienen (por día, por mes o por
 * año) y un precio por periodo. Regla R4: cuando no vienen por día, bajo cada precio se ve cómo se
 * convierte, y cambia según se escribe.
 */
export function PowerPriceFields({
  value,
  form,
  label,
}: {
  value?: Draft<Record<(typeof PERIODS)[number], PowerPrice>>;
  form: FormFeedback;
  /** Cómo se llama el campo de cada periodo: «Potencia en punta» en la factura, «Precio en punta» en la tarifa. */
  label: (period: string) => string;
}) {
  const [unit, setUnit] = useState<string>(form.submitted?.[UNIT_FIELD] ?? value?.p1?.unit ?? "day");
  const [typed, setTyped] = useState<Partial<Record<(typeof PERIODS)[number], string>>>({});
  const unitId = fieldId(UNIT_FIELD, form);

  return (
    <>
      <div className="flex flex-col gap-2">
        <label htmlFor={unitId} className="text-sm font-medium">
          Los precios de la potencia son
        </label>
        <Select id={unitId} name={UNIT_FIELD} value={unit} onChange={(event) => setUnit(event.target.value)} className="w-40">
          {POWER_PRICE_UNITS.map((option) => (
            <option key={option} value={option}>
              {POWER_PRICE_UNIT_LABELS[option]}
            </option>
          ))}
        </Select>
        {/* El error llega con el nombre del dato guardado; la duda, con el del campo del formulario. */}
        <FieldMessages name={form.errors["powerPrice.p1.unit"] ? "powerPrice.p1.unit" : UNIT_FIELD} form={form} />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {PERIODS.map((period) => {
          const name = `powerPrice.${period}.amount`;
          const saved = value?.[period]?.amount;
          const written = typed[period] ?? form.submitted?.[name] ?? (saved === undefined ? "" : formatNumber(saved));
          return (
            <NumberField
              key={period}
              name={name}
              label={label(POWER_PERIODS[period])}
              unit="€/kW"
              value={saved}
              form={form}
              onChange={(text) => setTyped((previous) => ({ ...previous, [period]: text }))}
              help={conversion(written, unit)}
            />
          );
        })}
      </div>
    </>
  );
}
