import { expect, it } from "vitest";
import { SUBLINES, LINES } from "@/components/kaari/kaari-model";
import { MAX_THEMES, THEMES, addTheme, themeArc } from "./teema-model";

it("has nine sub-streams, three under each force", () => {
  expect(SUBLINES).toHaveLength(9);
  for (const l of LINES) expect(SUBLINES.filter((s) => s.parent === l.id)).toHaveLength(3);
});

it("allows at most six themes in the chart", () => {
  let ids: number[] = [];
  for (const t of THEMES) ids = addTheme(ids, t.id);
  expect(ids).toHaveLength(MAX_THEMES);
});

it("keeps every theme arc in time order", () => {
  for (const t of THEMES) {
    const xs = themeArc(t).map((p) => p.x);
    for (let i = 1; i < xs.length; i++) expect(xs[i]!).toBeGreaterThan(xs[i - 1]!);
  }
});
