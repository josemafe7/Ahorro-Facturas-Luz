import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { proxy } from "./proxy";

const ORIGIN = "http://localhost:3000";

describe("E1 · sin sesión, cualquier dirección acaba en la pantalla de entrada", () => {
  it("redirige a /entrar desde las pantallas y las direcciones privadas", () => {
    for (const pathname of ["/", "/estudios", "/estudios/un-estudio", "/catalogo", "/ajustes", "/archivos/una-factura"]) {
      const response = proxy(new NextRequest(`${ORIGIN}${pathname}`));

      expect(response.status, pathname).toBe(307);
      expect(response.headers.get("location"), pathname).toBe(`${ORIGIN}/entrar`);
    }
  });
});
