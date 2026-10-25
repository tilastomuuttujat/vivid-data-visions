import { describe, expect, it } from "vitest";
import { employmentSeries, fiscalSeries, hasMeasured, periodFor } from "./Measured";

describe("mitattu näyttö", () => {
  it("julkinen talous vain 1975–2025, ei tulevaisuutta", () => {
    const s = fiscalSeries("balance_pct");
    expect(Math.min(...s.map((p) => p.year))).toBeGreaterThanOrEqual(1975);
    expect(Math.max(...s.map((p) => p.year))).toBeLessThanOrEqual(2025);
  });
  it("käänne 1991 kuuluu jaksoon 1976", () => expect(periodFor(1991).start).toBe("1976"));
  it("velka ja koulu kytkeytyvät, ICT ei", () => {
    expect(hasMeasured("velka")).toBe(true);
    expect(hasMeasured("koulu")).toBe(true);
    expect(hasMeasured("ict")).toBe(false);
  });
  it("koulutusryhmien työllisyys 2010–2024", () => expect(employmentSeries("9").length).toBeGreaterThan(10));
});
