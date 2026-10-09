/**
 * Deja la app lista para arrancar en un ordenador nuevo: `pnpm bootstrap`.
 *
 * 1. Si no existe `.env.local`, lo crea con una clave de sesiones recién generada. Si ya existe, no lo toca.
 * 2. Crea o pone al día la base de datos de desarrollo desde las migraciones.
 * 3. Carga los datos de ejemplo.
 *
 * Se puede ejecutar las veces que haga falta. Nunca donde haya datos reales (docs/security.md).
 */
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const ENV_FILE = ".env.local";
const require = createRequire(import.meta.url);
const run = (script, ...args) => execFileSync(process.execPath, [require.resolve(script), ...args], { stdio: "inherit" });

if (!existsSync(ENV_FILE)) {
  const lines = [
    "# Claves de este ordenador. Este archivo nunca se sube a Git.",
    `BETTER_AUTH_SECRET=${randomBytes(32).toString("base64")}`,
    "",
    "# La clave de OpenRouter, que paga las lecturas de la IA: https://openrouter.ai/keys",
    "# Sin ella la app funciona, pero los datos de cada factura se rellenan a mano.",
    "# OPENROUTER_API_KEY=",
    "",
  ];
  writeFileSync(ENV_FILE, lines.join("\n"), { mode: 0o600 });
  console.log(`Creado ${ENV_FILE} con una clave de sesiones nueva.`);
}

run("prisma/build/index.js", "migrate", "deploy");
run("tsx/cli", "--conditions=react-server", `--env-file-if-exists=${ENV_FILE}`, "prisma/seed.ts");
console.log("\nListo. Arranca la app con: pnpm dev");
