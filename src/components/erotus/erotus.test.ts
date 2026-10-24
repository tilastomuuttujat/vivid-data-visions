import { describe, expect, it } from "vitest";
import { OBSERVABLES, sample, totalAt } from "./erotus-model";

describe("erotus", () => {
  it("total penalises obligations above resources (1990: turva 0.82 > (0.5+0.7)/2)", () => {
    const mean = (0.5 + 0.82 + 0.7) / 3;
    expect(totalAt(1990)).toBeCloseTo(mean - 0.5 * (0.82 - 0.6), 5);
  });
  it("delta equals value minus total", () => {
    const s = sample(OBSERVABLES.find((o) => o.id === "ict")!, 10);
    for (const p of s) expect(p.delta).toBeCloseTo(p.value - p.total, 9);
  });
});
