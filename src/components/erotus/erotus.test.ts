import { describe, expect, it } from "vitest";
import { OBSERVABLES, sample, totalAt } from "./erotus-model";

describe("erotus", () => {
  it("total penalises obligations above resources (2026: turva 0.48 > (0.58+0.35)/2)", () => {
    expect(totalAt(2026)).toBeCloseTo((0.58 + 0.48 + 0.35) / 3 - 0.5 * (0.48 - 0.465), 5);
  });
  it("delta equals value minus total", () => {
    const s = sample(OBSERVABLES.find((o) => o.id === "ict")!, 10);
    for (const p of s) expect(p.delta).toBeCloseTo(p.value - p.total, 9);
  });
});

import { smoothLevel, factorsFor } from "./erotus-model";
describe("rounded curve and factors", () => {
  it("passes through points and eases between them", () => {
    const pts: [number, number][] = [[2000, 0], [2010, 1]];
    expect(smoothLevel(pts, 2000)).toBeCloseTo(0, 6);
    expect(smoothLevel(pts, 2010)).toBeCloseTo(1, 6);
    expect(smoothLevel(pts, 2005)).toBeCloseTo(0.5, 3);
    expect(smoothLevel(pts, 2001)).toBeLessThan(0.1);
  });
  it("ICT names the Nokia rise", () => {
    const o = OBSERVABLES.find((o) => o.id === "ict")!;
    expect(factorsFor(o, sample(o)).map((f) => f.label)).toContain("Nokia-klusterin nousu");
  });
});
