# 0002 · De momento, la app solo funciona en local

- **Estado:** aceptada
- **Fecha:** 2026-10-09

## Contexto y problema

Había que decidir dónde se publica la app, porque eso condiciona dónde se pueden guardar los datos. La app
es una muestra: se enseña en directo desde un ordenador y después se entrega para que cada persona la
adapte.

## Opciones consideradas

- Vercel: se publica sola y no hay servidor que mantener, pero su plan gratuito no admite uso comercial y
  obliga a guardar los datos en un servicio externo.
- Un VPS de Hostinger con Dokploy: servidor propio de coste fijo, cuyo mantenimiento y seguridad corren por
  nuestra cuenta.
- No publicarla todavía y usarla solo en local.

## Decisión

De momento solo en local. No hace falta publicarla para enseñarla ni para entregarla, y así no hay nada que
pagar ni que mantener ahora.

## Consecuencias

No existe `docs/deployment.md` ni hay servidor que vigilar. Al elegir después guardar los datos en un
archivo (decisión 0003), el día que se publique tendrá que ser en un servidor propio, no en Vercel. Ese día
se aplican «Si se publica en un VPS» y «Antes de publicar» de `docs/security.md`, y esta decisión se
sustituye por la nueva.
