import { ChevronDownIcon, ExternalLinkIcon } from "lucide-react";

import { appConfig } from "@/config/app";
import type { StoredFileRef } from "@/data/files";
import { routes } from "@/lib/routes";

const { document: texts } = appConfig.sector.texts;

/**
 * El documento original, para tenerlo delante mientras se revisan sus datos (regla R1). Se pide a la ruta
 * protegida de archivos, que solo lo entrega a su dueño.
 *
 * Se puede plegar: en el móvil va encima del formulario (DESIGN.md) y así no hay que pasarlo entero para
 * llegar a los datos.
 */
export function DocumentViewer({ file }: { file: StoredFileRef }) {
  const src = routes.file(file.id);

  return (
    <details open className="group overflow-hidden rounded-lg border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
        {texts.original}
        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t">
        {file.mimeType === "application/pdf" ? (
          // Sin el panel de miniaturas y ajustado al ancho: lo que importa es leer la factura.
          <iframe src={`${src}#navpanes=0&view=FitH`} title={texts.original} className="h-[50vh] w-full lg:h-[70vh]" />
        ) : (
          <div className="max-h-[50vh] overflow-auto lg:max-h-[70vh]">
            {/* eslint-disable-next-line @next/next/no-img-element -- es un archivo privado servido por la app: next/image no puede optimizarlo */}
            <img src={src} alt={texts.original} className="w-full" />
          </div>
        )}
      </div>
      {/* Hay móviles que no enseñan un PDF dentro de una página: desde aquí se abre siempre. */}
      <a
        href={src}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 border-t px-4 py-2.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ExternalLinkIcon className="size-4" aria-hidden />
        Abrir en otra pestaña
      </a>
    </details>
  );
}
