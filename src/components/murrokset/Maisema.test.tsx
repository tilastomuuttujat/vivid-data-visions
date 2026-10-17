import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Maisema } from "./Maisema";
import { landscapeLinks } from "./maisema-model";
import { anchorTimeline } from "./anchor-timeline-model";
import { decisionMappings, networkNode } from "./decision-network-model";

afterEach(cleanup);
it("shows a compact seven-anchor network without calculated direction curves or projections", () => {
  const { container } = render(<Maisema onExplore={vi.fn()} />);
  const graph = screen.getByRole("group", {
    name: "Seitsemän ankkuria ja niiden suunnatut yhteydet",
  });
  expect(within(graph).getAllByRole("button", { name: /^Ankkuri \d:/ })).toHaveLength(7);
  expect(container.querySelectorAll(".ms-link-hit")).toHaveLength(landscapeLinks().length);
  expect(screen.queryByRole("group", { name: "Skenaario" })).not.toBeInTheDocument();
  expect(screen.queryByText("Neutraali keskiviiva")).not.toBeInTheDocument();
  expect(screen.queryByText("Kaikkien päätösten painopiste")).not.toBeInTheDocument();
});
it("theme controls highlight existing topology and clear without leaving hidden curve data", () => {
  const { container } = render(<Maisema onExplore={vi.fn()} />);
  const count = container.querySelectorAll(".ms-link-hit").length;
  fireEvent.click(screen.getByRole("button", { name: "Terveys ja hoiva" }));
  expect(container.querySelectorAll(".ms-anchor.dim").length).toBeGreaterThan(0);
  expect(container.querySelectorAll(".ms-link-hit")).toHaveLength(count);
  fireEvent.click(screen.getByRole("button", { name: "Poista teemakorostus" }));
  expect(container.querySelectorAll(".dim")).toHaveLength(0);
});
it("opens bundled source edges using Space and preserves original IDs and endpoints", () => {
  const { container } = render(<Maisema onExplore={vi.fn()} />);
  const link = container.querySelector(".ms-link-hit")!;
  expect(link).toHaveAttribute("tabindex", "0");
  fireEvent.keyDown(link, { key: " " });
  const panel = screen.getByRole("complementary", { name: "Maiseman valinnan tiedot" });
  for (const e of landscapeLinks()[0]!.edges) {
    expect(panel).toHaveTextContent(e.id);
    expect(panel).toHaveTextContent(networkNode(e.from)!.title);
    expect(panel).toHaveTextContent(networkNode(e.to)!.title);
  }
  expect(within(panel).getAllByRole("link", { name: /TTT-lähde/ }).length).toBeGreaterThan(0);
});
it("expands the same anchor in place, supports direction/depth and closes back to seven groups", () => {
  const { container } = render(<Maisema onExplore={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: /^Ankkuri 4:/ }));
  const detail = screen.getByRole("region", { name: "Valitun ankkurin yhteydet" });
  expect(
    within(detail).getByRole("heading", { name: "Hyvinvointivaltion arkkitehtuuri" }),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByRole("combobox", { name: "Maiseman yhteyksien suunta" }), {
    target: { value: "incoming" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "Maiseman polun pituus" }), {
    target: { value: "2" },
  });
  expect(detail.querySelectorAll(".ms-link-hit")).toHaveLength(
    anchorTimeline("a4", "incoming", 2).edges.length,
  );
  expect(container.querySelectorAll(".ms-anchor")).toHaveLength(7);
  fireEvent.click(screen.getByRole("button", { name: "Sulje ankkurin tarkastelu" }));
  expect(
    screen.queryByRole("region", { name: "Valitun ankkurin yhteydet" }),
  ).not.toBeInTheDocument();
});
it("opens real source cards and passes the exact counterpart into decision explorer", () => {
  const explore = vi.fn();
  render(<Maisema onExplore={explore} />);
  fireEvent.change(screen.getByRole("combobox", { name: "Avaa maiseman ankkuri" }), {
    target: { value: "a7" },
  });
  const id = decisionMappings["d106"]!.nodes[1]!;
  const graph = screen.getByRole("group", {
    name: "Ankkurin lähdekortit ja relaatiot oikeilla vuosillaan",
  });
  const node = within(graph).getByRole("button", {
    name: new RegExp(`^${networkNode(id)!.yearStart}.*${networkNode(id)!.title}$`),
  });
  fireEvent.keyDown(node, { key: "Enter" });
  const panel = screen.getByRole("complementary", { name: "Maiseman valinnan tiedot" });
  fireEvent.click(within(panel).getByRole("button", { name: "Näytä taustat ja seuraukset →" }));
  expect(explore).toHaveBeenCalledWith("d106", id);
});
