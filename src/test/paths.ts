import path from "node:path";

/** Donde viven la base de datos y los archivos de las pruebas. Se borra entero al acabar. */
export const TEST_DATA_DIR = path.resolve("data/test");

/** Una base de datos vacía con todas las migraciones aplicadas, de la que parte cada archivo de pruebas. */
export const TEMPLATE_DATABASE = path.join(TEST_DATA_DIR, "template.db");
