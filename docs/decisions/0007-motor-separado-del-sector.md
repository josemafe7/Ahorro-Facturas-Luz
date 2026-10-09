# 0007 · El motor está separado de lo propio de cada sector

- **Estado:** aceptada
- **Fecha:** 2026-10-09

## Contexto y problema

La app nace para la luz, pero es una muestra que otras personas van a adaptar a gas, telefonía o seguros.
Si lo propio de la luz queda repartido por las pantallas, el acceso a datos y el PDF, adaptarla es reescribir
la app entera.

## Opciones consideradas

- Escribirlo todo pensando en la luz y dejar que cada adaptación busque y cambie lo que haga falta.
- Separar un motor, que hace el recorrido de documento a propuesta, de un módulo de sector, que aporta lo
  que cambia de un negocio a otro, unidos por un contrato escrito.

## Decisión

La segunda. El motor (`src/engine/`) define el contrato `Sector` y no importa ningún sector. Todo lo de la
luz vive en `src/sectors/electricity/`. La base de datos guarda lo propio del sector como JSON, validado por
el sector al leer y al escribir, para no tener columnas de un negocio concreto.

## Consecuencias

Añadir un sector es escribir un módulo, sin tocar el resto, y una prueba comprueba que el motor funciona con
un sector inventado. A cambio hay una capa más que entender, y no se puede buscar en la base de datos por un
dato de dentro de una factura sin leer ese JSON. Hoy no hace falta.
