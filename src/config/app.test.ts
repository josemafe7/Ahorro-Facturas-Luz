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
});
