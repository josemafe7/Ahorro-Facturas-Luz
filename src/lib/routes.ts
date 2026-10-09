/** Las direcciones de la app, con nombre, para no repetirlas escritas a mano. */

export const LOGIN_PATH = "/entrar";
export const HOME_PATH = "/estudios";

export const routes = {
  login: LOGIN_PATH,
  studies: HOME_PATH,
  newStudy: "/estudios/nuevo",
  study: (id: string) => `/estudios/${id}`,
  studyComparison: (id: string) => `/estudios/${id}/comparativa`,
  studyPdf: (id: string) => `/estudios/${id}/pdf`,
  catalog: "/catalogo",
  newOffer: "/catalogo/nueva",
  offer: (id: string) => `/catalogo/${id}`,
  importOffers: "/catalogo/importar",
  settings: "/ajustes",
  file: (id: string) => `/archivos/${id}`,
} as const;

/** Lo único que se puede abrir sin sesión: la pantalla de entrada y las rutas del propio inicio de sesión. */
export const PUBLIC_PATH_PREFIXES = [LOGIN_PATH, "/api/auth"] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
