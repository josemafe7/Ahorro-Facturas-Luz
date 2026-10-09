/**
 * Prepara lo que necesita la app antes de las pruebas con navegador: una base de datos y una carpeta de
 * archivos propias (`data/e2e`), recién creadas desde las migraciones y con los datos de ejemplo. Nunca toca
 * la base de datos de desarrollo. Lo ejecuta Playwright antes de compilar y arrancar la app, con las mismas
 * variables de entorno que le pasa a ella.
 */
import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const run = (script, ...args) => execFileSync(process.execPath, [require.resolve(script), ...args], { stdio: "inherit" });

rmSync("data/e2e", { recursive: true, force: true });
run("prisma/build/index.js", "migrate", "deploy");
run("tsx/cli", "--conditions=react-server", "prisma/seed.ts");
