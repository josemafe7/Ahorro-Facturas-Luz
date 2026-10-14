/**
 * LA MARCA Y LOS TEXTOS DEL SECTOR, EN UN SOLO SITIO.
 *
 * Para adaptar la app a otro negocio se cambia este archivo: el nombre, el logo, los colores y cómo se
 * llaman las cosas del sector. Ninguna pantalla, ni el PDF, escribe estos textos por su cuenta: una prueba
 * lo comprueba. Lo que va entre llaves, como `{nombre}`, es un hueco que la app rellena: se puede mover
 * dentro de la frase, pero no cambiarle el nombre.
 *
 * Lo que la app lee de un documento, cómo lo comprueba y cómo calcula no está aquí: es el módulo del sector,
 * en `src/sectors/`, con sus propios textos. `sector.id` dice cuál se usa.
 */
export const appConfig = {
  brand: {
    /** El nombre de la app: sale en el menú, en la pestaña del navegador y en la pantalla de entrada. */
    name: "Estudio de Ahorro",
    /** Una frase corta bajo el nombre, en la pantalla de entrada. */
    tagline: "De la factura al estudio de ahorro, en medio minuto",
    /** El logo, dentro de `public/`. Cuadrado y en SVG o PNG. */
    logo: "/logo.svg",
    /** Los colores de marca. Todo lo demás (grises, avisos, estados) está en `src/app/globals.css`. */
    colors: {
      /** Botón principal, enlaces, elemento activo y cifras de ahorro. Tiene que leerse con texto blanco. */
      primary: "#047857",
      /** El principal al pasar el ratón: un tono más oscuro. */
      primaryHover: "#065F46",
      /** Fondo suave para resaltar el ahorro: el principal muy aclarado. */
      primarySoft: "#ECFDF5",
      /** El color del texto sobre el principal. */
      onPrimary: "#FFFFFF",
    },
  },

  sector: {
    /** El módulo de `src/sectors/` que usa la app. */
    id: "electricity",

    /** Cómo se llaman las cosas de este sector en las pantallas y en el PDF. */
    texts: {
      /** El documento que sube el asesor. */
      document: {
        name: "factura",
        upload: "Sube la factura de luz del cliente",
        uploadHint: "Arrastra aquí la factura o elígela",
        reading: "Leyendo la factura…",
        original: "Factura original",
        notRecognized: "Este documento no parece una factura de luz.",
        /** Junto a cada importe: a qué periodo corresponde. */
        periodDetail: "en una factura de {dias} días",
        /** El aviso de que lo calculado no coincide con el total impreso en el documento. */
        mismatchTitle: "El cálculo no cuadra con el total de la factura",
        mismatch:
          "Con los precios de la factura salen {calculado}, y la factura dice {impreso}: {diferencia} de diferencia. Puede llevar descuentos o servicios añadidos, o ser de una fecha con otros impuestos. Revisa los datos o sigue si es correcto.",
      },
      /** Quién vende hoy el servicio al cliente y quién se lo ofrecería. */
      provider: {
        name: "comercializadora",
        current: "Comercializadora actual",
      },
      /** Lo que hay en el catálogo del asesor. */
      offer: {
        name: "tarifa",
        plural: "tarifas",
        /** Con mayúscula, para la cabecera de las tablas. */
        title: "Tarifa",
        catalogTitle: "Catálogo de tarifas",
        compared: "Tarifas comparadas",
        add: "Añadir tarifa",
        edit: "Cambiar tarifa",
        formTitle: "Datos de la tarifa",
        save: "Guardar tarifa",
        saved: "Tarifa guardada.",
        deleteTitle: "¿Borrar esta tarifa?",
        deleteNote: "Los estudios que ya la usan no cambian.",
        deleted: "Tarifa borrada.",
        proposed: "Tarifa propuesta",
        empty: "Todavía no hay tarifas en tu catálogo",
        noneActive: "No hay ninguna tarifa activa en tu catálogo.",
        noneSaves: "Ninguna tarifa de tu catálogo mejora lo que el cliente paga hoy.",
        notSaving: "Esa tarifa no está entre las que ahorran en este estudio.",
        /** Cargar ofertas leyendo con IA el documento de un proveedor. */
        importTitle: "Subir tarifario",
        importHint: "Sube el tarifario de una comercializadora y la IA propondrá sus tarifas",
        importNote: "El tarifario no se guarda: solo se usa para leer sus tarifas.",
        importReading: "Leyendo el tarifario…",
        importAnother: "Subir otro tarifario",
        importFoundOne: "La IA ha encontrado 1 tarifa",
        importFoundMany: "La IA ha encontrado {total} tarifas",
        importEmpty: "La IA no ha encontrado en ese documento ninguna tarifa que se pueda cargar.",
        importFailed: "La IA no ha podido leer el documento. Vuelve a intentarlo o añade las tarifas a mano.",
        importLimit: "Has llegado al límite de {limite} lecturas con IA por hora. Inténtalo más tarde o añade las tarifas a mano.",
        importNotConfigured: "La lectura con IA no está configurada: falta la clave de OpenRouter, que se pone en Ajustes. Añade las tarifas a mano o ponla y vuelve a subirlo.",
        /** Cada oferta que propone la IA, cuando todavía no tiene nombre, y lo que se le dice al asesor. */
        proposalTitle: "Tarifa {numero}",
        proposalHint: "Propuesta {numero} de {total}. Compárala con el tarifario antes de guardarla.",
        discard: "Descartar esta tarifa",
      },
      /** Lo que la app genera. */
      study: {
        name: "estudio",
        plural: "Estudios",
        title: "Estudio de ahorro",
        new: "Nuevo estudio",
        empty: "Todavía no has hecho ningún estudio",
        emptyHint: "Sube la primera factura y tendrás el estudio en medio minuto.",
        customer: "Titular",
        views: "Vistas del estudio",
        status: "Estado del estudio",
        notCalculated: "Este estudio todavía no está calculado",
        notCalculatedHint: "Revisa los datos de la factura y pulsa «Calcular».",
        calculateFirst: "Calcula el estudio antes de cambiar su estado.",
        calculatedNote: "Calculado el {fecha} con las tarifas y los impuestos de ese día. El ahorro anual proyecta esta factura a 365 días.",
        recalculated: "Estudio recalculado.",
        uploadAnother: "O sube otro documento en un estudio nuevo.",
        deleteLabel: "Borrar el estudio de {nombre}",
        deleteTitle: "¿Borrar este estudio?",
        deleteDescription: "Se borrarán el estudio de «{nombre}», sus datos y la factura guardada. No se puede deshacer.",
        deleted: "Estudio borrado.",
        /** En Ajustes: para qué sirven la marca, su color y los impuestos. */
        brandHelp: "Es la que sale en el estudio en PDF que recibe tu cliente.",
        brandColorHelp: "El de la cabecera del estudio y la cifra del ahorro.",
        settingsHelp: "Se usan en todos los cálculos nuevos. Los estudios ya calculados no cambian.",
      },
      /** Los textos fijos del PDF que recibe el cliente. */
      pdf: {
        title: "Estudio de ahorro en tu factura de luz",
        currentLabel: "Hoy pagas",
        proposedLabel: "Pagarías",
        savingsYearLabel: "Te ahorras al año",
        savingsMonthLabel: "Te ahorras al mes",
        proposedOffer: "Tarifa propuesta: {oferta}",
        breakdownTitle: "Cómo se calcula",
        proposedColumn: "Con la tarifa propuesta",
        calculatedNote: "Estudio calculado el {fecha} a partir de una factura de {dias} días.",
        projectionNote:
          "El ahorro anual es una estimación: proyecta a un año el consumo de la factura analizada. El ahorro real dependerá de tu consumo.",
        disclaimer:
          "Importes calculados con los precios de la tarifa y los impuestos vigentes en la fecha del estudio. Este documento es informativo y no constituye una oferta vinculante.",
      },
      /** El aviso de privacidad que se ve antes de subir un documento. */
      privacy:
        "La factura se envía a un servicio de inteligencia artificial para leerla. La app guarda la factura y los datos que salen de ella (titular, dirección, CUPS, consumos y precios) hasta que borres el estudio.",
    },
  },
} as const;

export type AppConfig = typeof appConfig;
