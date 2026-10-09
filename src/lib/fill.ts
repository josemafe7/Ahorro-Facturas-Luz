/**
 * Rellena los huecos `{así}` de un texto de la configuración:
 * `fill("Borrar el estudio de {nombre}", { nombre: "Marta" })`. Un hueco sin valor se deja tal cual.
 */
export function fill(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (hole, name: string) => (name in values ? String(values[name]) : hole));
}
