# Pruebas

Qué se prueba y cómo, para demostrar que el código funciona sin que las pruebas frenen el proyecto.

## Qué se prueba

- Cada fase añade pruebas de lo que construye. Las reglas de «Qué hace» y los permisos de «Quién puede hacer
  qué» de `docs/spec.md` son la lista de lo que hay que probar, y no se prueba nada más: ni utilidades
  sueltas, ni componentes, ni configuración, ni documentación.
- Una prueba por regla, siempre que se pueda: la más sencilla y rápida que la demuestre, sin variantes del
  mismo caso. Si la regla dice que algo se rechaza, la prueba es ese rechazo, con un dato incorrecto y no
  con todos los posibles. Si un caso raro importa, es una regla más de la especificación, con su prueba.
  Solo llevan más de una prueba, y las justas:
  - los permisos: cada fila de «Quién puede hacer qué», con quien puede y con quien no, y cada dato
    protegido, con la prueba de que otro usuario no puede verlo ni cambiarlo;
  - los cálculos de dinero y de fechas: los casos límite que cambian el resultado (redondeos, cero, cambio
    de mes o de hora).
- Casi todo se prueba sin navegador, con Vitest, que tarda segundos: la lógica (cálculos, reglas del
  negocio, validaciones) y los permisos, llamando al acceso a datos o a la base de datos con usuarios
  distintos.
- Con Playwright, que es lento, solo se recorren pantallas: el «se comprueba» de cada fase, haciendo lo
  mismo que haría la persona, y poco más. Una regla que se puede demostrar sin navegador no lleva prueba de
  Playwright.
- Las pruebas de Vitest se escriben antes que el código que las cumple, leyendo la especificación y no el
  código: primero fallan y después se construye hasta que pasan. La de Playwright se escribe cuando la
  pantalla ya existe, siguiendo también la especificación. Es la forma de trabajar, no algo que haya que
  enseñarme ni preguntarme.
- Cuando se corrige un fallo de funcionamiento, primero se escribe una prueba que lo reproduce. Los textos,
  los colores y los detalles visuales no se prueban.

## Cómo

- Vitest, con la prueba junto al código que prueba (`invoice.test.ts`). No admite componentes de servidor
  asíncronos: esos se prueban con Playwright. Excluye `e2e/` en su configuración, porque por defecto
  recogería también los `.spec.ts` de Playwright.
- Playwright, en `e2e/` y con Chromium (`pnpm exec playwright install chromium` la primera vez). Arranca la
  app él solo (`webServer`) y, como recomienda Next.js, prueba la versión compilada (`pnpm build` y
  `pnpm start`): por eso al cerrar la fase no hace falta compilar aparte.
- Mientras se construye se pasa `pnpm check` y solo las pruebas de lo que se está tocando, con la salida
  corta: los fallos y el resumen. `pnpm test:e2e` entero se pasa una vez, al cerrar la fase.
- Las pruebas no dependen unas de otras ni del orden en que se ejecutan.
- Datos inventados y usuarios de prueba: los del seed (ver `docs/conventions.md`). Las pruebas usan su propio
  archivo de base de datos y su propia carpeta de archivos, que se crean desde las migraciones y el seed
  antes de ejecutarlas y se pueden borrar sin perder nada. Nunca usan el archivo de desarrollo ni uno con
  datos reales.
- Los servicios de pago (IA, emails, pagos) se simulan: las pruebas no los llaman de verdad.
- Cuando el proyecto esté en GitHub, se propone ejecutar las pruebas automáticamente en cada subida.
