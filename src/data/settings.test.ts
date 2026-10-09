import { describe, expect, it } from "vitest";

import { sector } from "@/sectors";
import { createTestAdvisor } from "@/test/users";

import { getSettings, saveSettings } from "./settings";

describe("Ajustes de impuestos y cargos", () => {
  it("A1 · el asesor cambia sus impuestos y cargos, y un valor no válido no se guarda", async () => {
    const advisor = await createTestAdvisor();
    const changed = { ...sector.defaultSettings, vatPercent: 10, electricityTaxPercent: 0.5 };

    expect((await saveSettings(advisor.id, changed)).ok).toBe(true);
    expect(await getSettings(advisor.id)).toEqual(changed);

    const rejected = await saveSettings(advisor.id, { ...changed, vatPercent: 121 });
    expect(rejected).toMatchObject({ ok: false, fieldErrors: { vatPercent: "IVA: no puede pasar de 100" } });
    expect(await getSettings(advisor.id)).toEqual(changed);
  });

  it("Permisos · los ajustes de un asesor no cambian los de otro", async () => {
    const owner = await createTestAdvisor("Dueña");
    const other = await createTestAdvisor("Otro");

    await saveSettings(owner.id, { ...sector.defaultSettings, vatPercent: 10 });

    expect(await getSettings(other.id)).toEqual(sector.defaultSettings);
  });
});
