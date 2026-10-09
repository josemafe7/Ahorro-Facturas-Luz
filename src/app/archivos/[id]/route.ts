import { getFile } from "@/data/files";
import { getSessionUser } from "@/lib/session";

const NOT_FOUND = new Response(null, { status: 404 });

/**
 * Regla V2: la única puerta a un archivo subido. Comprueba la sesión y que el archivo es de quien lo pide;
 * si no, responde lo mismo que si no existiera.
 */
export async function GET(_request: Request, { params }: RouteContext<"/archivos/[id]">) {
  const user = await getSessionUser();
  if (!user) return NOT_FOUND.clone();

  const { id } = await params;
  const file = await getFile(user.id, id);
  if (!file) return NOT_FOUND.clone();

  return new Response(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": "inline",
      // Datos personales: ni el navegador ni nada intermedio guarda una copia.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
