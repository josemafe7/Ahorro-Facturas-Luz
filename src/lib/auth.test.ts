import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createUser } from "../../prisma/seed/users";
import { auth, handleAuthRequest, SIGN_IN_RATE_LIMIT } from "./auth";
import { db } from "./db";
import { SIGN_IN_MESSAGES, signInErrorMessage } from "./sign-in-messages";

const advisor = { name: "Asesora de pruebas", email: "asesora@pruebas.test", password: "una-contrasena-larga" };
const ONE_MINUTE_AND_A_BIT = 61_000;

/**
 * Una petición a las rutas de cuentas como la que hace el navegador. `from` es la conexión desde la que dice
 * llegar: una cabecera que escribe quien llama.
 */
function call(method: "GET" | "POST", path: string, body?: unknown, { from, cookie }: { from?: string; cookie?: string } = {}) {
  const headers = new Headers({ "content-type": "application/json", origin: "http://localhost:3000" });
  if (from) headers.set("x-forwarded-for", from);
  if (cookie) headers.set("cookie", cookie);
  return handleAuthRequest(
    new Request(`http://localhost:3000/api/auth${path}`, { method, headers, body: method === "POST" ? JSON.stringify(body ?? {}) : undefined }),
  );
}

const post = (path: string, body: unknown, options?: { from?: string; cookie?: string }) => call("POST", path, body, options);
const signIn = (password: string, from?: string) => post("/sign-in/email", { email: advisor.email, password }, { from });

/** La cookie de sesión que devuelve el servidor, lista para enviarla en la siguiente petición. */
function sessionCookie(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

beforeAll(async () => {
  await createUser(advisor);
  // Solo el reloj: así una prueba puede dejar pasar un minuto sin esperarlo.
  vi.useFakeTimers({ toFake: ["Date"] });
});

// Cada prueba empieza con el contador de intentos a cero, como si hubiera pasado más de un minuto.
beforeEach(() => {
  vi.setSystemTime(Date.now() + ONE_MINUTE_AND_A_BIT);
});

afterAll(() => {
  vi.useRealTimers();
});

describe("Entrar", () => {
  it("E2 · entra con sus datos, no entra con datos incorrectos y deja de tener sesión al salir", async () => {
    const signedIn = await signIn(advisor.password);
    expect(signedIn.status).toBe(200);
    const cookie = sessionCookie(signedIn);
    const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
    expect(session?.user.email).toBe(advisor.email);

    // El mismo resultado y el mismo mensaje falle la contraseña o el correo: no se revela cuál.
    const wrongPassword = await signIn("no-es-esta");
    const unknownEmail = await post("/sign-in/email", { email: "nadie@pruebas.test", password: advisor.password });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(wrongPassword.status);
    expect(signInErrorMessage(wrongPassword.status)).toBe(SIGN_IN_MESSAGES.invalid);
    expect(signInErrorMessage(unknownEmail.status)).toBe(SIGN_IN_MESSAGES.invalid);

    await post("/sign-out", {}, { cookie });
    expect(await auth.api.getSession({ headers: new Headers({ cookie }) })).toBeNull();
  });

  it("E3 · rechaza los intentos de más en un minuto, digan venir de donde digan", async () => {
    for (let i = 0; i < SIGN_IN_RATE_LIMIT.max; i++) {
      expect((await signIn("no-es-esta")).status).toBe(401);
    }
    const blocked = await signIn("no-es-esta");
    expect(blocked.status).toBe(429);
    expect(signInErrorMessage(blocked.status)).toBe(SIGN_IN_MESSAGES.tooMany);

    // Decir que se llama desde otra conexión no abre un contador nuevo: ese dato lo escribe quien llama.
    expect((await signIn("no-es-esta", "203.0.113.7")).status).toBe(429);
    expect((await signIn("no-es-esta", "203.0.113.8")).status).toBe(429);
    // Ni siquiera la contraseña buena entra mientras dura el bloqueo.
    expect((await signIn(advisor.password)).status).toBe(429);

    // Pasado el minuto se puede volver a intentar.
    vi.setSystemTime(Date.now() + ONE_MINUTE_AND_A_BIT);
    expect((await signIn(advisor.password)).status).toBe(200);
  });

  it("E4 · nadie puede crearse una cuenta", async () => {
    const email = "intruso@pruebas.test";

    const response = await post("/sign-up/email", { name: "Intruso", email, password: "otra-contrasena-larga" });

    expect(response.ok).toBe(false);
    expect(await db.user.findUnique({ where: { email } })).toBeNull();
  });

  it("E5 · de las cuentas solo se puede entrar y salir: lo demás no existe, tampoco con la sesión iniciada", async () => {
    const cookie = sessionCookie(await signIn(advisor.password));

    // Con sesión, llamando directamente a la dirección: ni la contraseña ni el nombre cambian.
    const changePassword = await post("/change-password", { currentPassword: advisor.password, newPassword: "otra-contrasena-larga" }, { cookie });
    const updateUser = await post("/update-user", { name: "Otro nombre" }, { cookie });
    expect([changePassword.status, updateUser.status]).toEqual([404, 404]);
    expect((await db.user.findUniqueOrThrow({ where: { email: advisor.email } })).name).toBe(advisor.name);
    expect((await signIn(advisor.password)).status).toBe(200);

    // Y ninguna otra de las rutas que trae la librería, las de hoy y las que añada una versión nueva.
    const open = ["/sign-in/email", "/sign-out"];
    const closed = Object.values(auth.api as unknown as Record<string, { path?: string }>)
      .map((endpoint) => endpoint.path?.replace(/:\w+/g, "x"))
      .filter((path): path is string => typeof path === "string" && !open.includes(path));
    expect(closed.length).toBeGreaterThan(20);
    for (const path of closed) {
      expect([path, (await call("GET", path, undefined, { cookie })).status]).toEqual([path, 404]);
      expect([path, (await call("POST", path, {}, { cookie })).status]).toEqual([path, 404]);
    }
  });
});
