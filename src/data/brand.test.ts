import { describe, expect, it } from "vitest";

import { appConfig } from "@/config/app";
import { bytesOfSize, PDF_BYTES, PNG_BYTES } from "@/test/files";
import { createTestAdvisor } from "@/test/users";

import { getBrand, saveBrand, saveBrandLogo } from "./brand";
import { getFile } from "./files";

const brand = { businessName: "Asesoría Energética Demo", color: "#1d4ed8", phone: "600 000 000", email: "hola@asesoria-demo.test", website: "asesoria-demo.test" };

describe("La marca del asesor", () => {
  it("A3 · el asesor cambia su nombre comercial, su color y sus datos de contacto; lo no válido no se guarda", async () => {
    const advisor = await createTestAdvisor("Asesora");

    // Antes de tocar nada, su nombre y el color de la app.
    expect(await getBrand(advisor.id)).toMatchObject({ businessName: expect.stringContaining("Asesora"), color: appConfig.brand.colors.primary, logo: null });

    expect((await saveBrand(advisor.id, brand)).ok).toBe(true);
    expect(await getBrand(advisor.id)).toMatchObject({ ...brand, color: "#1D4ED8" });

    expect(await saveBrand(advisor.id, { ...brand, businessName: "", color: "verde", email: "no-es-un-correo" })).toMatchObject({
      ok: false,
      fieldErrors: { businessName: "Falta el nombre comercial", color: "Elige un color", email: "Ese correo no es válido" },
    });
    expect((await getBrand(advisor.id)).businessName).toBe(brand.businessName);
  });

  it("A4 · el logo es una imagen PNG o JPG de hasta 2 MB; cualquier otro archivo se rechaza", async () => {
    const advisor = await createTestAdvisor();
    const bigPng = bytesOfSize(3);
    bigPng.set(PNG_BYTES);

    expect(await saveBrandLogo(advisor.id, PDF_BYTES)).toMatchObject({ ok: false, message: expect.stringContaining("PNG o JPG") });
    expect(await saveBrandLogo(advisor.id, bigPng)).toMatchObject({ ok: false, message: expect.stringContaining("2 MB") });
    expect((await getBrand(advisor.id)).logo).toBeNull();

    expect((await saveBrandLogo(advisor.id, PNG_BYTES)).ok).toBe(true);
    const { logo } = await getBrand(advisor.id);
    expect(logo?.mimeType).toBe("image/png");
    // El logo anterior se borra al poner otro.
    await saveBrandLogo(advisor.id, PNG_BYTES);
    expect(await getFile(advisor.id, logo!.id)).toBeNull();
  });

  it("Permisos · la marca de un asesor no cambia la de otro", async () => {
    const owner = await createTestAdvisor("Dueña");
    const other = await createTestAdvisor("Otro");

    await saveBrand(owner.id, brand);

    expect((await getBrand(other.id)).businessName).not.toBe(brand.businessName);
  });
});
