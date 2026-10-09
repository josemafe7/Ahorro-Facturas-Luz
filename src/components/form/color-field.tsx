import { FieldMessages } from "@/components/form/number-field";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { fieldId, type FormFeedback } from "@/lib/form-state";

/** Un campo para elegir un color con el selector del propio navegador. */
export function ColorField({ name, label, value, help, form }: { name: string; label: string; value: string; help?: string; form: FormFeedback }) {
  // El selector del navegador solo entiende el color en minúsculas.
  const initial = (form.submitted?.[name] ?? value).toLowerCase();
  return (
    <Field data-invalid={form.errors[name] ? true : undefined}>
      <FieldLabel htmlFor={fieldId(name, form)}>{label}</FieldLabel>
      {/* Dentro de un bloque propio para que el selector conserve su ancho y no ocupe toda la fila. */}
      <div>
        <input
          key={initial}
          id={fieldId(name, form)}
          name={name}
          type="color"
          defaultValue={initial}
          className="h-8 w-16 cursor-pointer rounded-lg border border-input bg-card p-1 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      <FieldMessages name={name} form={form} />
      {help && <FieldDescription className="text-[13px]">{help}</FieldDescription>}
    </Field>
  );
}
