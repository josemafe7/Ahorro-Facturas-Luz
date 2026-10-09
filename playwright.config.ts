import { randomBytes } from "node:crypto";

import { defineConfig, devices } from "@playwright/test";

/**
 * Las pruebas con navegador recorren la app compilada como en producción, con su propia base de datos y con
 * la IA simulada (docs/testing.md). Usan puertos propios para no chocar con la app en desarrollo.
 */
const APP_PORT = 3417;
const FAKE_AI_PORT = 4417;
const baseURL = `http://localhost:${APP_PORT}`;

const appEnv = {
  DATABASE_URL: "file:./data/e2e/e2e.db",
  STORAGE_DIR: "./data/e2e/storage",
  BETTER_AUTH_URL: baseURL,
  // Una clave de sesiones nueva en cada ejecución: en el código no se escribe ninguna.
  BETTER_AUTH_SECRET: randomBytes(32).toString("base64"),
  // La app se apunta a la IA simulada: no hay ningún modo de prueba dentro de ella.
  OPENROUTER_API_KEY: "simulada",
  OPENROUTER_BASE_URL: `http://127.0.0.1:${FAKE_AI_PORT}`,
};

export default defineConfig({
  testDir: "e2e",
  // Un solo recorrido, en orden: es lo que haría una persona.
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL, locale: "es-ES", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm exec tsx e2e/fake-openrouter.ts",
      url: `http://127.0.0.1:${FAKE_AI_PORT}`,
      env: { FAKE_OPENROUTER_PORT: String(FAKE_AI_PORT) },
      reuseExistingServer: false,
    },
    {
      command: `node e2e/prepare-server.mjs && pnpm exec next build && pnpm exec next start --port ${APP_PORT}`,
      url: `${baseURL}/entrar`,
      env: appEnv,
      reuseExistingServer: false,
      timeout: 240_000,
    },
  ],
});
