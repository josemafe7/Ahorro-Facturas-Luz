import type { ReactNode } from "react";

import { FieldMessages, fieldState } from "@/components/form/number-field";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { FormFeedback } from "@/lib/form-state";
import { cn } from "@/lib/utils";

type TextFieldProps = {
  name: string;
  label: string;
  /** El valor guardado. Si el último envío falló, se enseña lo que se había escrito. */
  value?: string | null;
  help?: ReactNode;
  form: FormFeedback;
  placeholder?: string;
  /** Varias líneas, para notas. */
  multiline?: boolean;
  type?: "text" | "date" | "email" | "tel" | "url";
};

export function TextField({ name, label, value, help, form, placeholder, multiline, type = "text" }: TextFieldProps) {
  const state = fieldState(name, form);
  const initial = form.submitted?.[name] ?? value ?? "";
  const shared = {
    id: state.id,
    name,
    defaultValue: initial,
    placeholder,
    "aria-invalid": state.invalid,
    "aria-describedby": state.describedBy,
    className: cn(state.className),
  };

  return (
    <Field data-invalid={state.invalid}>
      <FieldLabel htmlFor={state.id}>{label}</FieldLabel>
      {/* La `key` vuelve a crear el campo cuando cambia su valor inicial, tras guardar o tras un error. */}
      {multiline ? <Textarea key={initial} rows={3} {...shared} /> : <Input key={initial} type={type} autoComplete="off" {...shared} />}
      <FieldMessages name={name} form={form} />
      {help && <FieldDescription className="text-[13px]">{help}</FieldDescription>}
    </Field>
  );
}
