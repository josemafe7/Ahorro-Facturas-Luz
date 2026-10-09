import { describe, expect, it } from "vitest";

import { createTestAdvisor } from "@/test/users";

import { createOffer, deleteOffer, getOffer, listActiveOffers, listOffers, setOfferActive, updateOffer } from "./offers";

const tariff = {
  provider: "Kilovatia",
  name: "Tarifa Única",
  powerPrice: { p1: { amount: 33, unit: "year" }, p2: { amount: 10, unit: "year" } },
  energyPrice: { kind: "single", price: 0.119 },
};

async function created(userId: string, input: unknown = tariff): Promise<string> {
  const result = await createOffer(userId, input);
  if (!result.ok) throw new Error(result.message);
  return result.value.id;
}

describe("Catálogo de tarifas", () => {
  it("T1 · el asesor ve su catálogo: comercializadora, tarifa, precios y si está activa", async () => {
    const advisor = await createTestAdvisor();
    await created(advisor.id);
    await created(advisor.id, { ...tariff, provider: "Albor Energía", name: "Hogar Fijo" });

    const catalog = await listOffers(advisor.id);

    expect(catalog.map(({ label, active }) => [label, active])).toEqual([
      ["Albor Energía · Hogar Fijo", true],
      ["Kilovatia · Tarifa Única", true],
    ]);
    expect(catalog[1].offer).toMatchObject(tariff);
  });

  it("T2 · el asesor añade, cambia y borra tarifas a mano", async () => {
    const advisor = await createTestAdvisor();
    const id = await created(advisor.id);

    const threePeriods = { ...tariff, name: "Tres Tramos", energyPrice: { kind: "periods", p1: 0.169, p2: 0.121, p3: 0.084 }, notes: "Sin permanencia" };
    expect((await updateOffer(advisor.id, id, threePeriods)).ok).toBe(true);
    expect((await getOffer(advisor.id, id))?.offer).toMatchObject(threePeriods);

    expect((await deleteOffer(advisor.id, id)).ok).toBe(true);
    expect(await listOffers(advisor.id)).toEqual([]);
  });

  it("T3 · una tarifa con un dato que falta o no es válido no se guarda, y se señala cuál", async () => {
    const advisor = await createTestAdvisor();

    const result = await createOffer(advisor.id, { ...tariff, name: " ", energyPrice: { kind: "single", price: -1 } });

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { name: "Falta el nombre de la tarifa", "energyPrice.price": "El precio no puede ser negativo" },
    });
    expect(await listOffers(advisor.id)).toEqual([]);
  });

  it("T4 · una tarifa desactivada se conserva, pero deja de entrar en las comparaciones", async () => {
    const advisor = await createTestAdvisor();
    const id = await created(advisor.id);

    await setOfferActive(advisor.id, id, false);

    expect((await listOffers(advisor.id)).map(({ active }) => active)).toEqual([false]);
    expect(await listActiveOffers(advisor.id)).toEqual([]);
  });

  it("Permisos · un asesor no ve, cambia, desactiva ni borra las tarifas de otro", async () => {
    const owner = await createTestAdvisor("Dueña");
    const other = await createTestAdvisor("Otro");
    const id = await created(owner.id);

    expect(await listOffers(other.id)).toEqual([]);
    expect(await getOffer(other.id, id)).toBeNull();
    expect((await updateOffer(other.id, id, { ...tariff, name: "Cambiada" })).ok).toBe(false);
    expect((await setOfferActive(other.id, id, false)).ok).toBe(false);
    expect((await deleteOffer(other.id, id)).ok).toBe(false);

    expect(await getOffer(owner.id, id)).toMatchObject({ active: true, label: "Kilovatia · Tarifa Única" });
  });
});
