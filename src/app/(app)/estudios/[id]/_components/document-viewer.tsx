import { appConfig } from "@/config/app";
import type { StoredFileRef } from "@/data/files";
import { routes } from "@/lib/routes";

const { document: texts } = appConfig.sector.texts;

/**
 * El documento original, para tenerlo delante mientras se revisan sus datos (regla R1). Se pide a la ruta
 * protegida de archivos, que solo lo entrega a su dueño.
 */
export function DocumentViewer({ file }: { file: StoredFileRef }) {
  const src = routes.file(file.id);

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <p className="border-b px-4 py-2.5 font-medium">{texts.original}</p>
      {file.mimeType === "application/pdf" ? (
        // Sin el panel de miniaturas y ajustado al ancho: lo que importa es leer la factura.
        <iframe src={`${src}#navpanes=0&view=FitH`} title={texts.original} className="h-[70vh] w-full" />
      ) : (
        <div className="max-h-[70vh] overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element -- es un archivo privado servido por la app: next/image no puede optimizarlo */}
          <img src={src} alt={texts.original} className="w-full" />
        </div>
      )}
    </div>
  );
}
