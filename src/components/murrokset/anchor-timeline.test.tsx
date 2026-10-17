import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { afterEach, expect, it, vi } from "vitest";
import { AnchorTimeline } from "./AnchorTimeline";
import { DecisionExplorer } from "./DecisionExplorer";
import { ANCHORS, anchorOf } from "./ankkurit-model";
import { anchorTimeline, layoutAnchorTimeline, traceRelations } from "./anchor-timeline-model";
import {
  decisionMappings,
  networkEdges,
  networkNode,
  type NetworkEdge,
} from "./decision-network-model";

afterEach(cleanup);
const edge = (id: string, from: string, to: string) =>
  ({ ...networkEdges[0]!, id, from, to }) as NetworkEdge;

it("traces directed paths by actual node, terminates cycles and never invents shortcut edges", () => {
  const edges = [
    edge("ab", "a", "b"),
    edge("bc", "b", "c"),
    edge("ca", "c", "a"),
    edge("db", "d", "b"),
  ];
  expect(traceRelations(["a"], "outgoing", 1, edges).edges.map((e) => e.id)).toEqual(["ab"]);
  expect(traceRelations(["a"], "outgoing", 2, edges).edges.map((e) => e.id)).toEqual(["ab", "bc"]);
  expect(traceRelations(["a"], "outgoing", 2, edges).distances.get("c")).toBe(2);
  expect(traceRelations(["a"], "outgoing", 9, edges).edges.map((e) => e.id)).toEqual([
    "ab",
    "bc",
    "ca",
  ]);
  expect(traceRelations(["a"], "incoming", 1, edges).edges.map((e) => e.id)).toEqual(["ca"]);
});
it("keeps overview links source-backed and strictly between different anchors", () => {
  const overview = anchorTimeline(null);
  expect(overview.edges.length).toBeGreaterThan(0);
  for (const e of overview.edges) {
    expect(networkEdges).toContain(e);
    expect(anchorOf(e.from)).toBeTruthy();
    expect(anchorOf(e.to)).toBeTruthy();
    expect(anchorOf(e.from)).not.toBe(anchorOf(e.to));
  }
});
it("retains every direct relation, including internal and undated endpoints, and limits depth", () => {
  for (const a of ANCHORS) {
    const direct = anchorTimeline(a.id);
    expect(new Set(direct.edges.map((e) => e.id))).toEqual(
      new Set(
        networkEdges
          .filter((e) => a.nodes.includes(e.from) || a.nodes.includes(e.to))
          .map((e) => e.id),
      ),
    );
    const expanded = anchorTimeline(a.id, "all", 2);
    for (const e of direct.edges) expect(expanded.edges).toContain(e);
    expect(expanded.nodes.every((n) => n.distance == null || n.distance <= 2)).toBe(true);
  }
});
it("positions real source years without clamping them to the editorial anchor interval", () => {
  for (const id of [null, ...ANCHORS.map((a) => a.id)]) {
    const model = anchorTimeline(id, "all", 2),
      layout = layoutAnchorTimeline(model);
    for (const n of layout.nodes) {
      expect(n.x).toBe(layout.x(n.node.yearStart!));
      expect(Number.isFinite(n.y)).toBe(true);
      expect(n.x).toBeGreaterThanOrEqual(250);
      expect(n.x).toBeLessThan(layout.width - 100);
    }
    for (const e of layout.edges) {
      expect(layout.positions.has(e.from)).toBe(true);
      expect(layout.positions.has(e.to)).toBe(true);
    }
    expect(layout.lanes.filter((l) => l.id.startsWith("a"))).toHaveLength(7);
    const ys = ANCHORS.map((a) => layout.lanes.find((l) => l.id === a.id)!.top);
    expect(new Set(ys).size).toBe(7);
  }
});
it("preserves undated connections in text while omitting them from chart geometry", () => {
  const model = anchorTimeline("a4");
  const undated = {
    ...model.nodes[0]!,
    node: { ...model.nodes[0]!.node, yearStart: null as unknown as number },
  };
  const layout = layoutAnchorTimeline({ ...model, nodes: [undated, ...model.nodes.slice(1)] });
  expect(layout.undated).toHaveLength(1);
  expect(layout.positions.has(undated.node.id)).toBe(false);
  expect(model.edges.length).toBeGreaterThanOrEqual(layout.edges.length);
});

it("offers overview and filtered two-step paths, then returns cleanly to overview", () => {
  const { container } = render(<AnchorTimeline onExplore={vi.fn()} />);
  expect(screen.getByRole("combobox", { name: "Ankkurin yhteyksien suunta" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: /04 · 1961–1973/ }));
  const dir = screen.getByRole("combobox", { name: "Ankkurin yhteyksien suunta" });
  expect(dir).not.toBeDisabled();
  fireEvent.change(dir, { target: { value: "incoming" } });
  fireEvent.change(screen.getByRole("combobox", { name: "Ankkurin polun pituus" }), {
    target: { value: "2" },
  });
  expect(container.querySelectorAll(".at-edge")).toHaveLength(
    layoutAnchorTimeline(anchorTimeline("a4", "incoming", 2)).edges.length,
  );
  fireEvent.click(screen.getByRole("button", { name: /Kokonaiskuva/ }));
  expect(container.querySelectorAll(".at-edge")).toHaveLength(anchorTimeline(null).edges.length);
  expect(container).toHaveTextContent("ei vaikutuksen suuruutta");
});
it("opens arrow evidence and nodes with keyboard and bridges the exact source card to decision explorer", () => {
  const explore = vi.fn();
  const { container } = render(<AnchorTimeline onExplore={explore} />);
  const hit = container.querySelector(".at-edge-hit")!;
  expect(hit).toHaveAttribute("role", "button");
  expect(hit).toHaveAttribute("tabindex", "0");
  fireEvent.keyDown(hit, { key: " " });
  const detail = screen.getByRole("region", { name: "Aikajanan valinnan tiedot" });
  expect(detail).toHaveTextContent("Vaikutusnäyttöä ei ole erikseen varmennettu");
  expect(within(detail).getByRole("link", { name: /TTT-lähde/ })).toHaveAttribute("href");
  const sourceId = decisionMappings["d106"]!.nodes[1]!;
  const node = within(
    screen.getByRole("group", { name: "Seitsemän ankkurin ryhmitelty aikajana" }),
  ).getByRole("button", {
    name: new RegExp(`^${networkNode(sourceId)!.yearStart}.*${networkNode(sourceId)!.title}$`),
  });
  fireEvent.keyDown(node, { key: "Enter" });
  fireEvent.click(within(detail).getByRole("button", { name: /Avaa Taustat ja seuraukset:/ }));
  expect(explore).toHaveBeenCalledWith("d106", sourceId);
});
it("starts both decision views on an explicitly requested source counterpart", () => {
  const id = decisionMappings["d106"]!.nodes[1]!;
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: ["/murrokset"] }),
  });
  const { container } = render(
    <RouterContextProvider router={router}>
      <DecisionExplorer decisionId="d106" initialFocus={id} onDecision={vi.fn()} />
    </RouterContextProvider>,
  );
  expect(screen.getByRole("heading", { name: networkNode(id)!.title })).toBeInTheDocument();
  expect(container.querySelector(".ka figcaption")).toHaveTextContent(networkNode(id)!.title);
});

it("expands labels without changing source relationships", () => {
  const { container } = render(<AnchorTimeline onExplore={vi.fn()} />);
  const edges = container.querySelectorAll(".at-edge").length;
  fireEvent.click(screen.getByRole("checkbox", { name: "Näytä korttien nimet" }));
  expect(container.querySelector(".at-canvas")).not.toHaveClass("labels-on");
  expect(container.querySelectorAll(".at-edge")).toHaveLength(edges);
});
