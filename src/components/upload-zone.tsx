"use client";

import { FileUpIcon, LoaderCircleIcon } from "lucide-react";
import { useRef, useState, useTransition, type DragEvent, type ReactNode } from "react";

import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import type { Result } from "@/lib/result";
import { cn } from "@/lib/utils";

const BYTES_PER_MB = 1024 * 1024;

/**
 * La zona para subir un documento: se arrastra o se elige. Mientras el servidor lo guarda y lo lee, enseña
 * el progreso en su lugar (DESIGN.md). El tipo y el tamaño se comprueban de verdad en el servidor; aquí solo
 * se adelanta el aviso del tamaño para no hacer esperar.
 */
export function UploadZone<T>({
  action,
  onSuccess,
  title,
  hint,
  busyLabel,
  accept,
  typesLabel,
  maxMb,
  children,
}: {
  /** La Server Action que recibe el archivo en el campo `file`. */
  action: (form: FormData) => Promise<Result<T>>;
  /** Si la acción no redirige, lo que hace la pantalla con lo que devuelve. */
  onSuccess?: (value: T) => void;
  title: string;
  hint: string;
  busyLabel: string;
  accept: string;
  typesLabel: string;
  maxMb: number;
  /** Lo que va debajo de la zona: el aviso de privacidad. */
  children?: ReactNode;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function upload(file: File | undefined) {
    if (!file) return;
    if (file.size > maxMb * BYTES_PER_MB) {
      setError(`El archivo pasa de ${maxMb} MB. Súbelo más pequeño.`);
      return;
    }
    setError(null);
    const form = new FormData();
    form.set("file", file);
    startTransition(async () => {
      const result = await action(form);
      if (result.ok) onSuccess?.(result.value);
      else setError(result.message);
    });
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!pending) upload(event.dataTransfer.files[0]);
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Notice tone="error">{error}</Notice>}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        aria-busy={pending}
        className={cn(
          "flex min-h-72 flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed bg-card p-8 text-center transition-colors",
          dragging && "border-primary bg-primary-soft",
        )}
      >
        {pending ? (
          <>
            <LoaderCircleIcon className="size-8 animate-spin text-primary" aria-hidden />
            <p className="font-medium" role="status">
              {busyLabel}
            </p>
            <p className="text-muted-foreground">Puede tardar hasta un minuto. No cierres esta pantalla.</p>
          </>
        ) : (
          <>
            <div className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <FileUpIcon className="size-6" aria-hidden />
            </div>
            <div>
              <p className="text-base font-semibold">{title}</p>
              <p className="mt-1 text-muted-foreground">{hint}</p>
            </div>
            <Button type="button" size="lg" onClick={() => input.current?.click()}>
              Elegir archivo
            </Button>
            <p className="text-[13px] text-muted-foreground">
              {typesLabel}, hasta {maxMb} MB
            </p>
          </>
        )}
        <input
          ref={input}
          type="file"
          accept={accept}
          className="sr-only"
          tabIndex={-1}
          aria-label={title}
          onChange={(event) => {
            upload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
      {children}
    </div>
  );
}
