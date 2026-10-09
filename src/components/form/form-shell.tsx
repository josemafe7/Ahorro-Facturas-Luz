"use client";

import Link from "next/link";
import { useActionState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";

import { Notice } from "@/components/notice";
import { Button, buttonVariants } from "@/components/ui/button";
import { NO_FEEDBACK, type FormFeedback, type FormState } from "@/lib/form-state";

/**
 * El armazón de un formulario que guarda con una Server Action: el aviso de error arriba, los campos y los
 * botones abajo. Los campos reciben los errores, las dudas y lo que se había escrito.
 */
export function FormShell({
  action,
  submitLabel,
  pendingLabel = "Guardando…",
  cancelHref,
  doubts,
  successMessage,
  children,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel?: string;
  cancelHref?: string;
  /** Si el formulario se queda en la misma pantalla al guardar, el aviso breve que lo confirma. */
  successMessage?: string;
  /** Los campos que conviene revisar y por qué (regla R1). */
  doubts?: Record<string, string>;
  children: (feedback: FormFeedback) => ReactNode;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const feedback = { ...(state?.feedback ?? NO_FEEDBACK), doubts };

  useEffect(() => {
    if (state?.ok && successMessage) toast.success(successMessage);
  }, [state, successMessage]);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {state && !state.ok && <Notice tone="error">{state.message}</Notice>}
      {children(feedback)}
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
