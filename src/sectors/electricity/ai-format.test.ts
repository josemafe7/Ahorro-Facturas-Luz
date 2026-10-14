import { describe, expect, it } from "vitest";
import { z } from "zod";

import { invoiceReadingSchema } from "./reading";
import { tariffsReadingSchema } from "./tariff-reading";

/** Cuántos campos del formato que se pide a la IA admiten varias formas: un valor o nulo, o alternativas. */
function fieldsWithAlternatives(schema: z.ZodType): number {
  let count = 0;
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    const entry = node as Record<string, unknown>;
    if (Array.isArray(entry.type) || Array.isArray(entry.anyOf) || Array.isArray(entry.oneOf)) count += 1;
    Object.values(entry).forEach(visit);
  };
  visit(z.toJSONSchema(schema));
  return count;
}

/** Cuántos datos tiene en total el formato, contando los de dentro de las listas. */
function fieldCount(schema: z.ZodType): number {
  let count = 0;
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(visit);
    if (!node || typeof node !== "object") return;
    const entry = node as Record<string, unknown>;
    if (entry.properties && typeof entry.properties === "object") count += Object.keys(entry.properties).length;
    Object.values(entry).forEach(visit);
  };
  visit(z.toJSONSchema(schema));
  return count;
}

/**
 * Claude rechazó la factura cuando su formato tenía 85 datos contados así («The compiled grammar is too
 * large») y aceptó el del tarifario con 34. Cada formato se queda por debajo de este tope.
 */
const MAX_FIELDS = 40;

describe("Lo que se le pide a la IA", () => {
  it("F3 y T5 · el formato no tiene campos con alternativas, para que lo acepten todos los modelos de la lista", () => {
    // Claude rechaza más de 16 («Schemas contains too many parameters with union types») y otros modelos
    // también los limitan. Sin ninguno, vale cualquiera de los modelos que se pueden elegir en Ajustes.
    expect(fieldsWithAlternatives(invoiceReadingSchema)).toBe(0);
    expect(fieldsWithAlternatives(tariffsReadingSchema)).toBe(0);
  });

  it("F3 y T5 · el formato es pequeño: un modelo no acepta uno demasiado grande", () => {
    expect(fieldCount(invoiceReadingSchema)).toBeLessThanOrEqual(MAX_FIELDS);
    expect(fieldCount(tariffsReadingSchema)).toBeLessThanOrEqual(MAX_FIELDS);
  });
});
