import { appConfig } from "@/config/app";
import { getStudyReport } from "@/data/reports";
import { parseId } from "@/lib/ids";
import { renderStudyReport } from "@/lib/pdf/study-report-document";
import { getSessionUser } from "@/lib/session";

const { study: texts } = appConfig.sector.texts;
const NOT_FOUND = new Response(null, { status: 404 });

/** Sin tildes ni espacios, para un nombre de archivo: «Marta Soler Vidal» → «marta-soler-vidal». */
function slug(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** «estudio-marta-soler-vidal.pdf», o «estudio-de-ahorro.pdf» si no se sabe de quién es. */
function fileName(customer: string | undefined): string {
  const who = slug(customer ?? "");
  return `${slug(who ? `${texts.name} ${who}` : texts.title)}.pdf`;
}

/**
 * Regla P1: descarga el estudio en PDF. Comprueba la sesión y que el estudio es de quien lo pide; si no, o
 * si todavía no hay una tarifa propuesta, responde lo mismo que si no existiera.
 */
export async function GET(_request: Request, { params }: RouteContext<"/estudios/[id]/pdf">) {
  const user = await getSessionUser();
  if (!user) return NOT_FOUND.clone();

  const id = parseId((await params).id);
  const report = id ? await getStudyReport(user.id, id) : null;
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
