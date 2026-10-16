import { describe, it, expect } from "vitest";
import { initialData, validateData, layoutNodes, connections } from "./atlas-data";
describe("Atlas JSON", () => {
  it("loads all 32 qualitative themes without scores", () => {
    expect(initialData.themes).toHaveLength(32);
    expect(initialData.themes.every((t) => !("scores" in t))).toBe(true);
    expect(validateData(initialData).themes).toHaveLength(32);
  });
  it("rejects malformed or duplicate themes", () => {
    expect(() => validateData({ themes: [] })).toThrow();
    expect(() =>
      validateData({ themes: [initialData.themes[0], initialData.themes[0]] }),
    ).toThrow();
    expect(() =>
      validateData({
        themes: [{ ...initialData.themes[0], steps: [{ stage: 8, year: "invalid" }] }],
      }),
    ).toThrow();
  });
  it("creates deterministic positions and valid unique theme links", () => {
    expect(layoutNodes(initialData)).toEqual(layoutNodes(initialData));
    const links = connections(initialData);
    expect(links.length).toBeGreaterThan(20);
    expect(new Set(links.map((e) => e.join("-"))).size).toBe(links.length);
  });
  it("sorts shuffled stages and rejects missing or repeated stage numbers", () => {
    const theme = initialData.themes[0]!;
    const imported = validateData({
      ...initialData,
      themes: [{ ...theme, steps: [...theme.steps].reverse() }],
    });
    expect(imported.themes[0]!.steps.map((s) => s.stage)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(theme.steps.map((s) => s.stage)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(() => validateData({ themes: [{ ...theme, steps: theme.steps.slice(1) }] })).toThrow();
    expect(() =>
      validateData({ themes: [{ ...theme, steps: [...theme.steps.slice(0, 5), theme.steps[0]] }] }),
    ).toThrow();
    expect(() => validateData({ themes: [{ ...theme, group: "Tuntematon" }] })).toThrow();
    expect(() => validateData({ ...initialData, schema_version: 999 })).toThrow();
  });
});
