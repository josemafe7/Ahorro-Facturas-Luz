# Estudio de Ahorro

App para asesores energéticos: lee con IA la factura de luz de un cliente, la compara con el catálogo de
tarifas del asesor y genera el estudio de ahorro en PDF con su marca, en menos de un minuto. Es una muestra de
DominIA Academy pensada para adaptarla a otros nichos y venderla.

## Ponla en marcha

Funciona en tu ordenador, sin publicar nada: los datos se guardan en un archivo dentro de la propia carpeta.
Solo hace falta una cuenta de OpenRouter para que la IA lea las facturas, y se crea en el paso 4.

### 1. Instala pnpm, una sola vez

pnpm es el programa que descarga lo que necesita la app y la arranca. También descarga él solo la versión de
Node.js que usa el proyecto, así que no hace falta instalarla aparte.

En Mac o Linux, en la Terminal:

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

En Windows, en PowerShell:

```powershell
Invoke-WebRequest https://get.pnpm.io/install.ps1 -UseBasicParsing | Invoke-Expression
```

Al terminar, cierra la terminal y abre otra. Si no funciona, las demás formas de instalarlo están en
[pnpm.io/installation](https://pnpm.io/installation).

### 2. Descarga la app

Con Git:

```bash
git clone https://github.com/josemafe7/Ahorro-Facturas-Luz.git
```

```bash
cd Ahorro-Facturas-Luz
```

Sin Git: en la página del repositorio, pulsa el botón verde «Code» y después «Download ZIP». Descomprímelo y
abre una terminal dentro de esa carpeta.

### 3. Prepárala y arráncala

```bash
pnpm install
```

```bash
pnpm bootstrap
```

```bash
pnpm dev
```

1. `pnpm install` descarga lo que necesita la app. La primera vez tarda un par de minutos.
2. `pnpm bootstrap` crea el archivo de claves `.env.local`, la base de datos y los datos de ejemplo. Se puede
   repetir las veces que haga falta.
3. `pnpm dev` arranca la app. Deja la terminal abierta mientras la uses; se para con Ctrl + C.

Abre en el navegador la dirección que sale en la terminal, normalmente `http://localhost:3000`, y entra con
el asesor de prueba:

- Correo: `demo@estudiodeahorro.test`
- Contraseña: `ahorro-demo-2026`

Son credenciales de prueba, a la vista a propósito. Solo existen en los datos de ejemplo.

Las siguientes veces basta con abrir una terminal en la carpeta de la app y escribir `pnpm dev`.

### 4. Conecta la IA, una sola vez

La IA es la que lee las facturas. Funciona con [OpenRouter](https://openrouter.ai), un servicio que da acceso
a muchos modelos de IA con una sola cuenta:

1. Crea una cuenta en OpenRouter, añade algo de saldo y crea una clave en
   [openrouter.ai/keys](https://openrouter.ai/keys), mejor con un límite de gasto. Con el modelo por defecto,
   leer una factura cuesta menos de un céntimo.
2. En la app, entra en «Ajustes», pega la clave en «Inteligencia artificial» y guárdala. Se guarda cifrada y
   no se vuelve a enseñar.
3. En el mismo sitio se elige el modelo, en un desplegable que enseña lo que cuesta cada uno.

Sin clave la app funciona igual, pero los datos de cada factura se escriben a mano. Si prefieres una clave
para toda la instalación, va en `.env.local`, en la línea `OPENROUTER_API_KEY=`, y después hay que volver a
arrancar `pnpm dev`.

## Úsala: tu primer estudio

Los documentos para probarla están en la carpeta `ejemplos/`. Todo lo que sale en ellos y en los datos de
ejemplo es inventado: las personas, las direcciones, los CUPS y las comercializadoras. Cualquier parecido con
algo real es casualidad.

1. Pulsa «Nuevo estudio» y sube `factura-1-hogar.pdf`: arrástrala a la zona de subida o elígela. La IA lee
   los datos en unos segundos y los enseña junto a la factura.
2. Revisa los datos. Lo que la IA no ve claro sale marcado en ámbar: compáralo con la factura y corrígelo si
   hace falta.
3. Pulsa «Calcular». La app calcula lo que el cliente paga hoy y lo que pagaría con cada tarifa del catálogo,
   de más a menos ahorro y con cada operación a la vista. Con esta factura: hoy paga 93,65 €, con la mejor
   tarifa pagaría 69,51 € y se ahorra 293,70 € al año.
4. Pulsa «Descargar PDF»: es el estudio para el cliente, con la marca del asesor.
5. En «Estudios» están todos, con su estado: borrador, enviado, aceptado o contratado.

La IA solo lee la factura: el dinero lo calcula siempre la app.

Para enseñar más cosas:

- `factura-3-foto.jpg` es una foto hecha con el móvil: lo que la IA no lee con seguridad sale en ámbar.
- `factura-2-con-mantenimiento.pdf` lleva un servicio añadido: la app avisa de que el total no cuadra.
- `tarifario-cierzo-electrica.pdf` se sube en «Catálogo», con «Subir tarifario»: la IA propone dos tarifas
  y descarta las otras dos, que no son de precio fijo 2.0TD.
- En «Ajustes», en «Mi marca», se cambian el nombre, el logo y el color que salen en el PDF. Ahí también
  están los impuestos.

## Si algo no va

- La terminal no reconoce `pnpm`: cierra la terminal y abre otra. Si sigue igual, repite el paso 1.
- El puerto 3000 lo usa otro programa: la app arranca en otro (3001, 3002…). Usa la dirección que sale en la
  terminal.
- La IA no lee la factura: mira en «Ajustes» que la clave esté puesta y que la cuenta de OpenRouter tenga
  saldo.

## La presentación de la clase

`clase/estudio-de-ahorro-presentacion.html` es la presentación de la clase en directo de DominIA Academy. Se
abre con doble clic en el navegador: → o la barra espaciadora avanzan, ← retrocede, F pone la pantalla
completa, H oculta la barra de abajo y los números saltan de diapositiva.

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
