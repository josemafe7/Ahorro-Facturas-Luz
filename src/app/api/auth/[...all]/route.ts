import { toNextJsHandler } from "better-auth/next-js";

import { handleAuthRequest } from "@/lib/auth";

// Las rutas de cuentas las sirve Better Auth, pero solo las que la app usa: entrar y salir (regla E5).
export const { GET, POST } = toNextJsHandler(handleAuthRequest);
