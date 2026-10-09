import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { detectFileType } from "@/lib/storage";
import { isValidCups } from "@/sectors/electricity/cups";

import { SAMPLE_INVOICES, SEED_INVOICES } from "./sample-invoices";
import { invoiceLines } from "./sample-readings";
import { SAMPLE_TARIFF_SHEET } from "./sample-tariff-sheet";

describe("Facturas de ejemplo", () => {
  it("D2 · el proyecto trae facturas y un tarifario inventados, listos para subir en la demo", () => {
    const types = SAMPLE_INVOICES.map(({ file, asPhoto }) => {
      const sample = path.resolve("ejemplos", `${file}.${asPhoto ? "jpg" : "pdf"}`);
      expect(existsSync(sample), sample).toBe(true);
      return detectFileType(readFileSync(sample));
    });

    expect(types).toEqual(["application/pdf", "application/pdf", "image/jpeg"]);
    expect(detectFileType(readFileSync(path.resolve("ejemplos", `${SAMPLE_TARIFF_SHEET.file}.pdf`)))).toBe("application/pdf");
    // Inventadas, pero coherentes: CUPS con sus letras de control y, la primera, el ejemplo hecho a mano.
    expect([...SAMPLE_INVOICES, ...SEED_INVOICES].every(({ data }) => isValidCups(data.cups))).toBe(true);
    expect(invoiceLines(SAMPLE_INVOICES[0]).totalCents).toBe(9365);
  });
});
