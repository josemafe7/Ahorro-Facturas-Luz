import { getStudyReport } from "@/data/reports";
import { renderStudyReport } from "@/lib/pdf/study-report-document";
import { getSessionUser } from "@/lib/session";

const NOT_FOUND = new Response(null, { status: 404 });

/** Un nombre de archivo sin tildes ni espacios: «estudio-marta-soler-vidal.pdf». */
function fileName(customer: string | undefined): string {
  const slug = (customer ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `estudio-${slug || "de-ahorro"}.pdf`;
}

/**
 * Regla P1: descarga el estudio en PDF. Comprueba la sesión y que el estudio es de quien lo pide; si no, o
 * si todavía no hay una tarifa propuesta, responde lo mismo que si no existiera.
 */
export async function GET(_request: Request, { params }: RouteContext<"/estudios/[id]/pdf">) {
  const user = await getSessionUser();
  if (!user) return NOT_FOUND.clone();

  const { id } = await params;
  const report = await getStudyReport(user.id, id);
  if (!report) return NOT_FOUND.clone();

  const pdf = await renderStudyReport(report);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName(report.customer[0]?.value)}"`,
      // Lleva datos personales: no se guarda copia en ningún sitio intermedio.
      "Cache-Control": "private, no-store",
    },
  });
}
