import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { afterEach, expect, it, vi } from "vitest";
import { Juurisyyt } from "./Juurisyyt";
import { DecisionExplorer } from "./DecisionExplorer";
import { KaariAikajana } from "./KaariAikajana";
import { PolkuAikajana } from "./PolkuAikajana";
import { ROOT_PATHS } from "./juurisyyt-model";
import { decisionMappings, edgesFor, networkNode } from "./decision-network-model";

afterEach(cleanup);
function mount(element: React.ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: ["/murrokset"] }),
  });
  return render(<RouterContextProvider router={router}>{element}</RouterContextProvider>);
}
it("filters the plotted paths with the visible cards", () => {
  mount(<Juurisyyt />);
  fireEvent.click(screen.getByRole("tab", { name: "Risteävät polut" }));
  fireEvent.click(screen.getByRole("button", { name: "Vahvuus" }));
  const chart = screen.getByRole("group", { name: "Juurisyypolku aikajanalla" });
  expect(chart.parentElement?.parentElement).toHaveTextContent("Kriisinkestävyys");
  expect(chart.parentElement?.parentElement).not.toHaveTextContent(ROOT_PATHS[0]!.title);
});
it("keeps an intentionally empty selection empty, including after filtering", () => {
  mount(<Juurisyyt />);
  fireEvent.click(screen.getByRole("tab", { name: "Risteävät polut" }));
  for (const button of screen
    .getAllByRole("button", { pressed: true })
    .filter((b) => b.classList.contains("j-card")))
    fireEvent.click(button);
  expect(screen.getByRole("status")).toHaveTextContent("Valitse ilmiö");
  fireEvent.click(screen.getByRole("button", { name: "Vahvuus" }));
  expect(screen.getByRole("status")).toHaveTextContent("Valitse ilmiö");
  expect(screen.queryByRole("group", { name: /juurisyypol/i })).not.toBeInTheDocument();
});
it("keeps arcs in sync with source-card navigation, history and direction", () => {
  const { container } = mount(<DecisionExplorer decisionId="d106" onDecision={vi.fn()} />);
  const ids = decisionMappings["d106"]!.nodes;
  fireEvent.click(
    within(screen.getByRole("group", { name: "Lähtöpäätöksen verkostokortit" })).getByRole(
      "button",
      { name: networkNode(ids[1]!)!.title },
    ),
  );
  expect(container.querySelector(".ka figcaption")).toHaveTextContent(networkNode(ids[1]!)!.title);
  const directions = screen.getByRole("group", { name: "Relaatioiden suunta" });
  fireEvent.click(within(directions).getByRole("button", { name: /^Taustat/ }));
  expect(container.querySelectorAll(".ka-arc")).toHaveLength(
    edgesFor(ids[1]!, "incoming").filter((e) => networkNode(e.from)?.yearStart != null).length,
  );
  expect(
    [...container.querySelectorAll(".ka-arc path")].every(
      (p) => !p.getAttribute("d")?.includes("NaN"),
    ),
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: /Edellinen solmu/ }));
  expect(container.querySelector(".ka figcaption")).toHaveTextContent(networkNode(ids[0]!)!.title);
});
it("opens arc nodes with Enter and Space", () => {
  const pick = vi.fn();
  const { container } = render(<KaariAikajana decisionId="d050" onDecision={pick} />);
  const points = [...container.querySelectorAll(".ka-linked")];
  expect(points.length).toBeGreaterThan(0);
  for (const point of points) {
    expect(point).toHaveAttribute("tabindex", "0");
    expect(point).toHaveAttribute("role", "button");
  }
  fireEvent.keyDown(points[0]!, { key: "Enter" });
  fireEvent.keyDown(points[0]!, { key: " " });
  expect(pick).toHaveBeenCalledTimes(2);
  expect(pick.mock.calls[0]).toEqual(pick.mock.calls[1]);
});
it("describes overlapping intervals and makes full step titles available", () => {
  const { container } = render(<PolkuAikajana ids={["syntyvyys"]} onPick={vi.fn()} />);
  expect(container).toHaveTextContent("limittyvät");
  expect(container).toHaveTextContent("keskipisteiden");
  for (const step of ROOT_PATHS.find((p) => p.id === "syntyvyys")!.steps)
    expect(container.querySelector("details")).toHaveTextContent(step.title);
});

it("centers the current point when an empty path selection becomes visible", () => {
  const width = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(760);
  const client = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(270);
  try {
    const { container, rerender } = render(<PolkuAikajana ids={[]} onPick={vi.fn()} />);
    rerender(<PolkuAikajana ids={["syntyvyys"]} onPick={vi.fn()} />);
    expect(container.querySelector(".pa-scroll")!.scrollLeft).toBeGreaterThan(400);
  } finally {
    width.mockRestore();
    client.mockRestore();
  }
});
