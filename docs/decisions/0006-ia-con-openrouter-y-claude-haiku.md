# 0006 · La IA se usa a través de OpenRouter, con Claude Haiku 5.5

- **Estado:** aceptada
- **Fecha:** 2026-10-09

## Contexto y problema

La app necesita un modelo de IA que lea facturas y tarifarios en PDF o en foto y devuelva los datos
ordenados. Es lo único de la app que cuesta dinero por uso, y quien la adapte puede preferir otro modelo.

## Opciones consideradas

- Clave directa de Anthropic con Claude Opus 5.5: el más capaz, aproximadamente 5-10 céntimos por factura.
- Clave directa de Anthropic con Claude Sonnet 5.5: punto medio, aproximadamente 3-5 céntimos.
- Clave directa de Anthropic con Claude Haiku 5.5: el más rápido y barato, menos de 1 céntimo.
- OpenRouter: un intermediario que da acceso a los modelos de muchos proveedores con una sola clave y un
  solo saldo.

## Decisión

OpenRouter con Claude Haiku 5.5, conectado con el AI SDK. El nombre del modelo queda en un solo sitio del
código.

## Consecuencias

Con una sola clave se puede cambiar a cualquier modelo tocando una línea, y leer una factura cuesta menos de
un céntimo.

A cambio:

- OpenRouter cobra un 5,5 % al recargar saldo (mínimo 0,80 $); el uso no lleva recargo.
- Cada factura pasa por un intermediario más antes de llegar al proveedor del modelo. OpenRouter no guarda
  los textos salvo que se active en su panel, y no se activa.
- Haiku puede dejar más datos dudosos en fotos difíciles que un modelo mayor: por eso el asesor revisa
  siempre lo leído antes de calcular.
- Las pruebas no llaman a la IA de verdad: se simula, como dice `docs/testing.md`.
