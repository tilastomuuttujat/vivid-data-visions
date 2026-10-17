import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Ankkurit } from "./Ankkurit";
import { anchorStackLayout } from "./anchor-stack-model";
import { ANCHORS } from "./ankkurit-model";
import { anchorPanelData } from "./anchor-panels-model";

afterEach(cleanup);
it("defaults to one shared SVG with seven full arc rows and no individual frames", () => {
  const { container } = render(<Ankkurit />);
  expect(screen.getByRole("button", { name: "Yhteinen kuvaaja" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(container.querySelectorAll(".as-figure")).toHaveLength(1);
  expect(container.querySelectorAll(".as-canvas svg")).toHaveLength(1);
  expect(container.querySelectorAll(".as-scroll")).toHaveLength(1);
  expect(container.querySelectorAll(".ap-panel")).toHaveLength(0);
  expect(
    [...container.querySelectorAll("[data-anchor-id]")].map((g) =>
      g.getAttribute("data-anchor-id"),
    ),
  ).toEqual(ANCHORS.map((a) => a.id));
  expect(container.querySelectorAll(".as-row")).toHaveLength(7);
  expect(container.querySelectorAll(".tm-line")).toHaveLength(5);
});
it("preserves each complete arc row's source relations without adding cross-row causal edges", () => {
  const { container } = render(<Ankkurit />);
  for (const a of ANCHORS) {
    const row = container.querySelector(`[data-anchor-id="${a.id}"]`)!;
    expect(
      [...row.querySelectorAll("[data-edge-id]")].map((e) => e.getAttribute("data-edge-id")),
    ).toEqual(anchorPanelData(a.id).edges.map((e) => e.id));
    expect(row.querySelectorAll(".as-anchor.own")).toHaveLength(1);
  }
});
it("uses a single scale and continuous guide height, independent of filters or row spacing", () => {
  const all = anchorStackLayout(ANCHORS.map((a) => a.id));
  const filtered = anchorStackLayout(["a3"]);
  const spacious = anchorStackLayout(
    ANCHORS.map((a) => a.id),
    true,
  );
  expect(all.rows.every((row, i) => !i || row.mid > all.rows[i - 1]!.mid)).toBe(true);
  for (const year of [1800, 1918, 1991, 2020, 2050]) {
    expect(all.x(year)).toBe(filtered.x(year));
    expect(all.x(year)).toBe(spacious.x(year));
  }
  expect(spacious.height).toBeGreaterThan(all.height);
  const { container } = render(<Ankkurit />);
  expect(container.querySelector(".tm-line")).toHaveAttribute("y2", String(all.height - 22));
  fireEvent.click(screen.getByRole("checkbox", { name: "Väljemmät rivit" }));
  expect(container.querySelector(".tm-line")).toHaveAttribute("y2", String(spacious.height - 22));
});
it("keeps row emphasis inside the same seven-row figure and opens original source evidence", () => {
  const { container } = render(<Ankkurit />);
  const labels = container.querySelector(".as-labels")!;
  fireEvent.click(within(labels as HTMLElement).getByRole("button", { name: /^4\./ }));
  expect(container.querySelectorAll(".as-row.dim")).toHaveLength(6);
  expect(container.querySelectorAll(".as-row")).toHaveLength(7);
  const target = container.querySelector('[data-anchor-id="a4"] .as-hit')!;
  fireEvent.keyDown(target, { key: " " });
  expect(
    screen.getByRole("complementary", { name: "Yhteisen kuvaajan relaatiotiedot" }),
  ).toHaveTextContent("Ankkurin 4 kaaristo");
  expect(
    within(
      screen.getByRole("complementary", { name: "Yhteisen kuvaajan relaatiotiedot" }),
    ).getByRole("link", { name: /TTT-lähde/ }),
  ).toHaveAttribute("href");
  fireEvent.click(screen.getByRole("button", { name: "Poista rivikorostus" }));
  expect(container.querySelectorAll(".as-row.dim")).toHaveLength(0);
});
it("handles empty selection and can switch to the previous separate-diagram presentation", () => {
  const { container } = render(<Ankkurit />);
  fireEvent.click(screen.getByRole("button", { name: "Tyhjennä" }));
  expect(screen.getByRole("status")).toBeInTheDocument();
  expect(container.querySelectorAll(".as-row")).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "Kaikki" }));
  expect(container.querySelectorAll(".as-row")).toHaveLength(7);
  fireEvent.click(screen.getByRole("button", { name: "Erilliset kuviot" }));
  expect(container.querySelectorAll(".ap-panel")).toHaveLength(7);
  expect(container.querySelectorAll(".as-canvas")).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "Yhteinen kuvaaja" }));
  expect(container.querySelectorAll(".as-canvas")).toHaveLength(1);
});
