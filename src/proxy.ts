import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

import { isPublicPath, LOGIN_PATH } from "@/lib/routes";

/**
 * Regla E1: sin sesión, cualquier dirección acaba en la pantalla de entrada.
 *
 * Aquí solo se mira si existe la cookie, que es rápido. No es la comprobación de seguridad: esa la hace
 * cada página, Server Action y Route Handler con `requireUser()`, que valida la sesión de verdad.
 */
export function proxy(request: NextRequest) {
  if (isPublicPath(request.nextUrl.pathname)) return NextResponse.next();
  if (getSessionCookie(request)) return NextResponse.next();
  return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
}

export const config = {
  // Todo menos los archivos estáticos de Next.js y las imágenes de `public/`.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
