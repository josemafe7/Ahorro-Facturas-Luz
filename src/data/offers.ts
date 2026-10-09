import "server-only";

import type { CatalogOffer } from "@/engine/compare";
import { db } from "@/lib/db";
import { invalid, parseJson, type Result } from "@/lib/result";
import { sector, type SectorOffer } from "@/sectors";

/** Una oferta del catálogo, tal como la necesitan las pantallas. */
export type OfferRow = {
  id: string;
  active: boolean;
  /** «Comercializadora · Tarifa» */
  label: string;
  offer: SectorOffer;
};

/** El mismo mensaje si no existe y si es de otro asesor: no se revela cuál de las dos. */
export const NOT_FOUND: Result<never> = { ok: false, message: "No existe o no es tuya." };

function toRow(row: { id: string; active: boolean; data: string }): OfferRow | null {
  const parsed = sector.offerSchema.safeParse(parseJson(row.data));
  if (!parsed.success) return null;
  return { id: row.id, active: row.active, label: sector.offerLabel(parsed.data), offer: parsed.data };
}

/** Regla T1: todo el catálogo del asesor, por orden alfabético. */
export async function listOffers(userId: string): Promise<OfferRow[]> {
  const rows = await db.offer.findMany({
    where: { userId, sector: sector.id },
    select: { id: true, active: true, data: true },
  });
  return rows
    .map(toRow)
    .filter((row) => row !== null)
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}

/** Regla T4: solo las activas entran en las comparaciones. */
export async function listActiveOffers(userId: string): Promise<CatalogOffer<SectorOffer>[]> {
  const offers = await listOffers(userId);
  return offers.filter(({ active }) => active).map(({ id, offer }) => ({ id, offer }));
}

export async function getOffer(userId: string, id: string): Promise<OfferRow | null> {
  const row = await db.offer.findFirst({
    where: { id, userId, sector: sector.id },
    select: { id: true, active: true, data: true },
  });
  return row ? toRow(row) : null;
}

/** Reglas T2 y T3: guarda una tarifa nueva si es válida. */
export async function createOffer(userId: string, input: unknown): Promise<Result<{ id: string }>> {
  const parsed = sector.offerSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { id } = await db.offer.create({
    data: { userId, sector: sector.id, data: JSON.stringify(parsed.data) },
    select: { id: true },
  });
  return { ok: true, value: { id } };
}

export async function updateOffer(userId: string, id: string, input: unknown): Promise<Result<{ id: string }>> {
  const parsed = sector.offerSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { count } = await db.offer.updateMany({
    where: { id, userId, sector: sector.id },
    data: { data: JSON.stringify(parsed.data) },
  });
  return count === 0 ? NOT_FOUND : { ok: true, value: { id } };
}

export async function setOfferActive(userId: string, id: string, active: boolean): Promise<Result<{ id: string }>> {
  const { count } = await db.offer.updateMany({ where: { id, userId, sector: sector.id }, data: { active } });
  return count === 0 ? NOT_FOUND : { ok: true, value: { id } };
}

export async function deleteOffer(userId: string, id: string): Promise<Result<{ id: string }>> {
  const { count } = await db.offer.deleteMany({ where: { id, userId, sector: sector.id } });
  return count === 0 ? NOT_FOUND : { ok: true, value: { id } };
}
