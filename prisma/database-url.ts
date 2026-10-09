import { mkdirSync } from "node:fs";
import path from "node:path";

const DEFAULT_DATABASE_FILE = "data/dev.db";

/**
 * La dirección del archivo de la base de datos. Sin `DATABASE_URL` es el de desarrollo; las pruebas y
 * producción ponen el suyo. Se devuelve como ruta absoluta para que la app y los comandos de Prisma abran
 * siempre el mismo archivo, se ejecuten desde donde se ejecuten.
 */
export function databaseUrl(): string {
  const configured = process.env.DATABASE_URL?.replace(/^file:/, "");
  // El comentario le dice al compilador que este archivo se decide al arrancar: sin él, intentaría
  // empaquetar el proyecto entero por si acaso.
  const file = path.resolve(/* turbopackIgnore: true */ process.cwd(), configured || DEFAULT_DATABASE_FILE);
  mkdirSync(path.dirname(file), { recursive: true });
  return `file:${file}`;
}
