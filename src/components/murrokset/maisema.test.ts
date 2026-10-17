import { describe, expect, it } from "vitest";
import { DECISIONS } from "./murrokset-model";
import { ANCHORS } from "./ankkurit-model";
import { anchorTimeline } from "./anchor-timeline-model";
import { networkEdges, linkedDecisions } from "./decision-network-model";
import {
  focusLandscape,
  landscapeAnchors,
  landscapeLinks,
  landscapeX,
  matchesLens,
  nodeLenses,
  themeLenses,
} from "./maisema-model";

describe("source-directed compact landscape", () => {
  it("places all seven groups by their editorial time interval, never an assessment score", () => {
    const anchors = landscapeAnchors();
    expect(anchors).toHaveLength(7);
    for (const a of anchors) expect(a.x).toBe(landscapeX((a.from + a.to) / 2));
    expect(new Set(anchors.map((a) => a.y)).size).toBeGreaterThan(1);
  });
  it("bundles exactly the inter-anchor relations from the systemic timeline, retaining IDs and direction", () => {
    const bundles = landscapeLinks();
    const edges = bundles.flatMap((l) => l.edges);
    expect(new Set(edges.map((e) => e.id))).toEqual(
      new Set(anchorTimeline(null).edges.map((e) => e.id)),
    );
    expect(edges).toHaveLength(new Set(edges.map((e) => e.id)).size);
    for (const link of bundles)
      for (const e of link.edges) {
        expect(networkEdges).toContain(e);
        expect(ANCHORS.find((a) => a.id === link.from)!.nodes).toContain(e.from);
        expect(ANCHORS.find((a) => a.id === link.to)!.nodes).toContain(e.to);
      }
  });
  it("keeps the same directed one- and two-step relations as the full timeline", () => {
    for (const anchor of ANCHORS)
      for (const direction of ["all", "incoming", "outgoing"] as const)
        for (const depth of [1, 2] as const) {
          const model = anchorTimeline(anchor.id, direction, depth),
            placed = focusLandscape(model);
          expect(placed.edges).toEqual(
            model.edges.filter((e) => placed.positions.has(e.from) && placed.positions.has(e.to)),
          );
          for (const n of placed.nodes) expect(n.x).toBe(placed.x(n.node.yearStart!));
          expect(placed.nodes.some((n) => n.role === "context")).toBe(false);
          expect(new Set(placed.nodes.map((n) => n.node.id)).size).toBe(placed.nodes.length);
        }
  });
  it("highlights composite source themes through explicit mappings without guessing missing ones", () => {
    expect(themeLenses("Koulutus ja asuminen")).toEqual(
      expect.arrayContaining(["osaaminen", "alueet"]),
    );
    expect(themeLenses("Tuntematon teema")).toEqual([]);
    for (const d of DECISIONS) expect(themeLenses(d.teema).length).toBeGreaterThan(0);
    for (const a of ANCHORS)
      for (const id of a.nodes) {
        expect(nodeLenses(id)).toEqual(
          new Set(linkedDecisions(id).flatMap((d) => themeLenses(d.teema))),
        );
      }
    expect(nodeLenses("no-source-counterpart").size).toBe(0);
    expect(matchesLens(["no-source-counterpart"], new Set(["terveys"]))).toBe(false);
    expect(matchesLens(["no-source-counterpart"], new Set())).toBe(true);
  });
});
