import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";
import { LOGIN_PATH } from "@/lib/routes";

/** Lo único del usuario que sale del servidor hacia las pantallas. */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * El usuario de la sesión, comprobado contra la base de datos, o `null` si no hay sesión válida.
 * `cache` evita repetir la consulta dentro de una misma petición.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, email } = session.user;
  return { id, name, email };
});

/**
 * Para páginas, Server Actions y Route Handlers privados: devuelve el usuario o manda a iniciar sesión.
 * El proxy no basta: cada uno lo comprueba por su cuenta (docs/security.md).
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(LOGIN_PATH);
  return user;
}
