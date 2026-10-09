import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { appConfig } from "./app";

const SOURCE_DIR = path.resolve("src");
const CONFIG_FILE = path.join(SOURCE_DIR, "config", "app.ts");
const SKIPPED_DIRS = new Set(["generated", "test"]);

/** Todos los archivos de código y de estilos de `src/`, menos el propio archivo de configuración. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) return SKIPPED_DIRS.has(name) ? [] : sourceFiles(file);
    const isSource = /\.(ts|tsx|css)$/.test(name) && !/\.test\.ts$/.test(name);
    return isSource && file !== CONFIG_FILE ? [file] : [];
  });
}

describe("M1 · la marca sale de un único archivo", () => {
  it("ningún otro archivo escribe el nombre de la app ni sus colores de marca", () => {
    const { name, colors } = appConfig.brand;
    const brandValues = [name, colors.primary, colors.primaryHover, colors.primarySoft].map((value) => value.toLowerCase());

    const offenders = sourceFiles(SOURCE_DIR).filter((file) => {
      const content = readFileSync(file, "utf8").toLowerCase();
      return brandValues.some((value) => content.includes(value));
    });

    expect(offenders.map((file) => path.relative(SOURCE_DIR, file))).toEqual([]);
  });

  it("fuera del módulo del sector, ningún archivo escribe cómo se llaman el documento, el proveedor, la oferta y el estudio", () => {
    const { document, provider, offer, study } = appConfig.sector.texts;
    const names = [document.name, provider.name, offer.name, study.name].map((name) => name.toLowerCase());
    // El módulo del sector es lo que se reescribe para otro negocio, y las direcciones de la app no son textos.
    const allowed = [path.join(SOURCE_DIR, "sectors") + path.sep, path.join(SOURCE_DIR, "lib", "routes.ts")];

    const offenders = sourceFiles(SOURCE_DIR)
      .filter((file) => !allowed.some((prefix) => file.startsWith(prefix)))
      .flatMap((file) => {
        const written = withoutCommentsNorRoutes(readFileSync(file, "utf8")).toLowerCase();
        const found = names.filter((name) => written.includes(name));
        return found.length > 0 ? [`${path.relative(SOURCE_DIR, file)}: ${found.join(", ")}`] : [];
      });

    expect(offenders).toEqual([]);
  });
});

/** El código sin sus comentarios, que pueden hablar de lo que quieran, y sin los tipos que nombran una ruta. */
function withoutCommentsNorRoutes(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/\b(PageProps|RouteContext|LayoutProps)<"[^"]*">/g, "");
}
