import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { HOME_PATH } from "@/lib/routes";

// El mismo mensaje para lo que no existe y para lo que es de otra persona: no se revela cuál de las dos.
export default function NotFound() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <div>
        <h1 className="text-xl font-semibold">No existe o no es tuyo</h1>
        <p className="mt-1 text-muted-foreground">Lo que buscas no está aquí o no tienes permiso para verlo.</p>
      </div>
      <Link href={HOME_PATH} className={buttonVariants()}>
        Volver al inicio
      </Link>
    </main>
  );
}
