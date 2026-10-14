# Estudio de Ahorro

App para asesores energéticos que convierte una factura de luz en un estudio de ahorro en PDF en medio
minuto; es una muestra de DominIA Academy pensada para adaptarla a otros nichos.

## Cómo arrancarlo

Solo hay que tener instalados [pnpm](https://pnpm.io/installation) (versión 12) y Git. No hace falta crear
ninguna cuenta: los datos se guardan en un archivo dentro de la propia carpeta, y pnpm se descarga él solo
la versión de Node.js que usa el proyecto.

```bash
pnpm install
```

```bash
pnpm bootstrap
```

```bash
pnpm dev
```

1. `pnpm install` descarga lo que necesita la app.
2. `pnpm bootstrap` crea el archivo de claves `.env.local`, la base de datos y los datos de ejemplo. Se
   puede repetir las veces que haga falta.
3. `pnpm dev` arranca la app. Se abre en la dirección que sale en la terminal, normalmente
   `http://localhost:3000`.

Para que la IA lea las facturas hace falta una clave de [OpenRouter](https://openrouter.ai/keys) con algo de
saldo, mejor con un límite de gasto: con el modelo por defecto, leer una factura cuesta menos de un céntimo.
Se pone en la app, en «Ajustes», donde también se elige el modelo en un desplegable que enseña lo que cuesta
cada uno. Se guarda cifrada y no se vuelve a enseñar. También se puede poner para toda la instalación en
`.env.local`, en la línea `OPENROUTER_API_KEY=`, reiniciando después `pnpm dev`. Sin clave la app funciona
igual, pero los datos de cada factura se rellenan a mano.

## Cómo probarla

No está publicada: de momento funciona solo en local. Los datos de ejemplo traen un asesor de prueba:

- Correo: `demo@estudiodeahorro.test`
- Contraseña: `ahorro-demo-2026`

Son credenciales de prueba, a la vista a propósito. No existen fuera de los datos de ejemplo.

El recorrido de la demo, con los archivos de la carpeta `ejemplos/`:

1. Entra y pulsa «Nuevo estudio».
2. Sube `factura-1-hogar.pdf`. La IA lee los datos y los enseña junto a la factura.
3. Revisa los datos y pulsa «Calcular»: la app compara con el catálogo y propone la tarifa que más ahorra.
4. Pulsa «Descargar PDF»: es el estudio para el cliente, con la marca del asesor.
5. Vuelve a «Estudios» y cambia el estado del estudio.

Para enseñar más cosas:

- `factura-3-foto.jpg` es una foto: la IA marca un dato como dudoso.
- `factura-2-con-mantenimiento.pdf` lleva un servicio añadido: la app avisa de que el total no cuadra.
- `tarifario-cierzo-electrica.pdf` se sube en «Catálogo», con «Subir tarifario»: la IA propone dos tarifas
  y descarta las otras dos, que no son de precio fijo 2.0TD.
- En «Ajustes» se cambian los impuestos y la marca que sale en el PDF.

Todo lo que sale en los datos de ejemplo es inventado: las personas, las direcciones, los CUPS y las
comercializadoras. Cualquier parecido con algo real es casualidad.

## Cómo adaptarla a otro negocio

- El nombre, el logo, los colores y cómo se llaman las cosas del sector (la factura, la comercializadora,
  la tarifa y el estudio): `src/config/app.ts`. Es el único sitio: una prueba comprueba que ninguna pantalla,
  ni el PDF, los escribe por su cuenta.
- El modelo de IA por defecto y sus límites: `src/config/ai.ts`. Cada asesor puede elegir otro en Ajustes.
- Lo que la app sabe de la luz (qué se lee de una factura, cómo se comprueba y cómo se calcula):
  `src/sectors/electricity/`. Para otro sector se escribe otro módulo al lado; el resto no se toca. Está
  explicado en `docs/architecture.md`.
- Las facturas, el tarifario y los estudios de ejemplo: `scripts/sample-invoices.ts`,
  `scripts/sample-tariff-sheet.ts` y `prisma/seed/`. Se generan con `pnpm samples`.

## Comandos

- `pnpm dev`: arranca la app en local.
- `pnpm bootstrap`: deja la app lista en un ordenador nuevo.
- `pnpm seed`: carga los datos de ejemplo. Nunca donde haya datos reales.
- `pnpm check`: revisa el código, los tipos y pasa las pruebas, en segundos.
- `pnpm test:e2e`: compila la app y la recorre con un navegador, con la IA simulada.
- `pnpm ai:check`: lee las facturas de ejemplo con la IA de verdad y compara. Cuesta céntimos.
- `pnpm samples`: vuelve a generar las facturas y el tarifario de ejemplo.
- `pnpm db:migrate`: crea una migración después de cambiar `prisma/schema.prisma`.

## Cómo se trabaja en este proyecto

Se construye por fases con un agente de código. Lo que el agente cumple sin que se lo pidan está en
`AGENTS.md` y en `docs/`. Esto es lo que se le pide en cada momento:

| Cuándo | Qué se le pide |
|---|---|
| Para decidir el aspecto, antes de la primera fase con pantallas | «Vamos con el diseño. Sigue docs/design.md.» |
| Al volver con el diseño hecho fuera | «Ya he dejado el diseño en docs/design/. Léelo y dime qué has entendido.» |
| Al empezar cada fase, en una conversación nueva | «Vamos con la fase 1 de docs/spec.md. Propón un plan.» |
| Si la conversación se llena a mitad de una fase | En una conversación nueva: «Sigue con la fase 2 de docs/spec.md.» |
| Si algo no funciona | Lo que se ve y lo que se esperaba: «Al pulsar Guardar no pasa nada; esperaba ver el contacto en la lista.» |
| Al acabar una fase | «Cierra la fase 1.» |
| Para un retoque: un texto, un color, un botón que se mueve | Se pide tal cual, sin más: «Cambia el título de la portada por…» |
| Para añadir o cambiar algo | «Quiero que la app también…» o «Quiero que esto funcione de otra forma»: primero cambia la especificación y después se construye |
| Para que el agente cumpla algo siempre | «Añade a las reglas de AGENTS.md: …» |
| Para que otro revise una fase, en una conversación nueva | «Revisa la fase 1 siguiendo docs/review.md. No cambies nada.» |
| Antes de publicar, en una conversación nueva | «Revisa el proyecto contra docs/security.md.» |
| Para publicar la app o una versión nueva | «Quiero publicar la app.» |
| Cada mes o dos, con la app publicada | «Haz el mantenimiento.» |

## Documentación

Todo lo demás está en `docs/`.
