"use client";

import { ColorField } from "@/components/form/color-field";
import { FormShell } from "@/components/form/form-shell";
import { TextField } from "@/components/form/text-field";
import type { BrandData } from "@/data/brand";

import { saveBrandAction } from "../actions";

/** Regla A3: el nombre comercial, el color y los datos de contacto que salen en el PDF. */
export function BrandForm({ value }: { value: BrandData }) {
  return (
    <FormShell action={saveBrandAction} submitLabel="Guardar mi marca" successMessage="Marca guardada.">
      {(form) => (
        <div className="grid gap-5 md:grid-cols-2">
          <TextField name="businessName" label="Nombre comercial" value={value.businessName} form={form} />
          <ColorField name="color" label="Color" value={value.color} form={form} help="El de la cabecera del estudio y la cifra del ahorro." />
          <TextField name="phone" label="Teléfono" type="tel" value={value.phone} form={form} />
          <TextField name="email" label="Correo" type="email" value={value.email} form={form} />
          <TextField name="website" label="Web" value={value.website} form={form} />
        </div>
      )}
    </FormShell>
  );
}
