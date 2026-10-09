import { seedOffers } from "./offers";
import { seedBrand, seedStudies } from "./studies";
import { createUser, DEMO_ADVISOR } from "./users";

/**
 * Regla D1: deja la app lista para la demo. Un asesor de prueba con su marca, tarifas de comercializadoras
 * inventadas y varios estudios en distintos estados. Se puede ejecutar las veces que haga falta: lo que ya
 * existe no se duplica.
 */
export async function seedDemo(): Promise<{ advisorId: string }> {
  const advisor = await createUser(DEMO_ADVISOR);
  await seedOffers(advisor.id);
  await seedBrand(advisor.id);
  await seedStudies(advisor.id);
  return { advisorId: advisor.id };
}
