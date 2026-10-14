/**
 * LA PRUEBA REAL DE LA IA: `pnpm ai:check`. Cuesta dinero (céntimos) y por eso no está entre las pruebas
 * automáticas: lee con el modelo de verdad las facturas y el tarifario de `ejemplos/` y compara lo leído con
 * lo que tienen impreso. Usa la clave y el modelo que el asesor de prueba tenga puestos en Ajustes o, si no
 * tiene clave, `OPENROUTER_API_KEY` de `.env.local`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { aiConfig } from "@/config/ai";
import { readWithAi } from "@/engine/reading";
import { getReadingCredentials } from "@/data/ai-settings";
import { createReadingModel, installationCredentials } from "@/lib/ai";
import { db } from "@/lib/db";
import { detectFileType } from "@/lib/storage";
import { interpretInvoiceReading, invoiceReader } from "@/sectors/electricity/reading";
import { tariffsReader } from "@/sectors/electricity/tariff-reading";

import { DEMO_ADVISOR } from "../prisma/seed/users";
import { SAMPLE_INVOICES } from "./sample-invoices";
import { sampleReading } from "./sample-readings";
import { SAMPLE_TARIFF_SHEET, SAMPLE_TARIFF_SHEET_READING } from "./sample-tariff-sheet";

const limits = { timeoutMs: aiConfig.readingTimeoutMs, maxOutputTokens: aiConfig.maxOutputTokens };
const advisor = await db.user.findUnique({ where: { email: DEMO_ADVISOR.email }, select: { id: true } });
const credentials = advisor ? await getReadingCredentials(advisor.id) : installationCredentials();
if (!credentials) {
  console.error("No hay clave de OpenRouter: ponla en Ajustes con el asesor de prueba o en .env.local.");
  process.exit(1);
}
const model = createReadingModel(credentials);

let totalCost = 0;
let failures = 0;

function load(file: string) {
  const data = readFileSync(path.resolve("ejemplos", file));
  return { data, mediaType: detectFileType(data) ?? "application/octet-stream" };
}

/** Las diferencias entre dos objetos, campo a campo: `energyKwh.p2: esperaba 160, ha leído 180`. */
function differences(expected: unknown, actual: unknown, prefix = ""): string[] {
  if (expected !== null && typeof expected === "object") {
    return Object.entries(expected).flatMap(([key, value]) =>
      differences(value, (actual as Record<string, unknown> | undefined)?.[key], prefix ? `${prefix}.${key}` : key),
    );
  }
  return expected === actual ? [] : [`${prefix}: esperaba ${JSON.stringify(expected)}, ha leído ${JSON.stringify(actual)}`];
}

function report(name: string, seconds: number, usage: { inputTokens?: number; outputTokens?: number; costUsd?: number }, issues: string[], doubts: string[]) {
  totalCost += usage.costUsd ?? 0;
  failures += issues.length;
  const cost = usage.costUsd === undefined ? "coste no informado" : `${(usage.costUsd * 100).toFixed(3)} céntimos de dólar`;
  console.log(`\n${issues.length === 0 ? "✓" : "✗"} ${name} · ${seconds.toFixed(1)} s · ${usage.inputTokens} + ${usage.outputTokens} tokens · ${cost}`);
  issues.forEach((issue) => console.log(`    ${issue}`));
  doubts.forEach((doubt) => console.log(`    marcado para revisar → ${doubt}`));
}

console.log(`Modelo: ${credentials.model}`);

for (const sample of SAMPLE_INVOICES) {
  const file = `${sample.file}.${sample.asPhoto ? "jpg" : "pdf"}`;
  const started = Date.now();
  const outcome = await readWithAi(model, invoiceReader, load(file), limits);
  if (!outcome.ok) {
    failures += 1;
    console.log(`\n✗ ${file} · la lectura ha fallado`);
    continue;
  }
  // Se compara con lo impreso, sin la duda que la IA simulada añade a la foto.
  const expected = interpretInvoiceReading({ ...sampleReading(sample), doubts: [] }).draft;
  const issues = outcome.value.recognized ? differences(expected, outcome.value.draft) : ["no la ha reconocido como factura de luz"];
  report(file, (Date.now() - started) / 1000, outcome.usage, issues, outcome.value.doubts.map(({ field, reason }) => `${field}: ${reason}`));
}

{
  const file = `${SAMPLE_TARIFF_SHEET.file}.pdf`;
  const started = Date.now();
  const outcome = await readWithAi(model, tariffsReader, load(file), limits);
  if (!outcome.ok) {
    failures += 1;
    console.log(`\n✗ ${file} · la lectura ha fallado`);
  } else {
    const expected = tariffsReader.interpret(SAMPLE_TARIFF_SHEET_READING).offers.map(({ draft }) => draft);
    const actual = outcome.value.offers.map(({ draft }) => draft);
    const issues = [
      ...(actual.length === expected.length ? [] : [`esperaba ${expected.length} tarifas (sin la 3.0TD ni la indexada), ha propuesto ${actual.length}`]),
      ...expected.flatMap((tariff, index) => differences({ ...tariff, notes: undefined }, { ...actual[index], notes: undefined }, `tarifa ${index + 1}`)),
    ];
    const doubts = outcome.value.offers.flatMap(({ doubts: found }, index) => found.map(({ field, reason }) => `tarifa ${index + 1} · ${field}: ${reason}`));
    report(file, (Date.now() - started) / 1000, outcome.usage, issues, doubts);
  }
}

console.log(`\nCoste total: ${(totalCost * 100).toFixed(3)} céntimos de dólar. ${failures === 0 ? "Todo lo leído coincide con lo impreso." : `${failures} diferencias: revísalas arriba.`}`);
process.exit(failures === 0 ? 0 : 1);
