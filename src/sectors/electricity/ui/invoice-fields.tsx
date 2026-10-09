"use client";

import { FormSection } from "@/components/form/form-section";
import { NumberField } from "@/components/form/number-field";
import { TextField } from "@/components/form/text-field";
import type { Draft } from "@/engine/types";
import type { FormFeedback } from "@/lib/form-state";

import type { Invoice } from "../schema";
import { ELECTRICITY_TEXTS, ENERGY_PERIODS, POWER_PERIODS } from "../texts";
import { PowerPriceUnitSelect } from "./tariff-fields";

const CENTS_PER_EURO = 100;
const euros = (cents: number | undefined) => (cents === undefined ? undefined : cents / CENTS_PER_EURO);

/**
 * Los datos de una factura de luz, por bloques, para que el asesor los revise y los corrija (regla R1). Los
 * dudosos y los que la IA no ha encontrado llegan marcados en `form.doubts`.
 */
export function InvoiceFields({ value, form }: { value: Draft<Invoice>; form: FormFeedback }) {
  return (
    <div className="flex flex-col gap-6">
      <FormSection title="Cliente y suministro">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField name="holder" label="Titular" value={value.holder} form={form} />
          <TextField name="currentProvider" label="Comercializadora actual" value={value.currentProvider} form={form} />
          <div className="md:col-span-2">
            <TextField name="supplyAddress" label="Dirección de suministro" value={value.supplyAddress} form={form} />
          </div>
          <TextField name="cups" label="CUPS" value={value.cups} form={form} />
          <TextField
            name="accessTariff"
            label="Tarifa de acceso"
            value={value.accessTariff}
            form={form}
            help={ELECTRICITY_TEXTS.onlySupportedTariff}
          />
        </div>
      </FormSection>

      <FormSection title="Periodo facturado">
        <div className="grid gap-5 md:grid-cols-3">
          <TextField name="periodStart" label="Desde" type="date" value={value.periodStart} form={form} />
          <TextField name="periodEnd" label="Hasta" type="date" value={value.periodEnd} form={form} />
          <NumberField name="days" label="Días facturados" unit="días" value={value.days} form={form} />
        </div>
      </FormSection>

      <FormSection title="Potencia contratada">
        <div className="grid gap-5 md:grid-cols-2">
          {(["p1", "p2"] as const).map((period) => (
            <NumberField
              key={period}
              name={`powerKw.${period}`}
              label={`En ${POWER_PERIODS[period]}`}
              unit="kW"
              value={value.powerKw?.[period]}
              form={form}
            />
          ))}
        </div>
      </FormSection>

      <FormSection title="Consumo">
        <div className="grid gap-5 md:grid-cols-3">
          {(["p1", "p2", "p3"] as const).map((period) => (
            <NumberField
              key={period}
              name={`energyKwh.${period}`}
              label={`En ${ENERGY_PERIODS[period]}`}
              unit="kWh"
              value={value.energyKwh?.[period]}
              form={form}
            />
          ))}
        </div>
      </FormSection>

      <FormSection title="Precios que paga hoy" description="Sin impuestos, tal como vienen en la factura.">
        <div className="flex flex-col gap-5">
          <PowerPriceUnitSelect value={value.powerPrice?.p1?.unit} form={form} />
          <div className="grid gap-5 md:grid-cols-2">
            {(["p1", "p2"] as const).map((period) => (
              <NumberField
                key={period}
                name={`powerPrice.${period}.amount`}
                label={`Potencia en ${POWER_PERIODS[period]}`}
                unit="€/kW"
                value={value.powerPrice?.[period]?.amount}
                form={form}
              />
            ))}
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {(["p1", "p2", "p3"] as const).map((period) => (
              <NumberField
                key={period}
                name={`energyPrice.${period}`}
                label={`Energía en ${ENERGY_PERIODS[period]}`}
                unit="€/kWh"
                value={value.energyPrice?.[period]}
                form={form}
              />
            ))}
          </div>
        </div>
      </FormSection>

      <FormSection title="Importes de la factura" description="Opcionales. Sirven para comprobar que el cálculo cuadra.">
        <div className="grid gap-5 md:grid-cols-2">
          <NumberField
            name="meterRentalCents"
            label="Alquiler del contador"
            unit="€"
            money
            value={euros(value.meterRentalCents)}
            form={form}
            help="Si lo dejas vacío, se usa el de Ajustes."
          />
          <NumberField
            name="invoiceTotalCents"
            label="Total de la factura"
            unit="€"
            money
            value={euros(value.invoiceTotalCents)}
            form={form}
            help="Con impuestos."
          />
        </div>
      </FormSection>
    </div>
  );
}
