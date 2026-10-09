import "server-only";

import { aiConfig } from "@/config/ai";
import { db } from "@/lib/db";

const MS_PER_HOUR = 3_600_000;

/**
 * Regla F12: apunta una lectura de IA del asesor si todavía le quedan en esta hora. Devuelve `false` si ya
 * ha llegado al límite. Se apunta antes de llamar a la IA, para que los fallos también cuenten.
 *
 * Contar y apuntar van en una misma transacción: si no, varias peticiones a la vez verían todas el mismo
 * recuento y pasarían todas.
 */
export function startAiReading(userId: string): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const since = new Date(Date.now() - MS_PER_HOUR);
    const used = await tx.aiReading.count({ where: { userId, createdAt: { gte: since } } });
    if (used >= aiConfig.maxReadingsPerHour) return false;

    await tx.aiReading.create({ data: { userId } });
    return true;
  });
}
