import { createUser } from "../../prisma/seed/users";

let counter = 0;

/** Crea un asesor nuevo para una prueba. Cada llamada da uno distinto, para probar con «el dueño» y «otro». */
export async function createTestAdvisor(name = "Asesor"): Promise<{ id: string }> {
  counter += 1;
  return createUser({
    name: `${name} ${counter}`,
    email: `asesor-${counter}-${process.pid}@pruebas.test`,
    password: "una-contrasena-larga",
  });
}
