# Especificación

Qué se construye. Sirve para comprobar, sin saber programar, que lo construido hace lo que tiene que hacer.

**Estado:** aprobada

## Qué problema resuelve y para quién

La usa un asesor energético: un comercial que cobra comisión por cada contrato de luz que consigue cambiar.
Hoy prepara cada estudio comparativo a mano, en una hoja de cálculo. Con la app sube la factura del cliente,
revisa lo que ha leído la IA y en medio minuto tiene el estudio de ahorro en PDF con su marca, listo para
enviar. El asesor paga la app con una cuota mensual.

Además es una app de muestra de DominIA Academy: se enseña en directo y se entrega a los miembros para que
la adapten a otro nicho (gas, telefonía, seguros) y la vendan. Por eso arranca en local sin crear cuentas,
trae datos de ejemplo y tiene la marca y los textos del sector en un solo sitio.

## Qué hace

Cada línea es una regla que se puede comprobar: «Cuando pasa esto, la app hace esto otro». El código entre
paréntesis identifica la regla en las pruebas.

### Entrar

- (E1) Cuando alguien sin sesión abre cualquier pantalla o dirección de la app, acaba en la pantalla de
  inicio de sesión y no ve ningún dato.
- (E2) Cuando el asesor escribe su correo y su contraseña, entra en su lista de estudios. Con un dato
  incorrecto ve «Correo o contraseña incorrectos», sin decir cuál de los dos falla. Al cerrar sesión deja de
  ver sus datos.
- (E3) Cuando desde una misma conexión se hacen más de 5 intentos de inicio de sesión en un minuto, la app
  rechaza los siguientes hasta que pasa ese minuto.
- (E4) No hay registro: nadie puede crearse una cuenta desde la app.

### Subir la factura y leerla

- (F1) El asesor puede subir la factura en PDF o en foto (JPG, PNG o WebP) de hasta 10 MB. Cualquier otro
  tipo de archivo, o uno mayor, se rechaza con un mensaje claro y no se guarda nada.
- (F2) Al subirla, la app crea un estudio en estado «borrador» y guarda la factura en privado.
- (F3) La IA lee la factura y propone estos datos: titular, dirección de suministro, CUPS, comercializadora
  actual, tarifa de acceso, potencia contratada en punta y en valle, consumo en punta, llano y valle, fechas
  del periodo y días facturados, precio de la potencia en punta y en valle, precio de la energía en punta,
  llano y valle, importe del alquiler del contador y total de la factura.
- (F4) La IA solo lee y propone. Ningún importe del estudio sale de la IA: todos los calcula la app a partir
  de los datos que el asesor ha revisado.
- (F5) Cada dato que propone la IA llega marcado como seguro o como dudoso, y los que no encuentra llegan
  vacíos.
- (F6) La app marca además como dudoso, sin IA, un CUPS cuyas letras de control no cuadran.
- (F7) La app marca además como dudosos, sin IA, unos días facturados que no coinciden con las fechas del
  periodo. Se admite un día de diferencia, porque hay comercializadoras que cuentan el último día.
- (F8) La app marca además como dudoso, sin IA, un precio que no es razonable: 0, más de 1 €/kWh de energía
  o más de 1 €/kW al día de potencia.
- (F9) La respuesta de la IA se comprueba antes de usarla: si no tiene el formato esperado, se descarta y se
  trata como un fallo de lectura. Lo que venga escrito dentro del documento son datos, nunca órdenes.
- (F10) Cuando la IA dice que el documento no es una factura de luz, la app lo avisa y no propone datos.
- (F11) Cuando la IA falla, tarda más de 60 segundos o no está configurada, el asesor ve un mensaje claro, el
  borrador se conserva y puede volver a intentarlo o rellenar los datos a mano.
- (F12) Cada asesor puede pedir como máximo 30 lecturas de IA por hora, entre facturas y tarifarios. Al
  superarlas, la app lo dice y deja seguir a mano.

### Revisar

- (R1) Antes de calcular, el asesor ve todos los datos leídos junto a la factura original y puede corregir
  cualquiera. Los dudosos y los vacíos se ven resaltados, con el motivo.
- (R2) No se puede calcular mientras falte o no sea válido un dato necesario: titular, potencias, consumos,
  días facturados y precios. La app señala cuál. La dirección, el CUPS, la comercializadora, las fechas, el
  alquiler del contador y el total de la factura pueden quedar vacíos.
- (R3) Solo se admite la tarifa de acceso 2.0TD. Cuando la factura es de otra tarifa o una potencia supera
  los 15 kW, la app lo dice y no calcula.
- (R4) El precio de la potencia se puede indicar por día, por mes o por año. La app lo convierte a precio por
  día (el mensual, multiplicado por 12 y dividido entre 365; el anual, dividido entre 365) y enseña la
  conversión.
- (R5) Todos los precios, los de la factura y los del catálogo, se indican sin impuestos.

### Calcular y comparar

La fórmula completa, con sus fuentes oficiales y un ejemplo hecho a mano, está en `docs/calculo-luz.md`.

- (C1) Lo que el cliente pagaría con una tarifa se calcula para el mismo periodo de la factura, con sus
  mismos días, potencias y consumos, sumando por este orden: la potencia de cada periodo (kW × días ×
  precio); la energía de cada periodo (kWh × precio); la financiación del bono social (días × importe
  diario); el impuesto eléctrico (un porcentaje de todo lo anterior); el alquiler del contador; y el IVA (un
  porcentaje de todo lo anterior).
- (C2) Lo que el cliente paga hoy se calcula con esa misma fórmula y los precios de su factura, para comparar
  lo mismo con lo mismo.
- (C3) Cada línea del cálculo enseña su operación completa: las cantidades, el precio y el resultado.
- (C4) Cada línea se redondea al céntimo, con el medio céntimo hacia arriba, y los totales son la suma de las
  líneas ya redondeadas: lo que se ve suma exactamente.
- (C5) El impuesto eléctrico nunca es menor que su mínimo legal por la energía consumida. Cuando se aplica el
  mínimo, la línea lo dice.
- (C6) El alquiler del contador es el importe que trae la factura, igual hoy y con cualquier tarifa. Si la
  factura no lo trae, es el importe diario de los ajustes por los días facturados.
- (C7) El ahorro en la factura es lo que paga hoy menos lo que pagaría. El ahorro anual es ese ahorro
  multiplicado por 365 y dividido entre los días facturados. El ahorro mensual es el anual dividido entre 12.
- (C8) La app calcula todas las tarifas activas del catálogo y las enseña ordenadas de mayor a menor ahorro
  anual.
- (C9) Cuando lo que la app calcula que paga hoy se aparta más de 0,50 € del total que trae la factura, la
  app avisa de que no cuadra y de los motivos posibles: descuentos, servicios añadidos o impuestos distintos
  en la fecha de la factura. El asesor decide si sigue.
- (C10) Cuando el catálogo no tiene ninguna tarifa activa, la app lo dice y lleva al catálogo, sin calcular.
- (C11) Cuando ninguna tarifa mejora lo que paga hoy, la app lo dice claramente y no genera el estudio.
- (C12) Un estudio calculado guarda una copia de los precios y de los impuestos con los que se calculó. Si
  después cambian el catálogo o los ajustes, el estudio no cambia hasta que el asesor lo recalcula.

### Estudio en PDF

- (P1) El asesor elige una de las tarifas que ahorran, por defecto la de mayor ahorro, y descarga el estudio
  en PDF.
- (P2) El PDF lleva el titular, la dirección y el CUPS; lo que paga hoy; lo que pagaría; el ahorro al mes y
  al año; y el desglose, línea a línea y con su operación, de hoy y de la propuesta.
- (P3) El PDF lleva la marca del asesor: su nombre comercial, su logo, su color y sus datos de contacto.
- (P4) Los importes del PDF son los del cálculo guardado, los mismos que se ven en pantalla.
- (P5) El PDF dice de qué factura sale la estimación, con qué fecha se calculó y que el ahorro anual es una
  proyección de ese periodo a un año.

### Lista de estudios

- (L1) Cada estudio queda guardado en la lista con el titular, la fecha, la tarifa propuesta, el ahorro
  anual y su estado. Los más recientes van primero.
- (L2) El estado es uno de estos cuatro: borrador, enviado, aceptado o contratado. Lo cambia el asesor a
  mano.
- (L3) Un estudio que todavía no está calculado solo puede estar en borrador.
- (L4) El asesor puede abrir un estudio, ver sus datos y su cálculo, volver a descargar el PDF, y corregir
  los datos y recalcular.
- (L5) Cuando el asesor borra un estudio, tras confirmarlo, desaparecen sus datos y la factura guardada.

### Catálogo de tarifas

- (T1) El asesor ve su catálogo: comercializadora, nombre de la tarifa, precios y si está activa.
- (T2) El asesor puede añadir, cambiar y borrar tarifas a mano. Cada tarifa tiene comercializadora, nombre,
  precio de la potencia en punta y en valle, precio de la energía (uno solo para todo el día o uno por
  periodo) y unas notas opcionales.
- (T3) Una tarifa con un dato que falta o que no es válido no se guarda, y la app señala cuál.
- (T4) El asesor puede desactivar una tarifa sin borrarla: deja de entrar en las comparaciones.
- (T5) El asesor puede subir el tarifario de una comercializadora, en PDF o en foto. La IA propone las
  tarifas 2.0TD de precio fijo que encuentra, con sus datos dudosos marcados, y no se guarda ninguna hasta
  que el asesor las revisa y elige cuáles guardar.
- (T6) Borrar o cambiar una tarifa no cambia los estudios ya calculados con ella.

### Ajustes

- (A1) El asesor puede cambiar los impuestos y cargos: IVA, impuesto eléctrico y su mínimo, alquiler del
  contador y financiación del bono social. Un valor no válido no se guarda.
- (A2) La app trae de inicio los valores vigentes el 9 de octubre de 2026, comprobados en fuentes oficiales:
  IVA del 21 %; impuesto eléctrico del 5,11269632 %, con un mínimo de 1 € por MWh; alquiler del contador de
  0,026630 € al día (0,81 € al mes); y financiación del bono social de 0,024688 € al día (9,011295 € al año).
- (A3) El asesor puede cambiar su marca: nombre comercial, logo, color y datos de contacto. Es la que sale en
  el PDF.
- (A4) El logo es una imagen PNG, JPG o WebP de hasta 2 MB. Cualquier otro archivo se rechaza.

### Marca y sector

- (M1) El nombre de la app, su logo, sus colores y los textos generales del sector (cómo se llaman el
  documento, el proveedor, la oferta y el estudio) salen de un único archivo. Al cambiarlo, cambian en todas
  las pantallas.
- (M2) El motor (subir un documento, leerlo con IA, revisar, comparar con un catálogo y generar la propuesta)
  no contiene nada propio de la luz. Todo lo de la luz (qué se lee de una factura, qué se comprueba, la
  fórmula y sus textos) vive en un módulo aparte, y el motor funciona igual con otro módulo.

### Datos de ejemplo y privacidad

- (D1) Un solo comando deja la app lista para la demo: un asesor de prueba, tarifas de comercializadoras
  inventadas y varios estudios en distintos estados.
- (D2) El proyecto trae facturas y un tarifario de ejemplo, inventados, para subirlos en la demo. No hay
  datos reales de ninguna persona.
- (V1) Antes de subir una factura, la app explica que se enviará a un servicio de IA para leerla y qué datos
  se guardan.
- (V2) Una factura guardada solo se puede abrir desde la app: su dirección no funciona sin sesión.

## Quién puede hacer qué

Lo que no aparece aquí no está permitido.

- Asesor, con la sesión iniciada: ve, crea, cambia y borra sus propios estudios, sus facturas subidas, su
  catálogo y sus ajustes. No puede ver, cambiar ni borrar nada de otro asesor, tampoco abriendo su dirección
  directamente.
- Persona sin sesión: solo ve la pantalla de inicio de sesión.

## Qué datos maneja

- La cuenta del asesor: nombre, correo y contraseña, que se guarda cifrada. Es un dato personal. La crea
  quien instala la app.
- La marca del asesor: nombre comercial, logo, color, teléfono, correo y web. La escribe el asesor.
- Los estudios: los datos del cliente del asesor que salen de su factura (titular, dirección de suministro,
  CUPS, comercializadora, potencias, consumos, precios y total) y el cálculo. Son datos personales de una
  tercera persona, no especialmente protegidos.
- La factura original, en PDF o en foto. Puede traer más datos personales de los que la app usa, como el NIF
  o parte de la cuenta bancaria: se guarda en privado y esos datos no se extraen.
- El catálogo de tarifas y los ajustes de impuestos. No son datos personales.
- Cuántas lecturas de IA ha pedido cada asesor, para aplicar el límite.
- Para leerla, la factura entera se envía al modelo de IA a través de OpenRouter. Ningún otro dato sale de la
  app.

## Qué queda fuera

- Las tarifas de acceso distintas de la 2.0TD.
- Gas, telefonía y seguros: el motor queda preparado para ellos, pero solo se construye la luz.
- En el catálogo: las tarifas indexadas o de precio regulado (PVPC), cuyo precio cambia cada hora, y las que
  llevan cuota fija o servicios añadidos.
- De la factura actual: descuentos, servicios añadidos, compensación de excedentes de placas solares y bono
  social. La app avisa de que el total no cuadra, pero no los calcula.
- Impuestos distintos según el cliente (Canarias, Ceuta y Melilla): los ajustes valen para todos los
  estudios.
- Enviar el estudio desde la app: el asesor descarga el PDF y lo envía por su cuenta.
- Registro, recuperación y cambio de contraseña desde la app, y cobro de la cuota.
- Publicar la app en internet: de momento funciona solo en local.

## Fases

Una, dos o tres, nunca más, salvo que yo pida expresamente otro número. La fase 1 es el MVP: la app entera
para usar, con todas sus pantallas. Después va solo lo que acordamos que puede esperar. Lo que se añada con
la app ya terminada va como fase nueva.

- [ ] Fase 1 · MVP: inicio de sesión, lista de estudios con sus estados, subir y leer la factura, revisar, calcular y comparar, estudio en PDF con la marca del asesor, catálogo de tarifas (a mano y leyendo un tarifario), ajustes de impuestos y de marca, y datos de ejemplo — se comprueba: con los datos de ejemplo cargados, entro como el asesor de prueba, subo una factura de ejemplo, corrijo un dato dudoso, calculo, descargo el PDF y veo el estudio en la lista, donde le cambio el estado; añado una tarifa a mano y otra desde el tarifario de ejemplo; y cambio el IVA en ajustes y compruebo que un estudio nuevo lo usa y uno antiguo no cambia.
- [ ] Fase 2 · Captación y 3.0TD: una página pública donde el cliente sube su factura y deja su contacto, que le llega al asesor como oportunidad; y la tarifa de acceso 3.0TD — se comprueba: sin sesión, subo una factura en la página pública y dejo un contacto, y el asesor la ve como oportunidad y la convierte en estudio; y subo una factura 3.0TD de ejemplo y obtengo su estudio.
- [ ] Fase 3 · Equipos: varios asesores en una misma cuenta — se comprueba: dos asesores de la misma cuenta ven los mismos estudios y el mismo catálogo, y uno de otra cuenta no ve nada de ellos.

## Cómo se comprueba que todo funciona

- `pnpm check` y `pnpm test:e2e` pasan: cada regla de «Qué hace» y cada permiso de «Quién puede hacer qué»
  tiene su prueba.
- El estudio de la primera factura de ejemplo coincide, céntimo a céntimo, con el cálculo hecho a mano de
  `docs/calculo-luz.md`.
- Una lectura real con la IA de cada factura de ejemplo devuelve los datos que trae la factura. Esta prueba
  se hace a mano, porque cuesta dinero.
- En otro ordenador, siguiendo solo `README.md`, la app arranca con los datos de ejemplo.
