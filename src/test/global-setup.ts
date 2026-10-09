import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";

import { TEMPLATE_DATABASE, TEST_DATA_DIR } from "./paths";

/**
 * Antes de todas las pruebas: crea la base de datos plantilla desde las migraciones, igual que se crearía
 * la de producción. Las pruebas nunca tocan el archivo de desarrollo (docs/testing.md).
 */
export default function globalSetup() {
  rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DATA_DIR, { recursive: true });

  const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");
  execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: `file:${TEMPLATE_DATABASE}` },
    stdio: "pipe",
  });

  return () => rmSync(TEST_DATA_DIR, { recursive: true, force: true });
}
