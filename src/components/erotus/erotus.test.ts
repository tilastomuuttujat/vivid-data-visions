import { describe, expect, it } from "vitest";
import { OBSERVABLES, sample, totalAt, smoothLevel, factorsFor } from "./erotus-model";

const ob = (id: string) => OBSERVABLES.find((o) => o.id === id)!;
const at = (id: string, yr: number) => sample(ob(id)).find((p) => p.year === yr)!;

describe("erotus", () => {
  it("total penalises obligations above resources (2026: turva 0.48 > (0.58+0.35)/2)", () => {
    expect(totalAt(2026)).toBeCloseTo((0.58 + 0.48 + 0.35) / 3 - 0.5 * (0.48 - 0.465), 5);
  });
  it("baseline equals total minus the factor's impact", () => {
    for (const p of sample(ob("ict"), 10)) expect(p.value).toBeCloseTo(p.total - p.delta, 9);
  });
  it("ICT has no impact on the whole before it existed (1860–1950)", () => {
    for (const yr of [1860, 1900, 1950]) expect(Math.abs(at("ict", yr).delta)).toBeLessThan(0.01);
  });
  it("ICT lifts the whole around 2000", () => {
    expect(at("ict", 2000).delta).toBeGreaterThan(0.05);
  });
  it("age structure lifts the whole ~1980 and weighs it down by 2050", () => {
    expect(at("huoltosuhde", 1980).delta).toBeGreaterThan(0);
    expect(at("huoltosuhde", 2050).delta).toBeLessThan(0);
  });
});

describe("rounded curve and factors", () => {
  it("passes through points and eases between them", () => {
    const pts: [number, number][] = [[2000, 0], [2010, 1]];
    expect(smoothLevel(pts, 2000)).toBeCloseTo(0, 6);
    expect(smoothLevel(pts, 2010)).toBeCloseTo(1, 6);
    expect(smoothLevel(pts, 2005)).toBeCloseTo(0.5, 3);
    expect(smoothLevel(pts, 2001)).toBeLessThan(0.1);
  });
  it("age structure factor explains the demographic dividend", () => {
    expect(factorsFor(ob("huoltosuhde"), sample(ob("huoltosuhde"))).map((f) => f.label)).toContain("Demografinen osinko");
  });
});

import { readShadow } from "./Erotus";
describe("varjon luenta", () => {
  it("hyöty on kannatustyyny, ilman sitä putoaisi", () => { expect(readShadow("X", 0.18)).toContain("+18"); expect(readShadow("X", 0.18)).toContain("putoaisi"); });
  it("kustannus on painolasti, ilman sitä nousisi", () => { expect(readShadow("X", -0.08)).toContain("−8"); expect(readShadow("X", -0.08)).toContain("nousisi"); });
});
