import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { db } from "@/lib/db";

/** Regla E3: como mucho 5 intentos de inicio de sesión por minuto. */
export const SIGN_IN_RATE_LIMIT = { window: 60, max: 5 } as const;

/** Regla E5: lo único que la app usa de las rutas de cuentas que trae Better Auth. */
const OPEN_AUTH_PATHS = new Set(["/sign-in/email", "/sign-out"]);
const AUTH_BASE_PATH = "/api/auth";

/**
 * En local, Next.js abre la app en el primer puerto libre: se admite cualquiera de este ordenador.
 * Publicada, la única dirección válida es la de `BETTER_AUTH_URL`.
 */
const LOCAL_BASE_URL = {
  allowedHosts: ["localhost:*", "127.0.0.1:*"],
  fallback: "http://localhost:3000",
};

/** El inicio de sesión (ver docs/decisions/0004). La clave de las sesiones es `BETTER_AUTH_SECRET`. */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? LOCAL_BASE_URL,
  database: prismaAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    // Regla E4: nadie puede crearse una cuenta desde la app.
    disableSignUp: true,
  },
  rateLimit: {
    // Better Auth solo lo activa por defecto en producción: aquí cuenta siempre.
    enabled: true,
    customRules: {
      "/sign-in/email": SIGN_IN_RATE_LIMIT,
    },
  },
  advanced: {
    // De qué conexión viene una petición lo dice una cabecera que escribe quien la envía: sin un proxy de
    // confianza delante no vale para nada, y cambiándola se saltaría el límite de intentos. No se lee
    // ninguna, y el límite es un único contador para toda la app. Al publicar detrás de un proxy, ver
    // «Si se publica en un VPS» en docs/security.md.
    ipAddress: { ipAddressHeaders: [] },
  },
});

/**
 * La puerta de las rutas de cuentas (regla E5). Better Auth trae muchas más de las que la app usa: cambiar
 * la contraseña, el correo o el nombre, listar sesiones… Aquí solo pasan entrar y salir; el resto responde
 * como si no existiera, también con la sesión iniciada.
 */
export function handleAuthRequest(request: Request): Promise<Response> {
  const { pathname } = new URL(request.url);
  const path = pathname.startsWith(AUTH_BASE_PATH) ? pathname.slice(AUTH_BASE_PATH.length) : pathname;
  if (!OPEN_AUTH_PATHS.has(path)) return Promise.resolve(new Response(null, { status: 404 }));
  return auth.handler(request);
}
