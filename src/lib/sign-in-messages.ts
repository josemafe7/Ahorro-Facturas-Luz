const TOO_MANY_REQUESTS = 429;

export const SIGN_IN_MESSAGES = {
  /** Regla E2: el mismo mensaje falle el correo o la contraseña, para no revelar qué cuentas existen. */
  invalid: "Correo o contraseña incorrectos",
  /** Regla E3. */
  tooMany: "Demasiados intentos. Espera un minuto y vuelve a probar.",
} as const;

/** El mensaje que ve la persona cuando no consigue entrar, según el código que devuelve el servidor. */
export function signInErrorMessage(status: number | undefined): string {
  return status === TOO_MANY_REQUESTS ? SIGN_IN_MESSAGES.tooMany : SIGN_IN_MESSAGES.invalid;
}
