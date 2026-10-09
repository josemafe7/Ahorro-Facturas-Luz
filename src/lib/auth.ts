import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { db } from "@/lib/db";

/** Regla E3: como mucho 5 intentos de inicio de sesión por minuto desde una misma conexión. */
export const SIGN_IN_RATE_LIMIT = { window: 60, max: 5 } as const;

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
});
