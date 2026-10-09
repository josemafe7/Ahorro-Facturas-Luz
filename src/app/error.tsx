"use client";

import { Button } from "@/components/ui/button";

// Recoge los errores inesperados. La persona ve un mensaje genérico: el detalle se queda en el servidor.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div>
        <h1 className="text-xl font-semibold">Algo ha fallado</h1>
        <p className="mt-1 text-muted-foreground">No hemos podido completar lo que pedías. Prueba otra vez.</p>
      </div>
      <Button onClick={reset}>Reintentar</Button>
    </main>
  );
}
