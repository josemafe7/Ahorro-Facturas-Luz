import "server-only";

import { Document, Font, Image, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { StudyReport } from "@/engine/report";
import type { BreakdownLine } from "@/engine/types";
import { formatCents } from "@/lib/format";

// Sin esto, la librería parte las palabras con un guion al final de línea, y en español las parte mal.
Font.registerHyphenationCallback((word) => [word]);

const INK = "#0F172A";
const MUTED = "#475569";
const BORDER = "#E2E8F0";
const SOFT = "#F8FAFC";

const styles = StyleSheet.create({
  page: { paddingBottom: 64, fontFamily: "Helvetica", fontSize: 9, color: INK, lineHeight: 1.4 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 40, paddingVertical: 22 },
  brand: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 44, height: 44, objectFit: "contain", backgroundColor: "#FFFFFF", borderRadius: 6 },
  businessName: { fontSize: 15, fontFamily: "Helvetica-Bold", lineHeight: 1.2 },
  title: { fontSize: 10, textAlign: "right", lineHeight: 1.3, maxWidth: 210 },
  body: { paddingHorizontal: 40, paddingTop: 22 },
  sectionTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  customer: { borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 12, marginBottom: 16 },
  pair: { flexDirection: "row", marginBottom: 2 },
  pairLabel: { width: 130, color: MUTED },
  pairValue: { flex: 1 },
  figures: { flexDirection: "row", gap: 10, marginBottom: 8 },
  figure: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 12 },
  figureLabel: { fontSize: 8.5, color: MUTED },
  figureValue: { fontSize: 20, fontFamily: "Helvetica-Bold", lineHeight: 1.3 },
  figureDetail: { fontSize: 8, color: MUTED },
  proposal: { marginBottom: 16, color: MUTED },
  headRow: { flexDirection: "row", backgroundColor: SOFT, borderTopWidth: 1, borderBottomWidth: 1, borderColor: BORDER, paddingVertical: 5 },
  row: { flexDirection: "row", borderBottomWidth: 1, borderColor: BORDER, paddingVertical: 4.5 },
  totalRow: { flexDirection: "row", paddingVertical: 6 },
  concept: { width: "24%", paddingLeft: 6 },
  operation: { width: "25%", color: MUTED, fontSize: 8 },
  amount: { width: "13%", textAlign: "right", paddingRight: 14 },
  bold: { fontFamily: "Helvetica-Bold" },
  notes: { marginTop: 16 },
  note: { fontSize: 8, color: MUTED, marginBottom: 3 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, borderTopWidth: 1, borderColor: BORDER, paddingTop: 8, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: MUTED },
});

/** Blanco o casi negro, lo que se lea mejor sobre un color de fondo. */
function textColorOn(background: string): string {
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(background.slice(start, start + 2), 16));
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 150 ? INK : "#FFFFFF";
}

function Figure({ label, value, detail, color }: { label: string; value: string; detail: string; color?: string }) {
  return (
    <View style={[styles.figure, color ? { borderColor: color, borderWidth: 1.5 } : {}]}>
      <Text style={styles.figureLabel}>{label}</Text>
      <Text style={[styles.figureValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.figureDetail}>{detail}</Text>
    </View>
  );
}

function BreakdownRow({ line, other }: { line: BreakdownLine; other?: BreakdownLine }) {
  return (
    <View style={styles.row} wrap={false}>
      <Text style={styles.concept}>{line.label}</Text>
      <Text style={styles.operation}>{line.operation}</Text>
      <Text style={styles.amount}>{formatCents(line.cents)}</Text>
      <Text style={styles.operation}>{other?.operation ?? ""}</Text>
      <Text style={styles.amount}>{other ? formatCents(other.cents) : ""}</Text>
    </View>
  );
}

/**
 * El estudio en PDF. Solo pinta lo que le llega: todos los importes vienen ya calculados en `report`
 * (reglas P2 a P5).
 */
function StudyReportDocument({ report }: { report: StudyReport }) {
  const { brand, texts } = report;
  const onBrand = textColorOn(brand.color);
  const proposedById = new Map(report.proposed.lines.map((line) => [line.id, line]));
  const period = `en una factura de ${report.periodDays} días`;
  const contact = [brand.phone, brand.email, brand.website].filter(Boolean).join("  ·  ");

  return (
    <Document title={`${texts.title} · ${report.customer[0]?.value ?? ""}`} author={brand.businessName}>
      <Page size="A4" style={styles.page}>
        <View style={[styles.header, { backgroundColor: brand.color }]}>
          <View style={styles.brand}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- es una imagen de un PDF, no de una página web */}
            {brand.logo && <Image style={styles.logo} src={{ data: Buffer.from(brand.logo.data), format: brand.logo.format }} />}
            <Text style={[styles.businessName, { color: onBrand }]}>{brand.businessName}</Text>
          </View>
          <Text style={[styles.title, { color: onBrand }]}>{texts.title}</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.customer}>
            {report.customer.map(({ label, value }) => (
              <View key={label} style={styles.pair}>
                <Text style={styles.pairLabel}>{label}</Text>
                <Text style={styles.pairValue}>{value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.figures}>
            <Figure label={texts.currentLabel} value={formatCents(report.current.totalCents)} detail={period} />
            <Figure label={texts.proposedLabel} value={formatCents(report.proposed.totalCents)} detail={period} />
            <Figure
              label={texts.savingsYearLabel}
              value={formatCents(report.savings.yearCents)}
              detail={`${texts.savingsMonthLabel}: ${formatCents(report.savings.monthCents)}`}
              color={brand.color}
            />
          </View>
          <Text style={styles.proposal}>Tarifa propuesta: {report.offerLabel}</Text>

          <Text style={styles.sectionTitle}>{texts.breakdownTitle}</Text>
          <View style={styles.headRow}>
            <Text style={[styles.concept, styles.bold]}>Concepto</Text>
            <Text style={[styles.operation, styles.bold, { color: INK, fontSize: 9 }]}>Hoy</Text>
            <Text style={[styles.amount, styles.bold]}>Importe</Text>
            <Text style={[styles.operation, styles.bold, { color: INK, fontSize: 9 }]}>Con la tarifa propuesta</Text>
            <Text style={[styles.amount, styles.bold]}>Importe</Text>
          </View>
          {report.current.lines.map((line) => (
            <BreakdownRow key={line.id} line={line} other={proposedById.get(line.id)} />
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.concept, styles.bold]}>Total</Text>
            <Text style={styles.operation} />
            <Text style={[styles.amount, styles.bold]}>{formatCents(report.current.totalCents)}</Text>
            <Text style={styles.operation} />
            <Text style={[styles.amount, styles.bold]}>{formatCents(report.proposed.totalCents)}</Text>
          </View>

          <View style={styles.notes}>
            {report.notes.map((note) => (
              <Text key={note} style={styles.note}>
                {note}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text>{brand.businessName}</Text>
          <Text>{contact}</Text>
        </View>
      </Page>
    </Document>
  );
}

/** Genera el PDF del estudio. */
export function renderStudyReport(report: StudyReport): Promise<Buffer> {
  return renderToBuffer(<StudyReportDocument report={report} />);
}
