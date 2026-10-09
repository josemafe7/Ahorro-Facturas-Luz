import { inflateSync } from "node:zlib";

/**
 * El texto que lleva un PDF generado por la app, para comprobar que dice lo que tiene que decir. Vale para
 * los PDF de @react-pdf/renderer con sus fuentes de serie; no es un lector de PDF general.
 */
export function pdfText(pdf: Buffer): string {
  const lines: string[] = [];
  let from = 0;
  for (;;) {
    const start = pdf.indexOf("stream\n", from);
    const end = start === -1 ? -1 : pdf.indexOf("endstream", start);
    if (end === -1) break;
    from = end;

    let content: string;
    try {
      content = inflateSync(pdf.subarray(start + "stream\n".length, end)).toString("latin1");
    } catch {
      continue; // Una imagen u otro contenido que no es texto.
    }
    // Cada texto va como una lista de trozos en hexadecimal, separados por ajustes de espaciado.
    for (const [, pieces] of content.matchAll(/\[((?:<[0-9a-f]*>|[-\d.\s])*)\]\s*TJ/gi)) {
      lines.push([...pieces.matchAll(/<([0-9a-f]*)>/gi)].map(([, hex]) => Buffer.from(hex, "hex").toString("latin1")).join(""));
    }
  }
  return lines.join(" ").replace(/\s+/g, " ");
}
