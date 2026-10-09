import type { ReactNode } from "react";

/** Un bloque de un formulario, con su título: los formularios van por bloques (DESIGN.md). */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="font-semibold">{title}</h2>
      {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
