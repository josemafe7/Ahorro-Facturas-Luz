# DESIGN.md

Las reglas del aspecto de la app. Salen de la entrevista de diseño del 9 de octubre de 2026: se usa sobre
todo en ordenador, combinación «verde ahorro», tono serio, moderno y sencillo, y fondo claro. Se aplican una
sola vez como tema, como dice `docs/conventions.md`; ninguna pantalla define sus propios colores.

## Overview

Un panel de gestión limpio para un asesor que trabaja con el dinero de otra persona: menú lateral oscuro,
contenido sobre fondo claro, tablas claras y los importes como protagonistas. El verde se reserva para lo
que importa, el ahorro y la acción principal de cada pantalla; todo lo demás es gris pizarra y blanco. El
estudio en PDF es un documento sobrio que el cliente entiende de un vistazo: cuánto paga, cuánto pagaría y
cuánto se ahorra.

Se diseña primero para ordenador (1280 px o más) y se adapta al móvil, donde lo importante es poder subir la
foto de una factura y consultar la lista.

## Colors

Los colores de marca salen de `src/config/app.ts`, el único sitio donde se cambian. Los demás son fijos.

| Uso | Color | Código |
|---|---|---|
| Principal: botón principal, enlaces, elemento activo, ahorro | Verde esmeralda | `#047857` |
| Principal al pasar el ratón | Verde esmeralda oscuro | `#065F46` |
| Fondo suave del principal: resaltar el ahorro, filas elegidas | Verde muy claro | `#ECFDF5` |
| Texto sobre el principal | Blanco | `#FFFFFF` |
| Menú lateral | Gris pizarra muy oscuro | `#0F172A` |
| Texto del menú lateral | Gris claro, y blanco en el activo | `#CBD5E1` / `#FFFFFF` |
| Fondo de la app | Gris casi blanco | `#F8FAFC` |
| Fondo de tarjetas, tablas y formularios | Blanco | `#FFFFFF` |
| Bordes y separadores | Gris claro | `#E2E8F0` |
| Texto principal | Gris pizarra casi negro | `#0F172A` |
| Texto secundario y ayudas | Gris pizarra medio | `#475569` |
| Dato dudoso o aviso: fondo, borde y texto | Ámbar | `#FFFBEB` / `#F59E0B` / `#92400E` |
| Error y acción de borrar | Rojo | `#B91C1C`, fondo `#FEF2F2` |

Los cuatro estados de un estudio, siempre con el mismo color, fondo claro y texto oscuro:

| Estado | Fondo | Texto |
|---|---|---|
| Borrador | `#F1F5F9` | `#334155` |
| Enviado | `#E0F2FE` | `#075985` |
| Aceptado | `#E0E7FF` | `#3730A3` |
| Contratado | `#D1FAE5` | `#064E3B` |

Todo texto cumple un contraste mínimo de 4,5:1 con su fondo. El color nunca es la única pista: un dato
dudoso lleva además un icono y su motivo escrito, y un estado lleva su nombre.

## Typography

- Una sola familia sin remates: Geist, la que trae Next.js, con la del sistema como reserva.
- Tamaños: 14 px para el texto de la app y las tablas, 13 px para las ayudas, 16 px para los campos en móvil
  (evita que el navegador amplíe la pantalla), 20 px para el título de cada pantalla y 30 px para las cifras
  destacadas.
- Pesos: normal para el texto, medio para etiquetas y cabeceras de tabla, seminegrita para títulos y cifras.
- Los importes y las cantidades usan cifras de ancho fijo y van alineados a la derecha en las tablas.
- Formato español: `1.234,56 €`, `4,6 kW`, `96 kWh`, `0,123288 €/kW día`, fechas como `9 oct 2026`.
- En el PDF, Helvetica, que viene incluida en cualquier lector y no hay que incrustar.

## Layout

- Menú lateral fijo de 240 px a la izquierda, con el logo y el nombre de la app arriba, las tres secciones
  (Estudios, Catálogo y Ajustes) y el usuario abajo. En móvil se convierte en una barra superior con un
  botón que abre el menú.
- El contenido va centrado con un ancho máximo de 1200 px y un margen de 32 px (16 px en móvil).
- Cada pantalla empieza con su título a la izquierda y su acción principal a la derecha. Solo hay una acción
  principal por pantalla.
- Espaciado en múltiplos de 4 px: 8 px entre un campo y su etiqueta, 16 px entre campos, 24 px entre bloques.
- La revisión de datos va a dos columnas: la factura original a la izquierda, que se queda fija al bajar, y
  el formulario a la derecha. En móvil, la factura queda arriba y plegable.
- Las listas son tablas. En móvil, la de estudios pasa a una tarjeta por estudio con los mismos datos; las
  demás tablas se desplazan de lado dentro de su recuadro, sin mover la pantalla.
- Los formularios van por bloques con título (cliente y suministro, potencia, consumo, precios), con dos o
  tres campos por fila en ordenador y uno en móvil.
- El PDF es un A4 vertical de una página, o dos si el desglose no cabe: cabecera con la marca del asesor,
  las tres cifras clave, los datos del suministro, el desglose comparado y las notas al pie.

## Elevation & Depth

Plano. Las tarjetas y las tablas se separan del fondo con un borde de 1 px, sin sombra. Solo llevan sombra
lo que flota por encima del resto: menús desplegables, diálogos y avisos. Sin degradados ni efectos de
cristal.

## Shapes

- Esquinas de 8 px en botones, campos, tarjetas y diálogos; de 6 px en elementos pequeños.
- Las etiquetas de estado son píldoras, con las esquinas totalmente redondeadas.
- Iconos de una sola familia, Lucide, de trazo fino y a 16 o 20 px. Siempre acompañan a un texto, salvo en
  botones de solo icono, que llevan su nombre para lectores de pantalla.

## Components

Los de shadcn/ui tal como vienen, con este tema. No se crean variantes propias si una estándar sirve.

- **Botón:** el principal es verde y hay uno por pantalla; los demás son de contorno o de solo texto; el de
  borrar es rojo y siempre pide confirmación en un diálogo.
- **Campo:** etiqueta encima, ayuda debajo en gris y error debajo en rojo. Un campo dudoso lleva fondo y
  borde ámbar, un icono de aviso y su motivo; al corregirlo o darlo por bueno vuelve a su aspecto normal.
- **Campo con unidad:** la unidad (kW, kWh, €, %) va dentro del campo, a la derecha. El precio de la potencia
  lleva además un desplegable con «por día», «por mes» o «por año».
- **Tabla:** cabecera en gris medio, filas de 48 px, una línea fina entre filas e importes a la derecha. Una
  fila entera es pulsable cuando abre un detalle.
- **Etiqueta de estado:** una píldora con los colores de la tabla de estados. En la lista es además un
  desplegable para cambiar el estado.
- **Cifra destacada:** una tarjeta con una etiqueta pequeña arriba y la cifra en 30 px. La del ahorro va
  sobre el verde muy claro, con la cifra en verde.
- **Desglose:** una tabla con el concepto, la operación completa en gris («4,6 kW × 30 días × 0,123288 €») y
  el importe. En la comparativa, hoy y la propuesta van lado a lado.
- **Zona de subida:** un recuadro grande de borde discontinuo con un icono, el texto «Arrastra la factura o
  elígela», los formatos admitidos y el aviso de privacidad debajo. Mientras la IA lee, la zona muestra el
  progreso en su lugar.
- **Aviso:** una franja con icono y texto. Ámbar para lo que conviene revisar, rojo para lo que impide
  seguir y gris para lo informativo.
- **Sin datos:** un icono, una frase que dice qué va aquí y el botón para crear lo primero.
- **Cargando:** bloques grises con la forma de lo que va a aparecer, nunca una pantalla en blanco.
- **Mensajes breves:** la confirmación de una acción («Tarifa guardada») aparece abajo a la derecha y se va
  sola.

## Do's and Don'ts

- Sí: el ahorro es siempre lo más visible de la pantalla y del PDF, en verde y con su periodo («al año»).
- Sí: cada importe calculado se puede abrir para ver su operación.
- Sí: textos cortos, en español de España y de tú. Los botones dicen lo que hacen: «Calcular», «Descargar
  PDF», «Guardar tarifa».
- Sí: todo se puede usar con el teclado, y el foco se ve.
- No: verde para adornar. Si todo es verde, el ahorro deja de destacar.
- No: más de una acción principal por pantalla.
- No: colores, tamaños ni sombras escritos en una pantalla. Se cambian en el tema.
- No: rojo para un ahorro negativo o un aviso que no impide seguir; el rojo es solo para errores y borrar.
- No: jerga técnica ni mensajes de error crudos. Un error dice qué ha pasado y qué se puede hacer.
