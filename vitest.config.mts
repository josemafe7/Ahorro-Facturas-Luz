import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // `server-only` impide importar código de servidor desde el navegador; fuera de Next.js se sustituye
      // por un módulo vacío para poder probar ese código.
      "server-only": path.resolve(import.meta.dirname, "src/test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts", "scripts/**/*.test.ts"],
    // Sin esto recogería también las pruebas de Playwright.
    exclude: ["e2e/**", "node_modules/**"],
    globalSetup: ["src/test/global-setup.ts"],
    setupFiles: ["src/test/setup.ts"],
    // Cada archivo de pruebas va en su propio proceso, con su propia base de datos: no dependen unos de otros.
    pool: "forks",
  },
});
