import { TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatAmount, formatNumber } from "@/lib/format";
import { fieldId, type FormFeedback } from "@/lib/form-state";
import { cn } from "@/lib/utils";

/** El mensaje bajo un campo: el error si lo hay (en rojo); si no, la duda (en ámbar). */
export function FieldMessages({ name, form }: { name: string; form: FormFeedback }) {
  const error = form.errors[name];
  const doubt = form.doubts?.[name];
  const id = `${fieldId(name, form)}-message`;
  if (error) {
    return (
      <p id={id} role="alert" className="text-[13px] text-destructive">
        {error}
      </p>
    );
  }
  if (doubt) {
    return (
      <p id={id} className="flex items-start gap-1.5 text-[13px] text-warning-foreground">
        <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {doubt}
      </p>
    );
  }
  return null;
}

/** Lo que cambia en un campo según tenga un error, una duda o nada. */
export function fieldState(name: string, form: FormFeedback) {
  const error = form.errors[name];
  const doubt = form.doubts?.[name];
  return {
    id: fieldId(name, form),
    invalid: error ? true : undefined,
    describedBy: error || doubt ? `${fieldId(name, form)}-message` : undefined,
    className: !error && doubt ? "border-warning bg-warning-soft" : "bg-card",
  };
}

/**
 * Un campo numérico con su unidad dentro, a la derecha. Los números se enseñan a la española, con coma, y se
 * pueden escribir con coma o con punto decimal (regla R6).
 */
export function NumberField({
  name,
  label,
  unit,
  value,
  money = false,
  help,
  form,
  onChange,
  children,
}: {
  name: string;
  label: string;
  unit?: string;
  /** Un importe en euros: se enseña siempre con dos decimales. */
  money?: boolean;
  /** El valor guardado. Si el último envío falló, se enseña lo que se había escrito. */
  value?: number | null;
  help?: ReactNode;
  form: FormFeedback;
  /** Lo que se va escribiendo, por si otra cosa de la pantalla depende de ello. */
  onChange?: (text: string) => void;
  /** Un control extra pegado al campo, como el desplegable de la unidad. */
  children?: ReactNode;
}) {
  const state = fieldState(name, form);
  const saved = value === undefined || value === null ? "" : money ? formatAmount(value) : formatNumber(value);
  const initial = form.submitted?.[name] ?? saved;
  return (
    <Field data-invalid={state.invalid}>
      <FieldLabel htmlFor={state.id}>{label}</FieldLabel>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          {/* La `key` vuelve a crear el campo cuando cambia su valor inicial, tras guardar o tras un error. */}
          <Input
            key={initial}
            id={state.id}
            name={name}
            inputMode="decimal"
            autoComplete="off"
            defaultValue={initial}
            onChange={onChange && ((event) => onChange(event.target.value))}
            aria-invalid={state.invalid}
            aria-describedby={state.describedBy}
            className={cn("tabular", state.className, unit && "pr-14")}
          />
          {unit && (
            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[13px] text-muted-foreground">
              {unit}
            </span>
          )}
        </div>
        {children}
      </div>
      <FieldMessages name={name} form={form} />
      {help && <FieldDescription className="text-[13px]">{help}</FieldDescription>}
    </Field>
  );
}
