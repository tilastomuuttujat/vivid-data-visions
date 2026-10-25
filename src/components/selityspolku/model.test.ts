import { describe, expect, it } from "vitest";
import { actual, change, data, parts, reading, segments } from "./model";
describe("Selityspolun laskentapohja", () => {
  it("tunnistaa laskettujen muutosten perusteella kriisin ja eritahtisen elpymisen", () => {
    expect(reading(1993)?.title).toMatch(/supistuivat/);
    expect(reading(2000)?.title).toMatch(/elpynyt/);
    expect(reading(2050)).toBeNull();
    expect(actual("production_components", 1985)).not.toBeNull();
  });
  it("säilyttää saman julkaisun ja kaikki kolme mallia", () => {
    expect(data.release_id).toBe("32b22757-4681-433a-be8e-11d80dfb9c0a");
    expect(data.runs).toHaveLength(3);
    for (const r of data.runs) expect(new Set(r.points.map((p) => p.year)).size).toBe(176);
  });
  it("osat täsmäävät kokonaismuutokseen eivätkä eri mallien tasot summaudu", () => {
    for (const id of ["production_components", "real_income_components"]) {
      for (let y = 1990; y <= 2025; y++) {
        const a = actual(id, y)!,
          b = actual(id, 1990)!;
        expect(parts(id, y).reduce((s, p) => s + p.effect!, 0)).toBeCloseTo(a - b, 6);
      }
    }
  });
  it("ei piirrä käyrää puuttuville vuosille eikä keksi ennustetta", () => {
    for (const id of data.runs.map((r) => r.model)) {
      expect(actual(id, 1850)).toBeNull();
      expect(actual(id, 2050)).toBeNull();
      expect(
        segments(id)
          .flat()
          .every((p) => p.year <= 2025),
      ).toBe(true);
    }
    expect(actual("age_structure", 1985)).toBeNull();
  });
  it("laman työllisyysromahdusta ei selitetä ikärakenteella", () => {
    expect(change("age_structure", 1993)).toBeLessThan(-9);
    expect(parts("age_structure", 1993)[0]!.effect).toBeGreaterThan(0);
    expect(
      parts("production_components", 1993).find((p) => p.factor === "productivity")!.effect,
    ).toBeGreaterThan(0);
  });
});
