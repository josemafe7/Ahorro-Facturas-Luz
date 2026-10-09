# Convenciones de código

Cómo se crea el proyecto y cómo se escribe y se organiza el código para que se pueda mantener.

## Crear el proyecto

`create-next-app` no arranca en una carpeta que ya tiene `README.md`, `AGENTS.md` o `CLAUDE.md`. Por eso:

1. Créalo en una carpeta temporal, fuera del proyecto, con `pnpm create next-app` y las opciones
   `--yes --src-dir --disable-git --skip-install`.
2. Trae aquí sus archivos, también los que empiezan por punto, sin sobrescribir los que ya existen:
   - combina los dos `.gitignore` (la línea `!.env.example` va después de cualquier línea que ignore
     archivos `.env`);
   - añade al final de `AGENTS.md` el bloque de Next.js que trae su `AGENTS.md`;
   - descarta su `CLAUDE.md` y su `README.md`.
3. Crea o completa `pnpm-workspace.yaml` con los ajustes de `docs/security.md` y, después, instala las
   dependencias aquí.
4. Prepara Vitest y Playwright como dice `docs/testing.md`, y los comandos de «Cómo se arranca y se prueba»
   de `AGENTS.md`.
5. Pon en `next.config.ts` la configuración de `docs/security.md`.
6. Prepara Prisma con SQLite consultando su documentación actual: el esquema en `prisma/schema.prisma`, la
   primera migración y el cliente generado. La base de datos es un archivo dentro de `data/`, que no se sube
   a Git, igual que `storage/`: no hace falta crear ninguna cuenta. Las claves de `.env.local` las pongo yo o
   te las paso por el chat.

## Documentación de las librerías

Antes de instalar, actualizar o escribir código con una librería, consulta su documentación actual con
Context7:

- Busca el identificador de la librería con `resolve-library-id` (o `ctx7 library`), salvo que ya lo sepas.
- Pide la documentación con `query-docs` (o `ctx7 docs`): una pregunta concreta y la versión de `package.json`.
- En Next.js manda la documentación del paquete instalado (`node_modules/next/dist/docs/`).
- Si no tienes Context7, dímelo y usa la documentación oficial.

## Principios

- Lo más simple que resuelva lo pedido. Nada de capas, abstracciones ni opciones «por si acaso».
- Antes de crear algo, se busca si ya existe y se reutiliza: una misma lógica no se escribe dos veces.
- Cada cambio toca solo lo necesario y sigue el estilo del código que ya hay, aunque haya otra forma válida.
- El código que deja de usarse se borra, no se comenta.

## Organización

- `src/app/`: rutas, páginas, layouts y Route Handlers. Tienen poca lógica: la piden a otras carpetas.
- `src/components/`: componentes compartidos. Los de shadcn/ui, en `src/components/ui/`.
- Si existe `DESIGN.md`, sus colores, tipografía, bordes y espaciado se ponen una sola vez como tema (las
  variables de shadcn/ui y Tailwind en los estilos globales) y todas las pantallas lo usan. El código que
  exporta una herramienta de diseño es una referencia para ver cómo debe quedar, no código para pegar.
- `src/lib/`: utilidades y clientes de servicios (Prisma, sesión, IA).
- `src/data/`: el acceso a datos, con `import 'server-only'`.
- Lo que solo usa una ruta va junto a ella, en carpetas privadas (`_components/`, `_lib/`).
- El proxy de Next.js también va en `src/`. En la raíz se quedan la configuración, `public/` y `.env.local`.
- Las Server Actions son finas: validan con Zod y llaman a `src/data/`.
- Componentes de servidor por defecto. `'use client'` solo en los que necesitan interacción, y lo más abajo
  posible en el árbol.
- La base de datos cambia solo con migraciones: se cambia `prisma/schema.prisma` y Prisma crea el archivo de
  la migración en `prisma/migrations/`, que se sube a Git. Nunca con SQL suelto ni tocando a mano el archivo
  de la base de datos: así se puede volver a crear entera desde el repositorio. El cliente de Prisma y sus
  tipos se generan, no se escriben a mano.
- Los datos de ejemplo van en un seed dentro del repositorio, que se carga con `pnpm seed`: datos realistas
  del negocio y un usuario de prueba de cada tipo. Lo usan las pruebas, la demo y quien descargue el
  proyecto para probarlo. No se crea una segunda base de datos ni un modo de demostración aparte: la app
  es la misma, con datos de ejemplo.
- Cuando el proyecto crezca, el código se agrupa por funcionalidad, y se explica en `docs/architecture.md`.

## TypeScript y nombres

- Modo estricto. Nada de `any`: si no se conoce el tipo, `unknown`, y se valida. Nada de `@ts-ignore` ni de
  desactivar ESLint sin un comentario que explique por qué.
- Los tipos de lo que entra (formularios, API) salen de los esquemas de Zod.
- Nombres en inglés en el código y en español los textos que ve el usuario. Nombres que dicen qué hacen:
  `getOverdueInvoices`, no `getData`.
- Archivos en minúsculas con guiones (`invoice-list.tsx`) y componentes en PascalCase (`InvoiceList`).
- Funciones cortas que hacen una sola cosa. Un archivo que pasa de unas 300 líneas o mezcla temas se divide.
- Nada de números ni textos sueltos repetidos: constantes con nombre.

## Errores y estilo

- Los errores esperados (datos no válidos, «no encontrado», sin permiso) se devuelven como resultado y se
  explican al usuario; los inesperados se lanzan y los recoge `error.tsx`. Nunca un `catch` vacío ni un
  error ignorado.
- Los comentarios explican el porqué, no el qué. Sin código comentado ni `console.log` de depuración en lo
  que se sube.
