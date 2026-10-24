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
