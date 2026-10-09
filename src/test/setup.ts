import { copyFileSync, mkdtempSync } from "node:fs";
import path from "node:path";

import { TEMPLATE_DATABASE, TEST_DATA_DIR } from "./paths";

// Se ejecuta antes de cada archivo de pruebas y antes de que se importe la app: le da su propia base de
// datos y su propia carpeta de archivos, y unas claves que solo valen aquí.
const runDir = mkdtempSync(path.join(TEST_DATA_DIR, "run-"));
copyFileSync(TEMPLATE_DATABASE, path.join(runDir, "test.db"));

process.env.DATABASE_URL = `file:${path.join(runDir, "test.db")}`;
process.env.STORAGE_DIR = path.join(runDir, "storage");
process.env.BETTER_AUTH_SECRET = "clave-solo-para-las-pruebas-no-vale-fuera-de-aqui";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
// Las pruebas no llaman nunca a la IA de verdad: la simulan.
delete process.env.OPENROUTER_API_KEY;
