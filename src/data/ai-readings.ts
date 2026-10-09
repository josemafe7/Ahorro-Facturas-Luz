import "server-only";

import { aiConfig } from "@/config/ai";
import { db } from "@/lib/db";

const MS_PER_HOUR = 3_600_000;

/**
 * Regla F12: apunta una lectura de IA del asesor si todavía le quedan en esta hora. Devuelve `false` si ya
 * ha llegado al límite. Se apunta antes de llamar a la IA, para que los fallos también cuenten.
 */
export async function startAiReading(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - MS_PER_HOUR);
  const used = await db.aiReading.count({ where: { userId, createdAt: { gte: since } } });
  if (used >= aiConfig.maxReadingsPerHour) return false;

  await db.aiReading.create({ data: { userId } });
  return true;
}
