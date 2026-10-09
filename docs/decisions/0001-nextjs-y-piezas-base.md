# 0001 · Next.js y las piezas base recomendadas

- **Estado:** aceptada
- **Fecha:** 2026-10-09

## Contexto y problema

Había que elegir el armazón de la app y las piezas que lo acompañan: lenguaje, diseño y pruebas. La app es
una aplicación web con pantallas y servidor, y la van a adaptar otras personas con ayuda de agentes de
código.

## Opciones consideradas

- Next.js con TypeScript, Tailwind CSS + shadcn/ui, Vitest y Playwright: lo que recomienda la plantilla.
- React Router (antes Remix): equivalente, pero obligaba a reescribir la documentación de la plantilla.
- SvelteKit: no usa React, así que las piezas de diseño recomendadas no valían tal cual.

## Decisión

Next.js con TypeScript, Tailwind CSS + shadcn/ui para el diseño, Vitest para la lógica y Playwright para
recorrer la app como un usuario. Es lo recomendado, no hay nada en esta app que pida otra cosa y toda la
documentación del proyecto está escrita para ello.

## Consecuencias

El proyecto sigue la plantilla sin adaptaciones en esta parte, y quien lo adapte encuentra las piezas más
usadas y mejor documentadas. A cambio, queda ligado a la forma de trabajar de Next.js: cambiar de framework
más adelante sería rehacer las pantallas y el servidor.
