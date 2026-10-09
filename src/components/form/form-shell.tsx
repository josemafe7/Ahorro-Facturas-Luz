"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";

import { Notice } from "@/components/notice";
import { Button, buttonVariants } from "@/components/ui/button";
import { NO_FEEDBACK, type FormFeedback, type FormState } from "@/lib/form-state";

/**
 * El armazón de un formulario que guarda con una Server Action: el aviso de error arriba, los campos y los
 * botones abajo. Los campos reciben los errores y lo que se había escrito.
 */
export function FormShell({
  action,
  submitLabel,
  pendingLabel = "Guardando…",
  cancelHref,
  children,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel?: string;
  cancelHref?: string;
  children: (feedback: FormFeedback) => ReactNode;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state && !state.ok && <Notice tone="error">{state.message}</Notice>}
      {children(state?.feedback ?? NO_FEEDBACK)}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
        {cancelHref && (
          <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
