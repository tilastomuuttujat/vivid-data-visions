import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Ankkurit } from "./Ankkurit";
import { ANCHORS } from "./ankkurit-model";
import { anchorPanelData } from "./anchor-panels-model";
import {
  defaultExplorerFilters,
  explorerEdges,
  explorerPaths,
  explorerEdgeMatch,
  stackTicks,
} from "./anchor-explorer-model";
import { traceRelations } from "./anchor-timeline-model";
import { networkNode } from "./decision-network-model";

const ids = ANCHORS.map((a) => a.id);
afterEach(cleanup);
function openControls() {
  fireEvent.click(screen.getByRole("button", { name: "Ohjauspaneeli" }));
  return screen.getByRole("complementary", { name: "Kuvaajan ohjauspaneeli" });
}
it("defaults to highlighting all original relations and never invents a two-step shortcut", () => {
  const filters = defaultExplorerFilters();
  expect(filters.mode).toBe("highlight");
  for (const id of ids)
    for (const edge of anchorPanelData(id).edges)
      expect(explorerEdgeMatch(edge, id, filters, null, null)).toBe(true);
  const edges = explorerEdges(ids),
    node = edges[0]!.from;
  const expected = new Set(
    [
      ...traceRelations([node], "incoming", 2, edges).edges,
      ...traceRelations([node], "outgoing", 2, edges).edges,
    ].map((e) => e.id),
  );
  expect(explorerPaths(ids, node, "all", 2)).toEqual(expected);
  expect(explorerPaths(ids, node, "incoming", 1)).toEqual(
    new Set(edges.filter((e) => e.to === node).map((e) => e.id)),
  );
});
it("applies direction and type filters relative to the source anchor and handles zero type choices", () => {
  const base = defaultExplorerFilters(),
    own = new Set(ANCHORS[3]!.nodes);
  for (const e of anchorPanelData("a4").edges) {
    expect(explorerEdgeMatch(e, "a4", { ...base, direction: "incoming" }, null, null)).toBe(
      own.has(e.to),
    );
    expect(explorerEdgeMatch(e, "a4", { ...base, groups: [] }, null, null)).toBe(false);
  }
  expect(stackTicks(1960, 1990)).toEqual([1960, 1970, 1980, 1990]);
});
it("opens and closes a nonmodal control drawer without replacing or resizing the chart", () => {
  const { container } = render(<Ankkurit />);
  const canvas = container.querySelector(".as-canvas")!;
  const view = canvas.getAttribute("style");
  openControls();
  expect(container.querySelector(".as-canvas")).toBe(canvas);
  expect(canvas.getAttribute("style")).toBe(view);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(
    screen.queryByRole("complementary", { name: "Kuvaajan ohjauspaneeli" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Ohjauspaneeli" })).toHaveFocus();
});
it("compares two anchors by highlighting before explicitly hiding other rows", () => {
  const { container } = render(<Ankkurit />);
  const count = container.querySelectorAll("[data-edge-id]").length;
  const panel = openControls();
  fireEvent.click(within(panel).getByRole("checkbox", { name: /^Ankkuri 2:/ }));
  fireEvent.click(within(panel).getByRole("checkbox", { name: /^Ankkuri 4:/ }));
  expect(container.querySelectorAll(".as-row")).toHaveLength(7);
  expect(container.querySelectorAll(".as-row.dim")).toHaveLength(5);
  expect(container.querySelectorAll("[data-edge-id]")).toHaveLength(count);
  fireEvent.click(within(panel).getByRole("radio", { name: "Rajaa · piilota muut" }));
  expect(
    [...container.querySelectorAll("[data-anchor-id]")].map((el) =>
      el.getAttribute("data-anchor-id"),
    ),
  ).toEqual(["a2", "a4"]);
  fireEvent.click(within(panel).getByRole("button", { name: "Palauta kokonaiskuva" }));
  expect(container.querySelectorAll(".as-row")).toHaveLength(7);
  expect(container.querySelectorAll(".ae-muted")).toHaveLength(0);
});
it("selects the same canonical card in several rows and highlights exactly its source paths", () => {
  const { container } = render(<Ankkurit />);
  const points = [...container.querySelectorAll("[data-node-id]")];
  const counts = new Map<string, number>();
  for (const p of points) {
    const id = p.getAttribute("data-node-id")!;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const id = [...counts].find(([, n]) => n > 1)![0];
  fireEvent.click(container.querySelector(`[data-node-id="${id}"]`)!);
  const selected = container.querySelectorAll(`[data-node-id="${id}"].on`);
  expect(selected.length).toBeGreaterThan(1);
  expect(screen.getByRole("complementary", { name: "Valitun kortin tiedot" })).toHaveTextContent(
    networkNode(id)!.title,
  );
  const expected = explorerPaths(ids, id, "all", 1)!;
  const highlighted = new Set(
    [...container.querySelectorAll(".as-relation.on")].map((e) => e.getAttribute("data-edge-id")),
  );
  expect(highlighted).toEqual(expected);
});
it("opens relation evidence beside the chart without calling scrollIntoView", () => {
  const old = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
  const scroll = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scroll,
  });
  try {
    const { container } = render(<Ankkurit />);
    fireEvent.keyDown(container.querySelector(".as-hit")!, { key: " " });
    expect(
      screen.getByRole("complementary", { name: "Yhteisen kuvaajan relaatiotiedot" }),
    ).toHaveTextContent("TTT-lähde");
    expect(scroll).not.toHaveBeenCalled();
  } finally {
    if (old) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", old);
    else delete (HTMLElement.prototype as unknown as { scrollIntoView?: unknown }).scrollIntoView;
  }
});
it("applies and zooms a shared year interval, validates reversed dates, and resets", () => {
  const { container } = render(<Ankkurit />);
  const panel = openControls();
  const from = within(panel).getByRole("spinbutton", { name: "Alkuvuosi" }),
    to = within(panel).getByRole("spinbutton", { name: "Loppuvuosi" });
  fireEvent.change(from, { target: { value: "1960" } });
  fireEvent.change(to, { target: { value: "1990" } });
  fireEvent.click(within(panel).getByRole("button", { name: "Aseta aikaväli" }));
  fireEvent.click(within(panel).getByRole("checkbox", { name: "Lähennä valittuun aikaväliin" }));
  const years = [...container.querySelectorAll(".as-grid text")].map((t) => t.textContent);
  expect(new Set(years)).toEqual(new Set(["1960", "1970", "1980", "1990"]));
  expect(container.querySelectorAll(".as-row")).toHaveLength(7);
  fireEvent.change(within(panel).getByRole("spinbutton", { name: "Alkuvuosi" }), {
    target: { value: "2000" },
  });
  fireEvent.click(within(panel).getByRole("button", { name: "Aseta aikaväli" }));
  expect(within(panel).getByRole("alert")).toBeInTheDocument();
  fireEvent.click(within(panel).getByRole("button", { name: "Palauta kokonaiskuva" }));
  expect(container.querySelector(".as-grid text")).toHaveTextContent("1800");
});
it("shows one year cursor across all rows and preserves the actual source relation set", () => {
  const { container } = render(<Ankkurit />);
  const before = container.querySelectorAll("[data-edge-id]").length;
  fireEvent.change(screen.getByRole("slider", { name: "Yhteinen vuosikohdistin" }), {
    target: { value: "1972" },
  });
  expect(container.querySelector(".ae-year-cursor text")).toHaveTextContent("1972");
  expect(container.querySelectorAll(".ae-year-cursor line")).toHaveLength(1);
  expect(container.querySelectorAll("[data-edge-id]")).toHaveLength(before);
});
