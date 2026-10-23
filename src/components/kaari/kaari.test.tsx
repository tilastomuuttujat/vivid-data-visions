import { expect, it } from "vitest";
import { LINES, TURNS, episodeFor } from "./kaari-model";

it("has three force lines and seven turning points", () => {
  expect(LINES).toHaveLength(3);
  expect(TURNS).toHaveLength(7);
});

it("ties every turning point to an exported evidence episode and known lines", () => {
  for (const t of TURNS) {
    expect(episodeFor(t)).toBeDefined();
    for (const id of t.lines) expect(LINES.some((l) => l.id === id)).toBe(true);
  }
});
