/**
 * UNA IA SIMULADA para las pruebas con navegador y para probar la app sin gastar dinero.
 *
 * Es un servidor que responde como OpenRouter. La app se apunta a él con `OPENROUTER_BASE_URL`: no hay
 * ningún «modo de prueba» dentro de la app, que hace exactamente lo mismo que con la IA de verdad. Reconoce
 * las facturas y el tarifario de `ejemplos/` por su contenido y devuelve lo que una IA leería de cada uno;
 * ante cualquier otro documento responde que no es una factura o que no trae tarifas.
 *
 * Para usarlo a mano: `pnpm exec tsx e2e/fake-openrouter.ts` y arrancar la app con
 * `OPENROUTER_API_KEY=simulada OPENROUTER_BASE_URL=http://127.0.0.1:4010`.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import path from "node:path";

import { SAMPLE_INVOICES } from "../scripts/sample-invoices";
import { NOT_AN_INVOICE, sampleReading } from "../scripts/sample-readings";
import { SAMPLE_TARIFF_SHEET, SAMPLE_TARIFF_SHEET_READING } from "../scripts/sample-tariff-sheet";

/** El puerto en el que escucha. Las pruebas de Playwright usan otro, para no chocar con uno abierto a mano. */
export const FAKE_OPENROUTER_PORT = Number(process.env.FAKE_OPENROUTER_PORT ?? 4010);

const SAMPLES_DIR = path.resolve("ejemplos");

const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

/** La lectura que corresponde a cada archivo de ejemplo, por la huella de su contenido. */
function readingsByFile(): Map<string, unknown> {
  const readings = new Map<string, unknown>();
  for (const sample of SAMPLE_INVOICES) {
    const file = [".pdf", ".jpg"].map((extension) => path.join(SAMPLES_DIR, sample.file + extension)).find((candidate) => existsSync(candidate));
    if (file) readings.set(sha256(readFileSync(file)), sampleReading(sample));
  }
  const tariffSheet = path.join(SAMPLES_DIR, `${SAMPLE_TARIFF_SHEET.file}.pdf`);
  if (existsSync(tariffSheet)) readings.set(sha256(readFileSync(tariffSheet)), SAMPLE_TARIFF_SHEET_READING);
  return readings;
}

/** Lo que responde ante un documento que no conoce: que no es una factura o que no trae tarifas, según lo pedido. */
function unknownDocument(body: unknown): unknown {
  const asksForTariffs = JSON.stringify(body).includes('"tariffs"');
  return asksForTariffs ? { tariffs: [] } : NOT_AN_INVOICE;
}

/** Los archivos que vienen dentro de la petición, sea cual sea la forma en que el conector los envíe. */
function attachedFiles(value: unknown, found: Uint8Array[] = []): Uint8Array[] {
  if (typeof value === "string") {
    const match = /^data:[^;]+;base64,(.+)$/s.exec(value);
    if (match) found.push(Buffer.from(match[1], "base64"));
  } else if (Array.isArray(value)) {
    value.forEach((item) => attachedFiles(item, found));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => attachedFiles(item, found));
  }
  return found;
}

export function startFakeOpenRouter(port = FAKE_OPENROUTER_PORT): Promise<Server> {
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      // Se miran los archivos de ejemplo en cada petición: así valen aunque se hayan vuelto a generar.
      const readings = readingsByFile();
      const reading = attachedFiles(body)
        .map((file) => readings.get(sha256(file)))
        .find((match) => match !== undefined);

      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          id: "gen-simulada",
          object: "chat.completion",
          created: 0,
          model: "simulada",
          choices: [
            { index: 0, finish_reason: "stop", message: { role: "assistant", content: JSON.stringify(reading ?? unknownDocument(body)) } },
          ],
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost: 0 },
        }),
      );
    });
  });

  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

// Al ejecutarlo directamente, arranca y se queda escuchando.
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve("e2e/fake-openrouter.ts")) {
  void startFakeOpenRouter().then(() => console.log(`IA simulada en http://127.0.0.1:${FAKE_OPENROUTER_PORT}`));
}
