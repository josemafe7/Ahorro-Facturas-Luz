/** Archivos mínimos para las pruebas: solo importan sus primeros bytes, que dicen de qué tipo son. */

const encode = (text: string) => new TextEncoder().encode(text);

export const PDF_BYTES = encode("%PDF-1.7\n% factura inventada para las pruebas\n");
export const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
/** Un programa disfrazado: aunque se llame «factura.pdf», no es un PDF. */
export const EXE_BYTES = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);

export function bytesOfSize(megabytes: number): Uint8Array {
  const bytes = new Uint8Array(megabytes * 1024 * 1024);
  bytes.set(PDF_BYTES);
  return bytes;
}
