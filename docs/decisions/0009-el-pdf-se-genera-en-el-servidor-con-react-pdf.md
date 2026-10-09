# 0009 · El PDF del estudio se genera en el servidor con @react-pdf/renderer

- **Estado:** aceptada
- **Fecha:** 2026-10-09

## Contexto y problema

El estudio se entrega al cliente en PDF, con la marca del asesor. Había que elegir cómo generarlo, sabiendo
que la app funciona en local y que más adelante se publicará en un servidor propio.

## Opciones consideradas

- Imprimir una página web con un navegador sin pantalla: el resultado es idéntico a la pantalla, pero hay
  que instalar y mantener un navegador en el servidor.
- @react-pdf/renderer: una librería que describe el documento con las mismas piezas que una pantalla de
  React y genera el PDF sin navegador.
- Una librería de más bajo nivel, colocando cada texto a mano.

## Decisión

@react-pdf/renderer, en el servidor. No necesita navegador, funciona igual en local que en un servidor y el
documento se escribe como una pantalla más.

## Consecuencias

El PDF sale en menos de un segundo y no añade nada que instalar al publicar. A cambio:

- Solo admite logos en PNG o JPG, y por eso la app no acepta otros formatos.
- Usa la tipografía Helvetica, que traen todos los lectores, en vez de la de la app.
- La librería solo se puede cargar como módulo moderno: por eso el generador de las facturas de ejemplo es
  un archivo `.mts`.
