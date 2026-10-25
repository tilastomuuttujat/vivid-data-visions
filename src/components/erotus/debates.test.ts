import { describe, expect, it } from "vitest";
import { DEBATES, costAt } from "./debates";
import { OBSERVABLES, impactAt } from "./erotus-model";

describe("debates", () => {
  it("every debate pairs two distinct existing factors", () => {
    const ids = new Set(OBSERVABLES.map((o) => o.id));
    for (const d of DEBATES) { expect(ids.has(d.a)).toBe(true); expect(ids.has(d.b)).toBe(true); expect(d.a).not.toBe(d.b); }
  });
});

describe("sopeutus-debatti", () => {
  const d = DEBATES.find((x) => x.id === "sopeutus")!;
  const prod = OBSERVABLES.find((o) => o.id === d.a)!;
  const net = (yr: number) => impactAt(prod, yr) - costAt(d.bCostPoints!, yr);
  it("lukee korjauskustannuksen kokonaisuuden rasitteeksi", () => {
    expect(d.a).toBe("tuottavuus");
    expect(d.bAsCost).toBe(true);
  });
  it("tuottavuushyöty ylittää kustannuksen 1900-luvulla", () => {
    for (const yr of [1960, 1970, 1980, 1990]) expect(net(yr)).toBeGreaterThan(0.05);
  });
  it("korjauskustannus ylittää hyödyn 2010-luvulta alkaen", () => {
    for (const yr of [2012, 2015, 2020, 2025]) expect(net(yr)).toBeLessThan(0);
  });
});
