import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Ankkurit } from "./Ankkurit";
import { ANCHORS, anchorLinks, anchorSatellites } from "./ankkurit-model";
import { anchorPanelData, anchorPanelScale } from "./anchor-panels-model";

afterEach(cleanup);
function renderSeparate() {
  const result = render(<Ankkurit />);
  fireEvent.click(screen.getByRole("button", { name: "Erilliset kuviot" }));
  return result;
}

it("renders seven complete diagrams in order with only their own anchor emphasized", () => {
  renderSeparate();
  const panels = screen.getAllByRole("article");
  expect(panels).toHaveLength(7);
  panels.forEach((panel, i) => {
    expect(panel).toHaveAccessibleName(`Ankkurin ${i + 1} kaarikuvio`);
    expect(panel.querySelectorAll('svg[role="group"]')).toHaveLength(1);
    expect(panel.querySelectorAll(".ap-anchor.selected")).toHaveLength(1);
    expect(panel.querySelector(".ap-anchor.selected text")).toHaveTextContent(String(i + 1));
    expect(panel.querySelectorAll(".ap-anchor.context")).toHaveLength(6);
  });
});
it("uses identical years and reference lines in all panels and preserves them when filtering", () => {
  const { container } = renderSeparate();
  const axis = anchorPanelScale();
  const grids = [...container.querySelectorAll(".ap-scroll")].map((el) =>
    [...el.querySelectorAll(".ap-grid line")].map((l) => l.getAttribute("x1")),
  );
  expect(grids.every((g) => JSON.stringify(g) === JSON.stringify(grids[0]))).toBe(true);
  const expected = String(axis.x(1991));
  for (const panel of screen.getAllByRole("article"))
    expect(panel.querySelector('[data-year="1991"]')).toHaveAttribute("x1", expected);
  fireEvent.click(screen.getByRole("button", { name: "Tyhjennä" }));
  expect(screen.getByRole("status")).toBeInTheDocument();
  expect(screen.queryAllByRole("article")).toHaveLength(0);
  const chips = screen.getByRole("group", { name: "Valitse näkyvät ankkurikuviot" });
  fireEvent.click(within(chips).getByRole("button", { name: /^4 / }));
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(container.querySelector('[data-year="1991"]')).toHaveAttribute("x1", expected);
  fireEvent.click(screen.getByRole("button", { name: "Kaikki" }));
  expect(screen.getAllByRole("article")).toHaveLength(7);
});
it("keeps only each panel's original inter-anchor and satellite source edges", () => {
  const { container } = renderSeparate();
  for (const a of ANCHORS) {
    const data = anchorPanelData(a.id);
    const expected = anchorLinks()
      .filter((l) => l.from === a.id || l.to === a.id)
      .flatMap((l) => l.edges)
      .concat(anchorSatellites(a.id).map((s) => s.e));
    expect(data.edges).toEqual(expected);
    const panel = container.querySelectorAll(".ap-panel")[a.n - 1]!;
    expect(
      [...panel.querySelectorAll("[data-edge-id]")].map((el) => el.getAttribute("data-edge-id")),
    ).toEqual(expected.map((e) => e.id));
  }
});
it("synchronizes horizontal scrolling without changing the seven scales", () => {
  const { container } = renderSeparate();
  const scrollers = [...container.querySelectorAll(".ap-scroll")] as HTMLDivElement[];
  scrollers[0]!.scrollLeft = 180;
  fireEvent.scroll(scrollers[0]!);
  expect(scrollers.every((s) => s.scrollLeft === 180)).toBe(true);
  scrollers[3]!.scrollLeft = 80;
  fireEvent.scroll(scrollers[3]!);
  expect(scrollers.every((s) => s.scrollLeft === 80)).toBe(true);
});
it("opens relation evidence and period details with keyboard and can hide the guides", () => {
  renderSeparate();
  const first = screen.getAllByRole("article")[0]!;
  const edge = first.querySelector(".ap-hit")!;
  fireEvent.keyDown(edge, { key: " " });
  expect(
    screen.getByRole("complementary", { name: "Ankkurin 1 valittu relaatio" }),
  ).toHaveTextContent("TTT-lähde");
  fireEvent.keyDown(within(first).getByRole("button", { name: /^1918:/ }), { key: "Enter" });
  expect(screen.getByRole("complementary", { name: "Murroskohdan tiedot" })).toHaveTextContent(
    "Sisällissota",
  );
  fireEvent.click(
    screen.getByRole("checkbox", { name: "Näytä yhteiset murroskohtien katkoviivat" }),
  );
  expect(first.querySelectorAll(".tm-line")).toHaveLength(0);
});
