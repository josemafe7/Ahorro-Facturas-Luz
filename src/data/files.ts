import "server-only";

import { db } from "@/lib/db";
import type { Result } from "@/lib/result";
import { detectFileType, loadFile, removeFile, storeFile } from "@/lib/storage";

const BYTES_PER_MB = 1024 * 1024;

/** Qué se admite en una subida: tipos de archivo y tamaño máximo. */
export type UploadRules = { types: readonly string[]; maxMb: number; typesLabel: string };

/** Regla F1: una factura o un tarifario, en PDF o en foto, de hasta 10 MB. */
export const DOCUMENT_UPLOAD: UploadRules = {
  types: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
  maxMb: 10,
  typesLabel: "PDF, JPG, PNG o WebP",
};

/** Regla A4: el logo, en PNG o JPG, de hasta 2 MB. El PDF no admite otros formatos. */
export const LOGO_UPLOAD: UploadRules = {
  types: ["image/png", "image/jpeg"],
  maxMb: 2,
  typesLabel: "PNG o JPG",
};

export type StoredFileRef = { id: string; mimeType: string };

/** Comprueba en el servidor el tipo real y el tamaño de un archivo. Devuelve su tipo si vale. */
export function checkUpload(bytes: Uint8Array, rules: UploadRules): Result<{ mimeType: string }> {
  if (bytes.byteLength === 0) return { ok: false, message: "El archivo está vacío." };
  if (bytes.byteLength > rules.maxMb * BYTES_PER_MB) {
    return { ok: false, message: `El archivo pasa de ${rules.maxMb} MB. Súbelo más pequeño.` };
  }
  const mimeType = detectFileType(bytes);
  if (!mimeType || !rules.types.includes(mimeType)) {
    return { ok: false, message: `Ese tipo de archivo no vale. Sube un ${rules.typesLabel}.` };
  }
  return { ok: true, value: { mimeType } };
}

/**
 * Comprueba un archivo y lo guarda en la carpeta privada a nombre de su dueño. Lo que no cumple se rechaza
 * y no se guarda nada.
 */
export async function saveUpload(userId: string, bytes: Uint8Array, rules: UploadRules): Promise<Result<StoredFileRef>> {
  const checked = checkUpload(bytes, rules);
  if (!checked.ok) return checked;
  const { mimeType } = checked.value;

  const storageKey = await storeFile(bytes, mimeType);
  const file = await db.storedFile.create({
    data: { userId, storageKey, mimeType, size: bytes.byteLength },
    select: { id: true, mimeType: true },
  });
  return { ok: true, value: file };
}

/** Regla V2: el contenido de un archivo, solo para su dueño. `null` si no existe o es de otro asesor. */
export async function getFile(userId: string, fileId: string): Promise<{ mimeType: string; bytes: Buffer } | null> {
  const file = await db.storedFile.findFirst({ where: { id: fileId, userId }, select: { storageKey: true, mimeType: true } });
  if (!file) return null;
  return { mimeType: file.mimeType, bytes: await loadFile(file.storageKey) };
}

/** Borra un archivo de su dueño: el registro y el archivo de la carpeta privada. */
export async function deleteFile(userId: string, fileId: string): Promise<void> {
  const file = await db.storedFile.findFirst({ where: { id: fileId, userId }, select: { id: true, storageKey: true } });
  if (!file) return;
  await db.storedFile.delete({ where: { id: file.id } });
  await removeFile(file.storageKey);
}
