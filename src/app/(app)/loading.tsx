import { Skeleton } from "@/components/ui/skeleton";

// Mientras carga una pantalla se ve su forma en gris, nunca una pantalla en blanco.
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Cargando">
      <Skeleton className="mb-6 h-7 w-48" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
