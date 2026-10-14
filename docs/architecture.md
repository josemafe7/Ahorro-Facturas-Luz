# Arquitectura

Cómo está hecha la app y por qué. Para quien llega nuevo, persona o agente, y para quien la va a adaptar a
otro negocio.

## Visión general

Es una sola aplicación Next.js: las pantallas y el servidor van juntos. Los datos se guardan en un archivo de
SQLite y los archivos subidos en una carpeta privada, las dos cosas dentro de la propia carpeta del proyecto.
Lo único que sale fuera es la lectura de documentos, que se pide a un modelo de IA a través de OpenRouter.

La idea central es la separación en dos mitades:

- **El motor** (`src/engine/`) sabe hacer el recorrido: subir un documento, leerlo con IA, dejar que se
  revise, compararlo con un catálogo de ofertas y montar la propuesta. No sabe nada de ningún negocio.
- **El sector** (`src/sectors/electricity/`) sabe todo lo de la luz y nada más: qué se lee de una factura,
  qué se comprueba, la fórmula, los impuestos y sus textos.

El motor define un contrato, `Sector`, y el sector lo cumple. Las pantallas y el acceso a datos usan «el
sector activo» sin nombrarlo, así que llevar la app a gas, telefonía o seguros es escribir otro módulo de
sector.

## Piezas

| Pieza | Qué hace | Con qué está hecha |
|---|---|---|
| Pantallas (`src/app/`) | Lo que ve el asesor: entrar, estudios, catálogo y ajustes. Tienen poca lógica | Next.js, React, Tailwind CSS y shadcn/ui |
| Marca y textos (`src/config/app.ts`) | El nombre, el logo, los colores y todas las frases que nombran el documento, el proveedor, la oferta y el estudio | Un archivo de configuración |
| Motor (`src/engine/`) | Comparar un documento con un catálogo, proyectar el ahorro, leer con IA y montar el estudio | TypeScript, AI SDK y Zod |
| Sector de la luz (`src/sectors/electricity/`) | La fórmula 2.0TD, las comprobaciones, lo que se le pide a la IA y sus campos de formulario | TypeScript y Zod |
| Acceso a datos (`src/data/`) | El único sitio que lee y escribe en la base de datos. Cada función recibe el usuario y filtra por él | Prisma |
| Base de datos (`data/`) | Usuarios, estudios, catálogo, ajustes, marca y archivos. Lo propio del sector va como JSON | SQLite |
| Carpeta privada (`storage/`) | Las facturas y los logos subidos, con nombre aleatorio | El disco del servidor |
| Inicio de sesión (`src/lib/auth.ts`) | Entrar y salir con correo y contraseña, sesiones y límite de intentos. El resto de rutas de cuentas de la librería está cerrado | Better Auth |
| Lectura con IA (`src/lib/ai.ts`) | Pide al modelo que lea un documento y devuelva datos con un formato fijo, con la clave y el modelo de cada asesor | AI SDK con OpenRouter; por defecto, Claude Haiku 5.5 |
| Ajustes de IA (`src/data/ai-settings.ts`) | La clave de OpenRouter de cada asesor, cifrada (`src/lib/secrets.ts`), y el modelo que ha elegido de la lista de OpenRouter (`src/lib/openrouter.ts`) | Node.js (cifrado) y la API de modelos de OpenRouter |
| PDF (`src/lib/pdf/`) | Pinta el estudio para el cliente | @react-pdf/renderer |
| Aritmética del dinero (`src/lib/decimal.ts`) | Cuentas exactas en céntimos, redondeando solo donde dice la especificación | TypeScript, sin librerías |

## Cómo viajan los datos

El recorrido de un estudio, de principio a fin:

1. **Subir.** El asesor elige la factura. Una Server Action comprueba la sesión, el tipo real del archivo y
   su tamaño, lo guarda en la carpeta privada con un nombre aleatorio y crea el estudio en borrador.
2. **Leer.** El servidor comprueba que al asesor le quedan lecturas en esta hora y envía la factura al
   modelo con las instrucciones y el formato que define el sector. La IA no tiene herramientas: solo devuelve
   datos. La respuesta se valida contra ese formato; si no lo cumple, se descarta. El formato es plano y
   pequeño: cada dato es un valor sencillo (vacío, o -1 si es un número, cuando no aparece) y las dudas van
   en una lista aparte. Así lo aceptan todos los modelos de la lista: Claude rechaza más de 16 campos que
   admitan «nulo» o alternativas y los formatos demasiado grandes, y lo descubrió la primera lectura real.
   `src/sectors/electricity/ai-format.test.ts` vigila las dos cosas.
3. **Interpretar.** El sector convierte la respuesta en un borrador de factura y le añade las dudas: las de
   la IA, los datos que no encontró y las que detecta la app por su cuenta, como un CUPS que no cuadra.
4. **Revisar.** El asesor ve los datos junto a la factura y los corrige. Al pulsar «Calcular», el servidor
   valida los datos con el esquema del sector: sin los necesarios no hay cálculo.
5. **Calcular.** El motor pide al sector lo que el cliente paga hoy y lo que pagaría con cada tarifa activa,
   con los impuestos de los ajustes. Cada línea lleva su operación escrita. El resultado se guarda entero
   dentro del estudio, como una foto: no cambia aunque después cambien el catálogo o los ajustes.
6. **Proponer.** El asesor ve las tarifas ordenadas por ahorro, elige una y descarga el PDF, que se monta
   con los importes de esa foto y la marca del asesor.

La IA solo interviene en el paso 2. Ningún importe sale de ella.

## Cómo se añade otro sector

1. Se crea `src/sectors/<sector>/` con lo mismo que tiene el de la luz: los esquemas del documento, de la
   oferta y de los ajustes; lo que se le pide a la IA; las comprobaciones; la fórmula, que devuelve líneas
   con su operación; cómo se leen sus formularios; y sus campos de pantalla.
2. Se exporta desde `src/sectors/index.ts`, `forms.ts` y `ui.ts`.
3. Se pone su identificador y sus textos en `src/config/app.ts`.

El motor, el acceso a datos, las pantallas y el PDF no se tocan. La prueba `src/engine/compare.test.ts`
comprueba que el motor funciona con un sector inventado y que no importa ninguno.

## Servicios externos

- **OpenRouter**, para leer facturas y tarifarios con el modelo que elija cada asesor (por defecto, Claude
  Haiku 5.5). Es el único servicio de fuera y el único que cuesta dinero. Recibe el documento entero, con
  los datos personales que traiga. La app le pide también la lista de modelos con sus precios, que guarda
  una hora, y le pregunta si una clave vale antes de guardarla. Si no hay clave o falla, la app sigue
  funcionando y los datos se rellenan a mano.

No hay más: ni base de datos externa, ni correo, ni pagos, ni analítica.
