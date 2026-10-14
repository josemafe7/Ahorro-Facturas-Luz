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
  onCancel,
  doubts,
  scope,
  successMessage,
  onSuccess,
  children,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel?: string;
  cancelHref?: string;
  /** Cancelar sin cambiar de pantalla, cuando el formulario se abre dentro de otra. */
  onCancel?: () => void;
  /** Si hay varios formularios iguales en la pantalla, lo que distingue los campos de este. */
  scope?: string;
  /** Si el formulario se queda en la misma pantalla al guardar, el aviso breve que lo confirma. */
  successMessage?: string;
  /** Lo que pasa en la pantalla cuando se ha guardado. */
  onSuccess?: () => void;
  /** Los campos que conviene revisar y por qué (regla R1). */
  doubts?: Record<string, string>;
  children: (feedback: FormFeedback) => ReactNode;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, null);
  const feedback = { ...(state?.feedback ?? NO_FEEDBACK), doubts, scope };

  useEffect(() => {
    if (!state?.ok) return;
    if (successMessage) toast.success(successMessage);
    onSuccess?.();
    // Solo cuando llega una respuesta nueva del servidor, no cada vez que cambia la función que avisa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

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
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
