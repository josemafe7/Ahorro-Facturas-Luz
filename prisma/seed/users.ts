import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type SeedUser = { name: string; email: string; password: string };

/**
 * El asesor de prueba. Sus credenciales están a la vista en README.md a propósito: solo existe en
 * desarrollo y en la demo, nunca donde haya datos reales (docs/security.md).
 */
export const DEMO_ADVISOR: SeedUser = {
  name: "Asesora Demo",
  email: "demo@estudiodeahorro.test",
  password: "ahorro-demo-2026",
};

/**
 * Crea un usuario con su contraseña, o devuelve el que ya existe con ese correo. Es la única forma de dar
 * de alta a alguien: la app no tiene registro (regla E4).
 */
export async function createUser({ name, email, password }: SeedUser): Promise<{ id: string }> {
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return existing;

  const context = await auth.$context;
  const user = await context.internalAdapter.createUser(
    { name, email, emailVerified: true },
    { method: "admin" },
  );
  await context.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: await context.password.hash(password),
  });
  return { id: user.id };
}
