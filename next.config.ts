import type { NextConfig } from "next";

// Cabeceras de seguridad para todas las respuestas (ver «Configuración» en docs/security.md).
const securityHeaders = [
  // El navegador no adivina el tipo de un archivo: usa el que le dice el servidor.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Al salir hacia otra web no se envía la dirección completa de la página.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Solo la propia app puede mostrarse dentro de un marco: lo necesita para enseñar la factura al revisar.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // La app no usa cámara, micrófono ni ubicación.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Una vez publicada con HTTPS, el navegador no vuelve a abrirla sin cifrar.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// Una factura puede pesar hasta 10 MB (regla F1): se deja un poco de margen para el envoltorio del envío.
const MAX_UPLOAD_SIZE = "11mb";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // La app se enseña en directo con `pnpm dev`: sin el indicador de Next.js, que tapa el pie del menú. Los
  // errores se siguen viendo en pantalla.
  devIndicators: false,
  experimental: {
    serverActions: { bodySizeLimit: MAX_UPLOAD_SIZE },
    proxyClientMaxBodySize: MAX_UPLOAD_SIZE,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
