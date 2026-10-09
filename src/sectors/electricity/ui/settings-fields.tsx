import { NumberField } from "@/components/form/number-field";
import type { FormFeedback } from "@/lib/form-state";

import type { ElectricitySettings } from "../settings";

/** Los campos de impuestos y cargos de la luz, con una línea sobre de dónde sale cada valor. */
export function SettingsFields({ values, form }: { values: ElectricitySettings; form: FormFeedback }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <NumberField
        name="vatPercent"
        label="IVA"
        unit="%"
        value={values.vatPercent}
        form={form}
        help="El tipo general es el 21 %. En 2026 ha estado rebajado al 10 % algunos meses."
      />
      <NumberField
        name="electricityTaxPercent"
        label="Impuesto eléctrico"
        unit="%"
        value={values.electricityTaxPercent}
        form={form}
        help="El tipo general es el 5,11269632 %. Con la rebaja, el 0,5 %."
      />
      <NumberField
        name="electricityTaxMinPerMwh"
        label="Mínimo del impuesto eléctrico"
        unit="€/MWh"
        value={values.electricityTaxMinPerMwh}
        form={form}
        help="El impuesto nunca baja de este importe por MWh consumido. Para hogares y pequeños negocios, 1 €."
      />
      <NumberField
        name="socialBonusPerDay"
        label="Financiación del bono social"
        unit="€/día"
        value={values.socialBonusPerDay}
        form={form}
        help="9,011295 € al año por punto de suministro, entre 365 días."
      />
      <NumberField
        name="meterRentalPerDay"
        label="Alquiler del contador"
        unit="€/día"
        value={values.meterRentalPerDay}
        form={form}
        help="Solo se usa si la factura no trae el suyo. 0,81 € al mes para un contador monofásico."
      />
    </div>
  );
}
