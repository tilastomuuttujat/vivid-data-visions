import { describe, expect, it } from "vitest";
import { DECISIONS } from "./murrokset-model";
import { lensOf, project, scoreOf } from "./maisema-model";

describe("murrosmaisema", () => {
  it("maps assessment classes to direction", () => {
    expect(scoreOf({ arvioLuokka: "vahvistava" } as never)).toBe(1);
    expect(scoreOf({ arvioLuokka: "heikentava" } as never)).toBe(-1);
    expect(() => scoreOf({ arvioLuokka: "outo" } as never)).toThrow();
  });
  it("every decision has a known class and lens", () => {
    for (const d of DECISIONS) {
      expect(() => scoreOf(d)).not.toThrow();
      expect(lensOf(d.teema)).toBeTruthy();
    }
  });
  it("current scenario keeps the 2025 level", () => {
    expect(project(0.3, "nykyinen").at(-1)!.v).toBeCloseTo(0.3);
    expect(project(0.3, "heikkenee").at(-1)!.v).toBeCloseTo(-0.55);
  });
});
