# 0008 · Cada estudio guarda una foto de su cálculo

- **Estado:** aceptada
- **Fecha:** 2026-10-09

## Contexto y problema

Un estudio se envía a un cliente y puede volver a abrirse semanas después. Entretanto cambian las tarifas
del catálogo y los impuestos: en 2026 el IVA de la luz ha cambiado varias veces. Si el estudio se recalculara
al abrirlo, sus cifras dejarían de coincidir con el PDF que tiene el cliente.

## Opciones consideradas

- Guardar solo los datos de la factura y la tarifa elegida, y recalcular cada vez.
- Guardar dentro del estudio el resultado completo del cálculo, con los precios y los impuestos de ese
  momento.

## Decisión

La segunda. Al calcular, el estudio guarda lo que el cliente paga hoy y lo que pagaría con cada tarifa, línea
a línea y con su operación escrita, además de los datos, las tarifas y los ajustes con los que se hizo. La
pantalla y el PDF pintan esa foto. Solo cambia cuando el asesor pulsa «Recalcular».

## Consecuencias

Un estudio dice siempre lo mismo que el PDF que se envió, y borrar o cambiar una tarifa no rompe los estudios
antiguos. A cambio, cada estudio ocupa más, y para aplicar unos impuestos nuevos a un estudio ya hecho hay
que recalcularlo a propósito.
