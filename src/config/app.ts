/**
 * LA MARCA Y LOS TEXTOS DEL SECTOR, EN UN SOLO SITIO.
 *
 * Para adaptar la app a otro negocio se cambia este archivo: el nombre, el logo, los colores y cómo se
 * llaman las cosas del sector. Ninguna pantalla escribe estos textos por su cuenta.
 *
 * Lo que la app lee de un documento, cómo lo comprueba y cómo calcula no está aquí: es el módulo del sector,
 * en `src/sectors/`. `sector.id` dice cuál se usa.
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
        catalogTitle: "Catálogo de tarifas",
        compared: "Tarifas comparadas",
        add: "Añadir tarifa",
        edit: "Cambiar tarifa",
        save: "Guardar tarifa",
        importTitle: "Subir tarifario",
        importHint: "Sube el tarifario de una comercializadora y la IA propondrá sus tarifas",
        proposed: "Tarifa propuesta",
        empty: "Todavía no hay tarifas en tu catálogo",
        noneActive: "No hay ninguna tarifa activa en tu catálogo.",
        noneSaves: "Ninguna tarifa de tu catálogo mejora lo que el cliente paga hoy.",
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
      },
      /** Los textos fijos del PDF que recibe el cliente. */
      pdf: {
        title: "Estudio de ahorro en tu factura de luz",
        currentLabel: "Hoy pagas",
        proposedLabel: "Pagarías",
        savingsYearLabel: "Te ahorras al año",
        savingsMonthLabel: "Te ahorras al mes",
        breakdownTitle: "Cómo se calcula",
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
