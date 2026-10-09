# 0003 · Los datos se guardan en SQLite con Prisma

- **Estado:** aceptada
- **Fecha:** 2026-10-09

## Contexto y problema

Había que decidir dónde se guardan los estudios, el catálogo y los ajustes. La app es de muestra: quien se
la descargue tiene que poder arrancarla con los datos de ejemplo sin crear cuentas ni configurar servicios.
A la vez guarda datos personales de los clientes del asesor, así que no vale cualquier sitio.

## Opciones consideradas

- Supabase: lo recomendado por la plantilla. Trae resueltos y protegidos la base de datos, los usuarios y
  los archivos, pero cada persona tendría que crear su cuenta y su proyecto antes de arrancar, y hace falta
  internet.
- SQLite + Prisma: los datos en un archivo dentro de la carpeta del proyecto. SQLite es una base de datos
  que no necesita servidor, y Prisma es la librería con la que el código lee y escribe en ella.
- LocalStorage: los datos en el navegador. No vale para datos personales ni para facturas.
- PostgreSQL: habría que instalarlo para arrancar, y los usuarios y los archivos se resolverían aparte.

## Decisión

SQLite + Prisma. Pesa más que la app se descargue y arranque sin cuentas que tener la protección de serie de
Supabase.

## Consecuencias

La app arranca con tres comandos y sin internet, salvo para la IA. La base de datos es un archivo que se
copia y se restaura como cualquier otro.

A cambio:

- SQLite no tiene Row Level Security, la protección que impide en la propia base de datos que un usuario lea
  lo de otro. Su equivalente lo pone el código y lo demuestran las pruebas, como dice «Datos» en
  `docs/security.md`.
- El inicio de sesión y el guardado de archivos se resuelven aparte: decisiones 0004 y 0005.
- Solo se podrá publicar en un servidor propio con disco, no en Vercel, y con un único servidor escribiendo
  en el archivo.
- Las copias de seguridad no las hace nadie por nosotros.
- `AGENTS.md`, `docs/security.md`, `docs/conventions.md` y `docs/testing.md` se han reescrito donde hablaban
  de Supabase.
