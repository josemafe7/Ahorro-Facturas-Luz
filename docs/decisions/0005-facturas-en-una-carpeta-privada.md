# 0005 · Los archivos subidos se guardan en una carpeta privada del servidor

- **Estado:** aceptada
- **Fecha:** 2026-10-09

## Contexto y problema

Las facturas, los tarifarios y el logo que sube el asesor hay que guardarlos en algún sitio. Con SQLite
(decisión 0003) no hay un servicio de archivos, y una factura lleva datos personales: no puede quedar al
alcance de cualquiera que conozca su dirección.

## Opciones consideradas

- Una carpeta del propio servidor, fuera de la parte pública de la app.
- Guardarlos dentro de la base de datos: un solo archivo que copiar, pero la base de datos crece mucho y se
  vuelve lenta de copiar.
- Un servicio externo de archivos: obliga a crear una cuenta, que es lo que se quería evitar.

## Decisión

Una carpeta privada del servidor, `storage/`, que no se sube a Git. Cada archivo se guarda con un nombre
aleatorio, nunca con el original, y solo se entrega a través de la app, que comprueba antes la sesión y que
el archivo es de quien lo pide.

## Consecuencias

No hace falta ninguna cuenta y los archivos se ven con el explorador del ordenador mientras se desarrolla.

A cambio, una copia de seguridad completa son dos cosas, el archivo de la base de datos y esta carpeta, y el
día que se publique la carpeta tiene que vivir en un disco que no se borre con cada publicación.
