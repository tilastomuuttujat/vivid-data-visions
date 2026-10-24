import { expect, it } from "vitest";
import {
  ageData,
  allocated,
  assess,
  FIRST,
  LAST,
  futureProfiles,
  historic,
  profile,
  views,
} from "./age-effect";
it("reconciles all age counts to both official totals, and all effects to the whole", () => {
  for (const baseYear of [FIRST, 1995, 2000, 2010])
    for (const row of ageData.rows.filter((r) => r.year >= baseYear)) {
      expect(row.population.reduce((a, b) => a + b, 0)).toBe(row.totalPopulation);
      expect(row.employed.reduce((a, b) => a + b, 0)).toBe(row.totalEmployed);
      const result = assess(profile(row.year), profile(baseYear));
      const baseline = assess(profile(baseYear), profile(baseYear)).actual;
      expect(result.actual).toBeCloseTo((100 * row.totalEmployed) / row.totalPopulation, 10);
      expect(result.parts.reduce((a, b) => a + b, 0)).toBeCloseTo(result.effect, 10);
      expect(views.slice(1).reduce((sum, v) => sum + allocated(result.parts, v.id), 0)).toBeCloseTo(
        result.effect,
        10,
      );
      expect(result.effect + (result.reference - baseline)).toBeCloseTo(
        result.actual - baseline,
        10,
      );
    }
});
it("isolates the known composition shift in a synthetic two-age population", () => {
  const base = { year: 2000, weights: [0.5, 0.5], rates: [0.8, 0.2] };
  const result = assess({ year: 2001, weights: [0.25, 0.75], rates: [0.8, 0.2] }, base);
  expect(result.actual).toBeCloseTo(35);
  expect(result.reference).toBeCloseTo(50);
  expect(result.effect).toBeCloseTo(-15);
  expect(result.parts).toEqual([-7.5, -7.5]);
  const equal = assess({ year: 2001, weights: [0.25, 0.75], rates: [1, 1] }, base);
  expect(equal.effect).toBe(0);
  expect(() => profile(1850)).toThrow();
  expect(() => assess({ ...base, weights: [0.3, 0.3] }, base)).toThrow();
});
it("reproduces the source-based 2024 result and has zero baseline difference", () => {
  const rows = historic(1987);
  expect(rows[0]!.effect).toBe(0);
  expect(rows.at(-1)!.actual).toBeCloseTo(42.99938732828824, 9);
  expect(rows.at(-1)!.reference).toBeCloseTo(46.37308504665289, 9);
  expect(rows.at(-1)!.effect).toBeCloseTo(-3.373697718364646, 9);
});
it("joins scenarios at the exact latest source point and keeps future profiles valid", () => {
  for (const mode of ["fixed", "continue"]) {
    const future = futureProfiles(mode);
    expect(future[0]!.year).toBe(LAST);
    expect(future.at(-1)!.year).toBe(2050);
    for (const baseYear of [1987, 1995, 2000, 2010]) {
      const base = profile(baseYear);
      const first = assess(future[0]!, base),
        source = assess(profile(LAST), base);
      expect(first.actual).toBeCloseTo(source.actual, 10);
      expect(first.reference).toBeCloseTo(source.reference, 10);
      for (const p of future) {
        expect(p.weights.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
        expect(p.rates).toEqual(profile(LAST).rates);
        const r = assess(p, base);
        for (const v of [r.actual, r.reference]) {
          expect(v).toBeGreaterThanOrEqual(30);
          expect(v).toBeLessThanOrEqual(55);
        }
      }
    }
  }
  expect(futureProfiles("fixed").at(-1)!.weights).toEqual(futureProfiles("fixed")[0]!.weights);
});
