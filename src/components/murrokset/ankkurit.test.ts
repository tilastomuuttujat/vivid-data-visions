import { describe, expect, it } from "vitest";
import { ANCHORS, anchorLinks, validateAnchors } from "./ankkurit-model";
import { networkEdges } from "./decision-network-model";

describe("seitsemän ankkuria", () => {
  it("on täsmälleen seitsemän ja kaikki kortit löytyvät lähteestä", () => {
    expect(ANCHORS).toHaveLength(7);
    expect(() => validateAnchors()).not.toThrow();
  });
  it("ankkurikaaret perustuvat vain lähteen relaatioihin ja säilyttävät suunnan", () => {
    for (const l of anchorLinks())
      for (const e of l.edges) {
        expect(networkEdges).toContain(e);
        expect(ANCHORS.find((a) => a.id === l.from)!.nodes).toContain(e.from);
        expect(ANCHORS.find((a) => a.id === l.to)!.nodes).toContain(e.to);
      }
  });
});
