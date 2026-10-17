import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ANCHORS } from "./ankkurit-model";
import { networkEdges, networkNodes, isScenario } from "./decision-network-model";
import { anchorShares } from "./anchor-shares-model";
import { AnchorShares } from "./AnchorShares";

describe("anchor percentage profiles", () => {
  it("partitions every touching source relation exactly once without weighting confidence", () => {
    for (const anchor of ANCHORS) {
      const result = anchorShares(anchor.id),
        own = new Set(anchor.nodes);
      const count = networkEdges.filter((e) => own.has(e.from) || own.has(e.to)).length;
      expect(
        result.distributions.reduce((s, d) => s + d.total, 0) +
          result.internal +
          result.undatedIncoming +
          result.undatedOutgoing +
          result.scenarioIncoming,
      ).toBe(count);
      for (const d of result.distributions) {
        expect(d.groups.reduce((s, g) => s + g.count, 0)).toBe(d.total);
        expect(d.factors.reduce((s, g) => s + g.count, 0)).toBe(d.total);
        expect(d.groups.reduce((s, g) => s + g.percent, 0)).toBeCloseTo(d.total ? 100 : 0, 10);
        expect(new Set(d.groups.flatMap((g) => g.edges.map((e) => e.id))).size).toBe(d.total);
        for (const f of d.factors) expect(f.percent).toBeCloseTo((f.count / d.total) * 100, 10);
      }
    }
  });
  it("separates historical targets, future scenarios, internal edges and duplicate representations", () => {
    const own = ANCHORS[0]!.nodes[0]!,
      old = networkNodes.find(
        (n) => n.yearStart != null && !isScenario(n) && !ANCHORS[0]!.nodes.includes(n.id),
      )!.id;
    const future = networkNodes.find(isScenario)!.id;
    const edge = networkEdges[0]!;
    const incoming = { ...edge, id: "in", from: old, to: own };
    const result = anchorShares("a1", [
      incoming,
      incoming,
      { ...edge, id: "out", from: own, to: old },
      { ...edge, id: "future", from: own, to: future },
      { ...edge, id: "internal", from: own, to: ANCHORS[0]!.nodes[1]! },
    ]);
    expect(result.distributions.map((d) => d.total)).toEqual([1, 1, 1]);
    expect(result.internal).toBe(1);
    expect(
      anchorShares("a1", []).distributions.every((d) => d.total === 0 && d.groups.length === 0),
    ).toBe(true);
  });
  it("labels the denominator and exposes original source IDs for a selected distribution", () => {
    const result = anchorShares("a7");
    const { container } = render(<AnchorShares ids={["a7"]} />);
    expect(screen.getByText(/ei mitattua vaikutusosuutta/)).toBeInTheDocument();
    const first = container.querySelector(".asp-cell button") as HTMLButtonElement;
    fireEvent.click(first);
    const firstDistribution = result.distributions.find((d) => d.total > 0)!;
    expect(
      screen.getByText(new RegExp(`Nimittäjä: ${firstDistribution.total} yksilöllistä`)),
    ).toBeInTheDocument();
    expect(container.textContent).toContain(firstDistribution.factors[0]!.edges[0]!.id);
    fireEvent.click(screen.getByText("Sulje prosenttijakauman tiedot"));
    expect(screen.queryByText(/Nimittäjä:/)).toBeNull();
  });
  it("does not show a chart when every anchor is cleared", () => {
    const { container } = render(<AnchorShares ids={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
