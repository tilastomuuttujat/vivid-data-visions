import { describe, expect, it } from "vitest";
import { contribution, decompose, factors, series, vintages } from "./model";
describe("evidence-based income decomposition", () => {
  it("reconciles every available household, vintage and base period including rounding", () => {
    for (const v of vintages)
      for (const p of v.profiles)
        for (const base of p.points)
          for (const point of p.points) {
            expect(decompose(base, point).reduce((sum, part) => sum + part.value, 0)).toBe(
              point.net - base.net,
            );
            for (const f of factors)
              expect(
                series(p.points, base.year, f.id).every(
                  (row) => row.net - row.comparison === row.contribution,
                ),
              ).toBe(true);
          }
  });
  it("isolates the single-parent income decline without calling gross income growth a benefit cut", () => {
    const p = vintages
      .find((v) => v.id === "2025")!
      .profiles.find((p) => p.id === "single-parent")!;
    const base = p.points.find((p) => p.year === 2023)!;
    const end = p.points.find((p) => p.year === 2025)!;
    expect(end.net - base.net).toBe(-110);
    expect(contribution(base, end, "transfers")).toBe(-250);
    expect(contribution(base, end, "gross")).toBe(139);
    expect(contribution(base, end, "taxes")).toBe(1);
    expect(series(p.points, 2023, "transfers").at(-1)!.comparison).toBe(2740);
  });
  it("rejects absent baselines rather than manufacturing observations", () => {
    expect(() => series(vintages[0]!.profiles[0]!.points, 2021, "gross")).toThrow();
  });
});
