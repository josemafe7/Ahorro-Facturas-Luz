import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

// Las rutas del inicio de sesión las sirve Better Auth: entrar, salir y consultar la sesión.
export const { GET, POST } = toNextJsHandler(auth);
