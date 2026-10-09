import { describe, expect, it } from "vitest";

import { parseNumber } from "./format";

describe("Escribir números", () => {
  it("R6 · un número vale con coma o con punto decimal, y el punto solo separa miles cuando no cabe duda", () => {
    expect(parseNumber("0,084")).toBe(0.084);
    // Con punto decimal, como sale de muchos teclados numéricos. Antes «0.084» se guardaba como 84.
    expect(parseNumber("0.084")).toBe(0.084);
    expect(parseNumber("0.123288")).toBe(0.123288);
    expect(parseNumber("93.65")).toBe(93.65);

    // A la española, el punto separa miles: tres cifras detrás de un grupo que no empieza por cero.
    expect(parseNumber("1.234")).toBe(1234);
    expect(parseNumber("1.234,56")).toBe(1234.56);
    expect(parseNumber("12.345.678")).toBe(12345678);

    // Lo que no se entiende no se adivina: es un error que se le enseña a la persona.
    expect(parseNumber("1,234.56")).toBeNull();
    expect(parseNumber("doce")).toBeNull();
    expect(parseNumber("")).toBeNull();
  });
});
