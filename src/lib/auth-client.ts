import { createAuthClient } from "better-auth/react";

/** El inicio y el cierre de sesión desde el navegador. Pasan por `/api/auth`, donde cuenta el límite de intentos. */
export const authClient = createAuthClient();
