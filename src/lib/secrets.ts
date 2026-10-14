import "server-only";

import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

/**
 * Cifra las claves de servicios que el usuario escribe en la propia app, como la de OpenRouter, para
 * guardarlas en la base de datos (AGENTS.md, «Seguridad»; docs/decisions/0010).
 *
 * La llave sale de `BETTER_AUTH_SECRET`, que solo está en `.env.local` o en las variables del servidor:
 * quien copie la base de datos sin ese archivo no puede leer las claves. Si esa clave cambia, lo cifrado
 * antes deja de poder leerse y hay que volver a escribirlo en la app.
 */

const ALGORITHM = "aes-256-gcm";
const FORMAT_VERSION = "v1";
const IV_BYTES = 12;
const KEY_BYTES = 32;
/**
 * Para qué es la llave: así no coincide con ninguna otra que se saque de la misma clave. Si cambia, lo
 * cifrado antes ya no se puede leer.
 */
const KEY_PURPOSE = "claves de servicios escritas en la app";

function encryptionKey(): Buffer {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("Falta BETTER_AUTH_SECRET: sin ella no se pueden cifrar las claves.");
  return Buffer.from(hkdfSync("sha256", secret, "", KEY_PURPOSE, KEY_BYTES));
}

/**
 * Cifra `secret`. `owner` ata lo cifrado a su dueño: copiado al registro de otro, ya no se puede descifrar.
 */
export function encryptSecret(secret: string, owner: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  cipher.setAAD(Buffer.from(owner));
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [FORMAT_VERSION, iv, cipher.getAuthTag(), encrypted].map((part) => (typeof part === "string" ? part : part.toString("base64"))).join(":");
}

/** Lo descifrado, o `null` si no se puede: estropeado, de otro dueño o cifrado con otra llave. */
export function decryptSecret(stored: string, owner: string): string | null {
  const [version, iv, tag, encrypted] = stored.split(":");
  if (version !== FORMAT_VERSION || !iv || !tag || !encrypted) return null;
  try {
    const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(iv, "base64"));
    decipher.setAAD(Buffer.from(owner));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64")), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
