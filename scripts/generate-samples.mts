/**
 * Genera las facturas de ejemplo de `ejemplos/` a partir de `scripts/sample-invoices.ts`: `pnpm samples`.
 *
 * Los importes de cada factura se calculan con la misma fórmula que usa la app, para que las facturas sean
 * coherentes por dentro, como una de verdad. La que va «como foto» se convierte a JPG con dos herramientas
 * que trae macOS (`qlmanage` y `sips`); en otro sistema se queda en PDF y el script lo avisa.
 *
 * Es un módulo `.mts` y no usa JSX porque la librería del PDF solo se puede cargar como módulo moderno, y
 * así es como se ejecuta este archivo fuera de Next.js.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { Document, Font, Page, renderToFile, StyleSheet, Text, View } from "@react-pdf/renderer";
import { createElement as h, type ReactNode } from "react";

import { formatCents, formatDate, formatNumber } from "@/lib/format";
import { DEFAULT_ELECTRICITY_SETTINGS } from "@/sectors/electricity/settings";
import { ENERGY_PERIODS, POWER_PERIODS, POWER_PRICE_UNIT_LABELS } from "@/sectors/electricity/texts";

import { SAMPLE_INVOICES, SEED_INVOICES, type SampleInvoice } from "./sample-invoices";
import { invoiceLines } from "./sample-readings";
import { SAMPLE_TARIFF_SHEET } from "./sample-tariff-sheet";

// Sin esto, la librería parte las palabras con un guion al final de línea.
Font.registerHyphenationCallback((word) => [word]);

/** Las facturas para subir en la demo. */
const DEMO_DIR = path.resolve("ejemplos");
/** Las facturas de los estudios que carga `pnpm seed`. */
const SEED_DIR = path.resolve("prisma/seed/facturas");
const POWER_KEYS = ["p1", "p2"] as const;
const ENERGY_KEYS = ["p1", "p2", "p3"] as const;
const settings = DEFAULT_ELECTRICITY_SETTINGS;

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 9.5, fontFamily: "Helvetica", color: "#111827", lineHeight: 1.4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 },
  providerName: { fontSize: 20, fontFamily: "Helvetica-Bold", lineHeight: 1.2, marginBottom: 3 },
  muted: { color: "#6b7280" },
  title: { fontSize: 13, fontFamily: "Helvetica-Bold", textAlign: "right", lineHeight: 1.2, marginBottom: 3 },
  columns: { flexDirection: "row", gap: 16, marginBottom: 16 },
  box: { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4, padding: 10 },
  boxTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", marginBottom: 5 },
  pair: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  sectionTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold", marginTop: 6, marginBottom: 6 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f3f4f6", paddingVertical: 4 },
  headRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#d1d5db", paddingBottom: 4 },
  concept: { flex: 3 },
  operation: { flex: 4, color: "#374151" },
  amount: { flex: 1.4, textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, padding: 10, borderRadius: 4 },
  totalText: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  footer: { position: "absolute", bottom: 26, left: 40, right: 40, fontSize: 7.5, color: "#9ca3af", textAlign: "center" },
});

const PRINTED_LABELS: Record<string, string> = {
  "electricity-tax": "Impuesto sobre la electricidad",
  "meter-rental": "Alquiler de equipos de medida",
};

function pair(label: string, value: string, key?: string) {
  return h(View, { style: styles.pair, key }, h(Text, { style: styles.muted }, label), h(Text, null, value));
}

function box(title: string, color: string, ...children: ReactNode[]) {
  return h(View, { style: styles.box }, h(Text, { style: [styles.boxTitle, { color }] }, title), ...children);
}

function invoiceDocument(sample: SampleInvoice) {
  const { data, provider } = sample;
  const { lines, totalCents } = invoiceLines(sample);
  const unit = POWER_PRICE_UNIT_LABELS[data.powerPrice.p1.unit];
  const right = { textAlign: "right" } as const;

  return h(
    Document,
    // Con la fecha fija, generar dos veces la misma factura da el mismo archivo.
    { title: `Factura ${sample.invoiceNumber}`, author: provider.name, creationDate: new Date(sample.issuedOn), modificationDate: new Date(sample.issuedOn) },
    h(
      Page,
      { size: "A4", style: styles.page },
      h(
        View,
        { style: styles.header },
        h(View, null, h(Text, { style: [styles.providerName, { color: provider.color }] }, provider.name), h(Text, { style: styles.muted }, provider.tagline)),
        h(
          View,
          null,
          h(Text, { style: styles.title }, "FACTURA DE ELECTRICIDAD"),
          h(Text, { style: right }, `N.º de factura: ${sample.invoiceNumber}`),
          h(Text, { style: right }, `Fecha de emisión: ${formatDate(sample.issuedOn)}`),
        ),
      ),
      h(
        View,
        { style: styles.columns },
        box(
          "Titular del contrato",
          provider.color,
          h(Text, { style: { fontFamily: "Helvetica-Bold" } }, data.holder),
          h(Text, { style: [styles.muted, { marginTop: 4 }] }, "Dirección de suministro"),
          h(Text, null, data.supplyAddress),
        ),
        box(
          "Datos del contrato",
          provider.color,
          pair("CUPS", data.cups),
          pair("Tarifa de acceso (peaje)", data.accessTariff),
          pair("Potencia contratada punta (P1)", `${formatNumber(data.powerKw.p1)} kW`),
          pair("Potencia contratada valle (P2)", `${formatNumber(data.powerKw.p2)} kW`),
          pair("Comercializadora", provider.name),
        ),
      ),
      h(
        View,
        { style: styles.columns },
        box(
          "Periodo de facturación",
          provider.color,
          pair("Desde", formatDate(data.periodStart)),
          pair("Hasta", formatDate(data.periodEnd)),
          pair("Días facturados", String(data.days)),
        ),
        box(
          "Consumo del periodo",
          provider.color,
          ...ENERGY_KEYS.map((period) => pair(`Energía ${ENERGY_PERIODS[period]} (${period.toUpperCase()})`, `${formatNumber(data.energyKwh[period])} kWh`, period)),
        ),
      ),
      h(Text, { style: styles.sectionTitle }, "Precios aplicados (sin impuestos)"),
      h(
        View,
        { style: styles.columns },
        h(
          View,
          { style: styles.box },
          ...POWER_KEYS.map((period) =>
            pair(`Potencia ${POWER_PERIODS[period]} (${period.toUpperCase()})`, `${formatNumber(data.powerPrice[period].amount)} €/kW ${unit}`, period),
          ),
        ),
        h(
          View,
          { style: styles.box },
          ...ENERGY_KEYS.map((period) => pair(`Energía ${ENERGY_PERIODS[period]} (${period.toUpperCase()})`, `${formatNumber(data.energyPrice[period])} €/kWh`, period)),
        ),
      ),
      h(Text, { style: styles.sectionTitle }, "Detalle de la factura"),
      h(
        View,
        { style: styles.headRow },
        h(Text, { style: [styles.concept, styles.muted] }, "Concepto"),
        h(Text, { style: [styles.operation, styles.muted] }, "Cálculo"),
        h(Text, { style: [styles.amount, styles.muted] }, "Importe"),
      ),
      ...lines.map((line) =>
        h(
          View,
          { style: styles.row, key: line.id },
          h(Text, { style: styles.concept }, PRINTED_LABELS[line.id] ?? line.label),
          h(Text, { style: styles.operation }, line.id === "meter-rental" ? `${data.days} días × ${formatNumber(settings.meterRentalPerDay)} €` : line.operation),
          h(Text, { style: styles.amount }, formatCents(line.cents)),
        ),
      ),
      h(
        View,
        { style: [styles.totalRow, { backgroundColor: provider.color }] },
        h(Text, { style: styles.totalText }, "TOTAL FACTURA"),
        h(Text, { style: styles.totalText }, formatCents(totalCents)),
      ),
      h(
        Text,
        { style: styles.footer },
        "Factura de ejemplo inventada para la demo de Estudio de Ahorro. Ni la comercializadora, ni la persona, ni la dirección, ni el CUPS son reales.",
      ),
    ),
  );
}

/** El tarifario de ejemplo: una tabla de tarifas como la que reparte una comercializadora. */
function tariffSheetDocument() {
  const { provider, title, validity, rows, footnote } = SAMPLE_TARIFF_SHEET;
  const column = (flex: number) => ({ flex, paddingRight: 6 });
  const cells = [column(2.2), column(1.1), column(2.6), column(3.6), column(2.6)];
  const headers = ["Tarifa", "Peaje", "Potencia punta · valle (€/kW año)", "Energía (€/kWh)", "Condiciones"];

  return h(
    Document,
    { title: `Tarifario ${provider.name}`, author: provider.name, creationDate: new Date("2026-10-01"), modificationDate: new Date("2026-10-01") },
    h(
      Page,
      { size: "A4", orientation: "landscape", style: styles.page },
      h(
        View,
        { style: styles.header },
        h(View, null, h(Text, { style: [styles.providerName, { color: provider.color }] }, provider.name), h(Text, { style: styles.muted }, title)),
        h(View, null, h(Text, { style: styles.title }, "TARIFARIO"), h(Text, { style: { textAlign: "right" } }, "Octubre de 2026")),
      ),
      h(View, { style: styles.headRow }, ...headers.map((header, index) => h(Text, { key: header, style: [cells[index], styles.muted] }, header))),
      ...rows.map((row) =>
        h(
          View,
          { style: [styles.row, { paddingVertical: 8 }], key: row.name },
          h(Text, { style: [cells[0], { fontFamily: "Helvetica-Bold" }] }, row.name),
          h(Text, { style: cells[1] }, row.access),
          h(Text, { style: cells[2] }, row.power),
          h(Text, { style: cells[3] }, row.energy),
          h(Text, { style: cells[4] }, row.notes),
        ),
      ),
      h(Text, { style: { marginTop: 14 } }, footnote),
      h(Text, { style: [styles.muted, { marginTop: 6 }] }, validity),
      h(Text, { style: styles.footer }, "Tarifario de ejemplo inventado para la demo de Estudio de Ahorro. Ni la comercializadora ni sus tarifas son reales."),
    ),
  );
}

/** Convierte un PDF en una foto como la que haría un móvil: algo girada y comprimida. Solo en macOS. */
function toPhoto(pdf: string, jpg: string): boolean {
  const work = mkdtempSync(path.join(tmpdir(), "factura-foto-"));
  try {
    execFileSync("qlmanage", ["-t", "-s", "2000", "-o", work, pdf], { stdio: "ignore" });
    const png = path.join(work, `${path.basename(pdf)}.png`);
    execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "70", "--rotate", "1.2", "--padColor", "E5E7EB", png, "--out", jpg], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

async function generate(sample: SampleInvoice, directory: string) {
  mkdirSync(directory, { recursive: true });
  const pdf = path.join(directory, `${sample.file}.pdf`);
  await renderToFile(invoiceDocument(sample), pdf);
  const total = formatCents(invoiceLines(sample).totalCents);

  if (!sample.asPhoto) {
    console.log(`${sample.file}.pdf · ${sample.data.holder} · total ${total}`);
    return;
  }
  const temporary = path.join(directory, `.${sample.file}.pdf`);
  renameSync(pdf, temporary);
  const jpg = path.join(directory, `${sample.file}.jpg`);
  if (toPhoto(temporary, jpg)) {
    rmSync(temporary);
    console.log(`${sample.file}.jpg · ${sample.data.holder} · total ${total}`);
  } else {
    renameSync(temporary, pdf);
    console.log(`${sample.file}.pdf · no se ha podido convertir en foto (hace falta macOS): se queda en PDF`);
  }
}

async function main() {
  for (const sample of SAMPLE_INVOICES) await generate(sample, DEMO_DIR);
  for (const sample of SEED_INVOICES) await generate(sample, SEED_DIR);

  await renderToFile(tariffSheetDocument(), path.join(DEMO_DIR, `${SAMPLE_TARIFF_SHEET.file}.pdf`));
  console.log(`${SAMPLE_TARIFF_SHEET.file}.pdf · ${SAMPLE_TARIFF_SHEET.provider.name} · ${SAMPLE_TARIFF_SHEET.rows.length} tarifas`);
}

main().catch((error: unknown) => {
  console.error("No se han podido generar las facturas de ejemplo:", error);
  process.exitCode = 1;
});
