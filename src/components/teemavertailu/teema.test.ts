import { expect, it } from "vitest";
import { SUBLINES, LINES } from "@/components/kaari/kaari-model";
import { MAX_THEMES, THEMES, addTheme, themeArc } from "./teema-model";

it("keeps sub-streams unique and linked to an existing force, with every force represented", () => {
  expect(SUBLINES.length).toBeGreaterThan(0);
  expect(new Set(SUBLINES.map((s) => s.id)).size).toBe(SUBLINES.length);
  const forceIds = new Set(LINES.map((l) => l.id));
  for (const s of SUBLINES) expect(forceIds.has(s.parent)).toBe(true);
  for (const l of LINES) expect(SUBLINES.some((s) => s.parent === l.id)).toBe(true);
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
