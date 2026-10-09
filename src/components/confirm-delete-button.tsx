"use client";

import { Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Result } from "@/lib/result";

/**
 * El botón de borrar: siempre pide confirmación en un diálogo (DESIGN.md). `onConfirm` es una Server Action.
 */
export function ConfirmDeleteButton({
  label,
  title,
  description,
  onConfirm,
  successMessage,
  showLabel = false,
}: {
  /** Para lectores de pantalla y, si `showLabel`, el texto del botón. */
  label: string;
  title: string;
  description: string;
  onConfirm: () => Promise<Result<unknown>>;
  successMessage: string;
  showLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await onConfirm();
      if (result.ok) toast.success(successMessage);
      else toast.error(result.message);
      setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          showLabel ? (
            <Button variant="destructive" />
          ) : (
            <Button variant="ghost" size="icon" aria-label={label} className="text-muted-foreground hover:text-destructive" />
          )
        }
      >
        <Trash2Icon aria-hidden />
        {showLabel && label}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={pending}>
            {pending ? "Borrando…" : "Borrar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
