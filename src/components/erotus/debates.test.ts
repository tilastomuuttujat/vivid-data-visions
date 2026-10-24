import { describe, expect, it } from "vitest";
import { DEBATES } from "./debates";
import { OBSERVABLES } from "./erotus-model";

describe("debates", () => {
  it("every debate pairs two distinct existing factors", () => {
    const ids = new Set(OBSERVABLES.map((o) => o.id));
    for (const d of DEBATES) { expect(ids.has(d.a)).toBe(true); expect(ids.has(d.b)).toBe(true); expect(d.a).not.toBe(d.b); }
  });
});
