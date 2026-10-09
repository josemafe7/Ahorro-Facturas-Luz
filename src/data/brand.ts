import "server-only";

import { z } from "zod";

import { appConfig } from "@/config/app";
import { db } from "@/lib/db";
import { invalid, type Result } from "@/lib/result";

import { deleteFile, LOGO_UPLOAD, saveUpload, type StoredFileRef } from "./files";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Como mucho ${max} caracteres`)
    .transform((value) => value || undefined)
    .optional();

/** La marca del asesor: lo que sale en el PDF del estudio (regla A3). */
export const brandSchema = z.object({
  businessName: z.string().trim().min(1, "Falta el nombre comercial").max(80, "Como mucho 80 caracteres"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Elige un color"),
  phone: optionalText(30),
  email: z
    .union([z.literal(""), z.email("Ese correo no es válido")])
    .transform((value) => value || undefined)
    .optional(),
  website: optionalText(120),
});

export type BrandData = z.infer<typeof brandSchema>;
export type AdvisorBrand = BrandData & { logo: StoredFileRef | null };

/**
 * La marca del asesor. Si todavía no la ha puesto, su nombre y el color de la app: el estudio sale con buen
 * aspecto desde el primer día.
 */
export async function getBrand(userId: string): Promise<AdvisorBrand> {
  const brand = await db.advisorBrand.findUnique({
    where: { userId },
    select: { businessName: true, color: true, phone: true, email: true, website: true, logo: { select: { id: true, mimeType: true } } },
  });
  if (brand) {
    return {
      businessName: brand.businessName,
      color: brand.color,
      phone: brand.phone ?? undefined,
      email: brand.email ?? undefined,
      website: brand.website ?? undefined,
      logo: brand.logo,
    };
  }

  const user = await db.user.findUnique({ where: { id: userId }, select: { name: true } });
  return { businessName: user?.name ?? appConfig.brand.name, color: appConfig.brand.colors.primary, logo: null };
}

/** Regla A3: guarda el nombre comercial, el color y los datos de contacto. */
export async function saveBrand(userId: string, input: unknown): Promise<Result<BrandData>> {
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { businessName, color, phone = null, email = null, website = null } = parsed.data;
  const data = { businessName, color: color.toUpperCase(), phone, email, website };
  await db.advisorBrand.upsert({ where: { userId }, create: { userId, ...data }, update: data });
  return { ok: true, value: parsed.data };
}

/** Regla A4: pone el logo del asesor, en PNG o JPG de hasta 2 MB, y borra el que hubiera. */
export async function saveBrandLogo(userId: string, bytes: Uint8Array): Promise<Result<StoredFileRef>> {
  const upload = await saveUpload(userId, bytes, LOGO_UPLOAD);
  if (!upload.ok) return upload;

  const current = await getBrand(userId);
  const { businessName, color } = current;
  await db.advisorBrand.upsert({
    where: { userId },
    create: { userId, businessName, color, logoFileId: upload.value.id },
    update: { logoFileId: upload.value.id },
  });
  if (current.logo) await deleteFile(userId, current.logo.id);
  return upload;
}

export async function removeBrandLogo(userId: string): Promise<void> {
  const { logo } = await getBrand(userId);
  if (!logo) return;
  await db.advisorBrand.update({ where: { userId }, data: { logoFileId: null } });
  await deleteFile(userId, logo.id);
}
