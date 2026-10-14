# 0010 · La clave de OpenRouter se pone en la app y se guarda cifrada

- **Estado:** aceptada
- **Fecha:** 2026-10-14

## Contexto y problema

Hasta ahora la clave de OpenRouter solo se podía poner en `.env.local`, a mano, y el modelo estaba fijo en
el código. Josema pidió poder poner la clave desde la app y elegir el modelo en un desplegable con buscador
que enseñe sus precios: la app se vende a asesores que no van a abrir archivos de configuración.

Chocaba con una regla de seguridad de `AGENTS.md`: las claves se guardan solo en `.env.local` o en las
variables del servidor. Una clave escrita en la app tiene que guardarse en la base de datos.

## Opciones consideradas

- Seguir con la clave en `.env.local` y elegir solo el modelo desde la app: no cambia ninguna regla, pero
  el asesor sigue necesitando a alguien que toque los archivos.
- Guardar la clave en la base de datos tal cual: lo más sencillo, pero cualquier copia de la base de datos
  la enseñaría.
- Guardarla cifrada en la base de datos, con una llave que sale de `.env.local`.
- Que la app escriba la clave en `.env.local`: no vale en producción, donde las claves están en las
  variables del servidor, y obliga a reiniciar.

## Decisión

La clave se escribe en Ajustes y se guarda cifrada en la base de datos (AES-256-GCM), con una llave que sale
de `BETTER_AUTH_SECRET` (HKDF). Antes de guardarla se comprueba con OpenRouter; después nunca vuelve al
navegador ni a los registros: solo se enseñan sus cuatro últimos caracteres. La regla de `AGENTS.md` se
cambió por su equivalente, con esta excepción escrita.

Cada asesor tiene su clave y su modelo. Si no pone clave, se usa la de `.env.local`, si la hay. El modelo se
elige entre los que OpenRouter dice que leen PDF y fotos y devuelven un formato fijo; por defecto, Claude
Haiku 5.5 (decisión 0006).

## Consecuencias

El asesor configura la IA sin tocar archivos, ve lo que cuesta cada modelo antes de elegirlo, y quien copie
la base de datos sin `.env.local` no puede leer las claves.

A cambio:

- `BETTER_AUTH_SECRET` protege también las claves guardadas: si se filtra, quien tenga además una copia de
  la base de datos podría descifrarlas; si se cambia, hay que volver a escribirlas en la app.
- Quien entre en la app como un asesor puede gastar el saldo de su clave y cambiar el modelo por uno caro.
  Lo frenan el tope de lecturas por hora y el límite de gasto que se pone a la clave en OpenRouter.
- La app depende de la lista de modelos de OpenRouter para cambiar de modelo: si no responde, se sigue
  usando el elegido.
