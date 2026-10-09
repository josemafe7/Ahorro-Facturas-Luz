"use client";

import { ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import type { StoredFileRef } from "@/data/files";
import { routes } from "@/lib/routes";

import { removeBrandLogoAction, saveBrandLogoAction } from "../actions";

/** Regla A4: el logo del asesor, que sale en la cabecera del PDF. */
export function LogoField({ logo, accept, hint }: { logo: StoredFileRef | null; accept: string; hint: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function upload(file: File | undefined) {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    startTransition(async () => {
      const result = await saveBrandLogoAction(form);
      setError(result.ok ? null : result.message);
      if (result.ok) toast.success("Logo guardado.");
    });
  }

  function remove() {
    startTransition(async () => {
      await removeBrandLogoAction();
      setError(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">Logo</p>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex size-16 items-center justify-center overflow-hidden rounded-lg border bg-card text-muted-foreground">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element -- es un archivo privado servido por la app: next/image no puede optimizarlo
            <img src={routes.file(logo.id)} alt="Tu logo" className="size-full object-contain" />
          ) : (
            <ImageIcon className="size-6" aria-hidden />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => input.current?.click()} disabled={pending}>
              <UploadIcon aria-hidden />
              {logo ? "Cambiar logo" : "Subir logo"}
            </Button>
            {logo && (
              <Button type="button" variant="ghost" onClick={remove} disabled={pending}>
                <Trash2Icon aria-hidden />
                Quitar
              </Button>
            )}
          </div>
          <p className="text-[13px] text-muted-foreground">{hint}</p>
        </div>
        <input
          ref={input}
          type="file"
          accept={accept}
          className="sr-only"
          tabIndex={-1}
          aria-label="Logo"
          onChange={(event) => {
            upload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
