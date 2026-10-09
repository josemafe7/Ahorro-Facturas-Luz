import { beforeAll, describe, expect, it } from "vitest";

import { createUser } from "../../prisma/seed/users";
import { auth, SIGN_IN_RATE_LIMIT } from "./auth";
import { db } from "./db";
import { SIGN_IN_MESSAGES, signInErrorMessage } from "./sign-in-messages";

const advisor = { name: "Asesora de pruebas", email: "asesora@pruebas.test", password: "una-contrasena-larga" };

/** Una petición al inicio de sesión como la que hace el navegador, desde la conexión `ip`. */
function post(path: string, body: unknown, { ip, cookie }: { ip: string; cookie?: string }) {
  const headers = new Headers({
    "content-type": "application/json",
    origin: "http://localhost:3000",
    "x-forwarded-for": ip,
  });
  if (cookie) headers.set("cookie", cookie);
  return auth.handler(
    new Request(`http://localhost:3000/api/auth${path}`, { method: "POST", headers, body: JSON.stringify(body) }),
  );
}

/** La cookie de sesión que devuelve el servidor, lista para enviarla en la siguiente petición. */
function sessionCookie(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

beforeAll(async () => {
  await createUser(advisor);
});

describe("Entrar", () => {
  it("E2 · entra con sus datos, no entra con datos incorrectos y deja de tener sesión al salir", async () => {
    const ip = "198.51.100.2";

    const signedIn = await post("/sign-in/email", { email: advisor.email, password: advisor.password }, { ip });
    expect(signedIn.status).toBe(200);
    const cookie = sessionCookie(signedIn);
    const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
    expect(session?.user.email).toBe(advisor.email);

    // El mismo resultado y el mismo mensaje falle la contraseña o el correo: no se revela cuál.
    const wrongPassword = await post("/sign-in/email", { email: advisor.email, password: "no-es-esta" }, { ip });
    const unknownEmail = await post("/sign-in/email", { email: "nadie@pruebas.test", password: advisor.password }, { ip });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(wrongPassword.status);
    expect(signInErrorMessage(wrongPassword.status)).toBe(SIGN_IN_MESSAGES.invalid);
    expect(signInErrorMessage(unknownEmail.status)).toBe(SIGN_IN_MESSAGES.invalid);

    await post("/sign-out", {}, { ip, cookie });
    expect(await auth.api.getSession({ headers: new Headers({ cookie }) })).toBeNull();
  });

  it("E3 · rechaza los intentos de más en un minuto desde una misma conexión", async () => {
    const ip = "198.51.100.3";
    const attempt = (from: string) => post("/sign-in/email", { email: advisor.email, password: "no-es-esta" }, { ip: from });

    for (let i = 0; i < SIGN_IN_RATE_LIMIT.max; i++) {
      expect((await attempt(ip)).status).toBe(401);
    }
    const blocked = await attempt(ip);
    expect(blocked.status).toBe(429);
    expect(signInErrorMessage(blocked.status)).toBe(SIGN_IN_MESSAGES.tooMany);

    // Otra conexión no paga por los intentos de la primera.
    expect((await attempt("198.51.100.4")).status).toBe(401);
  });

  it("E4 · nadie puede crearse una cuenta", async () => {
    const email = "intruso@pruebas.test";

    const response = await post("/sign-up/email", { name: "Intruso", email, password: "otra-contrasena-larga" }, { ip: "198.51.100.5" });

    expect(response.ok).toBe(false);
    expect(await db.user.findUnique({ where: { email } })).toBeNull();
  });
});
