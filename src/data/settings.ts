import "server-only";

import { db } from "@/lib/db";
import { invalid, parseJson, type Result } from "@/lib/result";
import { sector, type SectorSettings } from "@/sectors";

/**
 * Los impuestos y cargos con los que calcula un asesor. Si todavía no ha cambiado ninguno, los de inicio
 * del sector (regla A2).
 */
export async function getSettings(userId: string): Promise<SectorSettings> {
  const row = await db.sectorSettings.findUnique({
    where: { userId_sector: { userId, sector: sector.id } },
    select: { data: true },
  });
  if (!row) return sector.defaultSettings;

  const stored = sector.settingsSchema.safeParse(parseJson(row.data));
  return stored.success ? stored.data : sector.defaultSettings;
}

/** Regla A1: guarda los ajustes del asesor. Un valor no válido no se guarda. */
export async function saveSettings(userId: string, input: unknown): Promise<Result<SectorSettings>> {
  const parsed = sector.settingsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const data = JSON.stringify(parsed.data);
  await db.sectorSettings.upsert({
    where: { userId_sector: { userId, sector: sector.id } },
    create: { userId, sector: sector.id, data },
    update: { data },
  });
  return { ok: true, value: parsed.data };
}
