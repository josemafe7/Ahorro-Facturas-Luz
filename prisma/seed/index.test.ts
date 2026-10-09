import { describe, expect, it } from "vitest";

import { getBrand } from "@/data/brand";
import { listOffers } from "@/data/offers";
import { listStudies } from "@/data/studies";
import { auth } from "@/lib/auth";

import { seedDemo } from "./index";
import { DEMO_ADVISOR } from "./users";

describe("Datos de ejemplo", () => {
  it("D1 · un solo comando deja la app lista para la demo: asesor de prueba, tarifas inventadas y estudios en distintos estados", async () => {
    const { advisorId } = await seedDemo();
    // Ejecutarlo otra vez no duplica nada.
    await seedDemo();

    const signedIn = await auth.api.signInEmail({ body: { email: DEMO_ADVISOR.email, password: DEMO_ADVISOR.password } });
    expect(signedIn.user.id).toBe(advisorId);

    const offers = await listOffers(advisorId);
    expect(offers).toHaveLength(7);
    expect(offers.filter(({ active }) => active)).toHaveLength(6);

    const studies = await listStudies(advisorId);
    expect(studies.map(({ status }) => status)).toEqual(["draft", "sent", "accepted", "contracted"]);
    expect(studies.filter(({ yearSavingsCents }) => (yearSavingsCents ?? 0) > 0)).toHaveLength(3);

    expect(await getBrand(advisorId)).toMatchObject({ businessName: "Asesoría Energética Demo", logo: { mimeType: "image/png" } });
  });
});
