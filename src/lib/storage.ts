import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * La carpeta privada donde se guardan los archivos subidos (docs/decisions/0005). Está fuera de `public/`:
 * nada de lo que hay aquí tiene dirección propia. Solo se entrega a través de la app, que comprueba antes
 * la sesión y el dueño.
 */
function storageDir(): string {
  // El comentario le dice al compilador que esta carpeta se decide al arrancar: sin él, intentaría
  // empaquetar el proyecto entero por si acaso.
  return path.resolve(/* turbopackIgnore: true */ process.env.STORAGE_DIR ?? "storage");
}

/** Los tipos de archivo que la app sabe reconocer, con la extensión con la que los guarda. */
const EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Un nombre de archivo guardado: aleatorio y con una extensión conocida. Nada de rutas. */
const STORAGE_KEY = /^[0-9a-f-]{36}\.(pdf|jpg|png|webp)$/;

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

/**
 * El tipo real de un archivo, por sus primeros bytes. No se usa el nombre ni el tipo que dice el navegador,
 * que los puede poner quien sube el archivo.
 */
export function detectFileType(bytes: Uint8Array): string | null {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}

function filePath(storageKey: string): string {
  if (!STORAGE_KEY.test(storageKey)) throw new Error("Nombre de archivo guardado no válido");
  return path.join(/* turbopackIgnore: true */ storageDir(), storageKey);
}

/** Guarda un archivo con un nombre aleatorio y devuelve ese nombre. */
export async function storeFile(bytes: Uint8Array, mimeType: string): Promise<string> {
  const extension = EXTENSIONS[mimeType];
  if (!extension) throw new Error("Tipo de archivo no admitido");

  const storageKey = `${randomUUID()}.${extension}`;
  await mkdir(storageDir(), { recursive: true });
  await writeFile(filePath(storageKey), bytes);
  return storageKey;
}

export async function loadFile(storageKey: string): Promise<Buffer> {
  return readFile(filePath(storageKey));
}

export async function removeFile(storageKey: string): Promise<void> {
  await rm(filePath(storageKey), { force: true });
}
