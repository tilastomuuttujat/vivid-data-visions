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

describe("kytkentä pääkäyrään", async () => {
  const { linkedSample, factors } = await import("./model");
  const flat = () => 0.5;
  it("ennen vertailuvuotta ja aineiston jälkeen vaikutus on nolla", () => {
    const s = linkedSample("productivity", 1975, flat, 1850, 2050);
    expect(s[0]!.delta).toBe(0);
    expect(s.find((p) => p.year === 1975)!.delta).toBeCloseTo(0, 12);
    expect(s.at(-1)!.delta).toBe(0);
    expect(s.length).toBe(201);
  });
  it("kolmen tekijän vaikutukset summautuvat BKT/asukas-muutokseen skaalattuna", () => {
    const yr = (points as { year: number }[]).at(-1)!.year;
    const sum = factors.reduce((a, f) => a + linkedSample(f.id, 1975, flat, 1850, 2050).find((p) => p.year === yr)!.share, 0);
    const d = decompose(points, 1975).at(-1)!;
    expect(sum).toBeCloseTo((d.actual - d.baseTotal) / d.baseTotal, 9);
  });
});
