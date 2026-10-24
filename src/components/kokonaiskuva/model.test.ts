import { expect, it } from "vitest";
import { MIN, MAX, eraAt, eras } from "./model";
it("keeps every year on the complete 1850–2050 timeline in an editorial era", () => {
  expect([MIN, MAX]).toEqual([1850, 2050]);
  for (let year = MIN; year <= MAX; year++) {
    const era = eraAt(year);
    expect(year >= era.start && year <= era.end).toBe(true);
  }
  expect(eraAt(1917)).toBe(eras[0]);
  expect(eraAt(2025)).toBe(eras.at(-1));
});
