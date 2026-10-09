# 0004 · El inicio de sesión se hace con Better Auth

- **Estado:** aceptada
- **Fecha:** 2026-10-09

## Contexto y problema

Al guardar los datos en SQLite (decisión 0003) ya no hay un servicio que traiga hechos los usuarios. Hacía
falta una forma de iniciar sesión con correo y contraseña que guarde las contraseñas cifradas, mantenga la
sesión de forma segura y limite los intentos.

## Opciones consideradas

- Escribirlo a mano: sin dependencias, pero es justo el tipo de código donde un descuido se convierte en un
  agujero de seguridad.
- Better Auth: una librería gratuita y de código abierto que resuelve el inicio de sesión y guarda sus datos
  en nuestra misma base de datos, a través de Prisma. Desde julio de 2026 pertenece a Vercel, que la mantiene
  con la misma licencia.
- Auth.js: la alternativa clásica. Desde septiembre de 2025 la mantiene el equipo de Better Auth, que
  recomienda Better Auth para los proyectos nuevos.

## Decisión

Better Auth, con correo y contraseña, el registro público desactivado, las sesiones guardadas en la base de
datos y el límite de intentos activado.

## Consecuencias

El código delicado lo mantiene un proyecto con muchos ojos encima, y el día que haga falta registro,
recuperación de contraseña o varios asesores en una misma cuenta, la librería ya lo contempla.

A cambio, la base de datos lleva las tablas que Better Auth necesita, es una dependencia que hay que
mantener al día por seguridad, y las cuentas las crea quien instala la app, porque no hay registro.
