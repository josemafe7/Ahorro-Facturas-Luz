/**
 * Carga los datos de ejemplo: `pnpm seed`. Se puede ejecutar las veces que haga falta.
 * Nunca donde haya datos reales (docs/security.md).
 */
import { db } from "@/lib/db";

import { seedDemo } from "./seed/index";
import { DEMO_ADVISOR } from "./seed/users";

seedDemo()
  .then(() => {
    console.log(`Datos de ejemplo cargados. Entra con ${DEMO_ADVISOR.email} y la contraseña ${DEMO_ADVISOR.password}`);
  })
  .catch((error: unknown) => {
    console.error("No se han podido cargar los datos de ejemplo:", error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
