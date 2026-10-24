import { expect, it } from "vitest";
import {
  BASE,
  MAX,
  MIN,
  eraAt,
  eras,
  index,
  national,
  observations,
  periodChange,
  project,
  scenarios,
  segments,
} from "./model";
it("keeps the full historical and future domain and assigns every year to an era", () => {
  expect([MIN, MAX]).toEqual([1850, 2050]);
  for (let year = MIN; year <= MAX; year++) {
    const era = eraAt(year);
    expect(year >= era.start && year <= era.end).toBe(true);
  }
  expect(eraAt(1917)).toBe(eras[0]);
  expect(eraAt(2025)).toBe(eras.at(-1));
});
it("preserves source ratios with a common baseline rather than invented impact weights", () => {
  for (const s of national) {
    expect(s.points.find((p) => p.year === BASE)?.value).toBe(100);
    const raw = observations(s.key);
    const a = raw[0]!,
      b = raw.at(-1)!;
    expect(s.points.at(-1)!.value / s.points[0]!.value).toBeCloseTo(b.value / a.value, 10);
    expect(new Set(s.points.map((p) => p.year)).size).toBe(s.points.length);
  }
  expect(() => index([{ year: 2000, value: 1 }])).toThrow();
});
it("does not bridge missing annual observations or invent a historical income series", () => {
  expect(national[1]!.points[0]!.year).toBe(1975);
  for (const s of national)
    for (const seg of segments(s.points))
      for (let i = 1; i < seg.length; i++) expect(seg[i]!.year - seg[i - 1]!.year).toBe(1);
  expect(periodChange(national[1]!.points, 1850, 1975)).toBeNull();
});
it("computes scenario totals from explicit assumptions and joins exactly at 2025", () => {
  for (const s of national)
    for (const scenario of scenarios)
      for (const rate of scenario.growth) {
        const last = s.points.at(-1)!;
        const p = project(last, rate);
        expect(p[0]).toEqual(last);
        expect(p.at(-1)!.year).toBe(MAX);
        expect(p.at(-1)!.value).toBeCloseTo(last.value * (1 + rate) ** 25, 10);
      }
  expect(project({ year: 2025, value: 200 }, 0).at(-1)!.value).toBe(200);
  expect(() => project({ year: 2024, value: 200 }, 0.01)).toThrow();
});
