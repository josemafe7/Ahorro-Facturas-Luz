import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

/**
 * EL RECORRIDO DE LA FASE 1, tal como lo dice «se comprueba» en docs/spec.md, hecho como lo haría el asesor.
 * Parte de los datos de ejemplo recién cargados. Las reglas una a una están probadas sin navegador.
 */
const advisor = { email: "demo@estudiodeahorro.test", password: "ahorro-demo-2026" };
const sample = (file: string) => path.resolve("ejemplos", file);

test.describe.configure({ mode: "serial" });

let page: Page;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
});

test.afterAll(async () => {
  await page.close();
});

const INVOICE_UPLOAD = "Sube la factura de luz del cliente";
const TARIFF_SHEET_UPLOAD = "Subir tarifario";

/**
 * Sube un documento de ejemplo en la zona de subida que se llama `zone`. Al buscarla por su nombre, espera a
 * que la pantalla correcta esté cargada: en Ajustes hay otro campo de archivo, el del logo.
 */
async function upload(zone: string, file: string) {
  await page.getByLabel(zone, { exact: true }).setInputFiles(sample(file));
}

test("sin sesión no se ve nada y el asesor de prueba entra con sus datos", async () => {
  await page.goto("/estudios");
  await expect(page).toHaveURL(/\/entrar$/);

  await page.getByLabel("Correo").fill(advisor.email);
  await page.getByLabel("Contraseña").fill("no-es-la-contrasena");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Correo o contraseña incorrectos")).toBeVisible();

  await page.getByLabel("Contraseña").fill(advisor.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/estudios$/);
  // Los datos de ejemplo: estudios en distintos estados.
  await expect(page.getByRole("link", { name: "Elena Navarro Gil" })).toBeVisible();
});

test("sube una factura de ejemplo, corrige el dato dudoso, calcula y descarga el estudio en PDF", async () => {
  await page.getByRole("link", { name: "Nuevo estudio" }).first().click();
  await expect(page.getByText("La factura se envía a un servicio de inteligencia artificial")).toBeVisible();

  await upload(INVOICE_UPLOAD, "factura-3-foto.jpg");
  await expect(page.getByRole("heading", { name: "Carmen Ibáñez Roca" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("Hay 1 dato que conviene revisar")).toBeVisible();
  await expect(page.getByText("La cifra se ve borrosa en la foto")).toBeVisible();

  // El asesor mira la factura, ve que son 160 y lo deja escrito.
  await page.getByLabel("En llano", { exact: true }).fill("160");
  await page.getByRole("button", { name: "Calcular" }).click();

  await expect(page).toHaveURL(/\/comparativa$/);
  await expect(page.getByText("Ahorro al año").first()).toBeVisible();
  await expect(page.getByText("Tarifa propuesta").first()).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Descargar PDF" }).click()]);
  expect(download.suggestedFilename()).toBe("estudio-carmen-ibanez-roca.pdf");
  expect(readFileSync(await download.path()).subarray(0, 5).toString()).toBe("%PDF-");
});

test("el estudio queda en la lista y el asesor le cambia el estado", async () => {
  await page.getByRole("link", { name: "Estudios" }).first().click();
  const row = page.getByRole("row", { name: /Carmen Ibáñez Roca/ });
  await expect(row).toContainText("Kilovatia");
  await expect(row.getByLabel("Estado del estudio")).toHaveValue("draft");

  await row.getByLabel("Estado del estudio").selectOption("sent");
  await page.reload();
  await expect(page.getByRole("row", { name: /Carmen Ibáñez Roca/ }).getByLabel("Estado del estudio")).toHaveValue("sent");
});

test("añade una tarifa a mano y otra desde el tarifario de ejemplo", async () => {
  await page.getByRole("link", { name: "Catálogo" }).click();
  await page.getByRole("link", { name: "Añadir tarifa" }).click();
  await page.getByLabel("Comercializadora", { exact: true }).fill("Albor Energía");
  await page.getByLabel("Nombre de la tarifa").fill("Negocio Fijo");
  await page.getByLabel("Precio en punta").fill("0,101");
  await page.getByLabel("Precio en valle").fill("0,031");
  await page.getByLabel("Precio", { exact: true }).fill("0,129");
  await page.getByRole("button", { name: "Guardar tarifa" }).click();
  await expect(page.getByRole("row", { name: /Albor Energía · Negocio Fijo/ })).toBeVisible();

  await page.getByRole("link", { name: "Subir tarifario" }).click();
  await upload(TARIFF_SHEET_UPLOAD, "tarifario-cierzo-electrica.pdf");
  // De las cuatro tarifas del tarifario solo valen dos: la 3.0TD y la indexada no se proponen.
  await expect(page.getByText("La IA ha encontrado 2 tarifas")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("Hay dos precios: 11,00 € es promocional")).toBeVisible();

  await page.getByRole("button", { name: "Guardar tarifa" }).first().click();
  await expect(page.getByText("Guardada en tu catálogo")).toBeVisible();
  await page.getByRole("link", { name: "Volver al catálogo" }).click();
  await expect(page.getByRole("row", { name: /Cierzo Eléctrica · Hogar 2027/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /Cierzo Eléctrica · Fin de Semana/ })).toHaveCount(0);
});

test("cambia el IVA en ajustes: un estudio nuevo lo usa y el antiguo no cambia", async () => {
  await page.getByRole("link", { name: "Ajustes" }).click();
  await page.getByLabel("IVA", { exact: true }).fill("10");
  await page.getByRole("button", { name: "Guardar impuestos y cargos" }).click();
  await expect(page.getByText("Impuestos y cargos guardados.")).toBeVisible();

  await page.getByRole("link", { name: "Nuevo estudio" }).first().click();
  await upload(INVOICE_UPLOAD, "factura-1-hogar.pdf");
  await expect(page.getByRole("heading", { name: "Marta Soler Vidal" })).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Calcular" }).click();
  await expect(page).toHaveURL(/\/comparativa$/);
  await expect(page.getByRole("row", { name: /^IVA/ })).toContainText("× 10 %");

  await page.getByRole("link", { name: "Estudios" }).first().click();
  await page.getByRole("link", { name: "Carmen Ibáñez Roca" }).click();
  await expect(page.getByRole("row", { name: /^IVA/ })).toContainText("× 21 %");
});
