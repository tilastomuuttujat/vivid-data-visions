import { describe, expect, it } from "vitest";
import { decompose, points, shapley3, BASELINES } from "./model";

describe("tuotannon Shapley-hajotelma", () => {
  it("osatekijät summautuvat täsmälleen kokonaismuutokseen joka vuodelle ja vertailuvuodelle", () => {
    for (const b of BASELINES)
      for (const p of decompose(points, b))
        expect(p.parts[0] + p.parts[1] + p.parts[2]).toBeCloseTo(p.actual - p.baseTotal, 6);
  });
  it("vertailuvuonna kaikki osuudet ovat nolla", () => {
    expect(decompose(points, 1990)[0]!.parts).toEqual([0, 0, 0]);
  });
  it("symmetria: vain yhden tekijän muutos kohdistuu kokonaan sille", () => {
    const [a, b2, c] = shapley3([2, 3, 4], [5, 3, 4]);
    expect(a).toBeCloseTo(36);
    expect(b2).toBe(0);
    expect(c).toBe(0);
  });
});
