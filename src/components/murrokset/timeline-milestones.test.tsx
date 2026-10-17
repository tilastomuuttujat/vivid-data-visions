import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TimelineMilestones } from "./TimelineMilestones";
import { TIMELINE_MILESTONES, milestoneLabels } from "./timeline-milestones-model";
import { Maisema } from "./Maisema";
import { AnchorTimeline } from "./AnchorTimeline";
import { landscapeAnchors, landscapeX, LANDSCAPE_HEIGHT } from "./maisema-model";
import { TURNS } from "./murrokset-model";

afterEach(cleanup);
it("uses period starts from the existing chronology and positions every line at its actual year", () => {
  const select = vi.fn();
  const x = (year: number) => year * 2;
  const { container } = render(
    <svg>
      <TimelineMilestones x={x} min={1850} max={2025} bottom={600} onSelect={select} />
    </svg>,
  );
  for (const m of TIMELINE_MILESTONES) {
    expect(TURNS.some((t) => t.from === m.year && t.title === m.title)).toBe(true);
    const line = container.querySelector(`line[data-year="${m.year}"]`)!;
    expect(line).toHaveAttribute("x1", String(x(m.year)));
    expect(line).toHaveAttribute("x2", String(x(m.year)));
    expect(line).toHaveAttribute("y2", "600");
  }
  fireEvent.keyDown(screen.getByRole("button", { name: /^1991:/ }), { key: " " });
  expect(select).toHaveBeenCalledWith(1991);
});
it("omits out-of-range dates and prevents overlapping labels on each header row", () => {
  const labels = milestoneLabels((y) => (y - 1600) * 2, 1600, 2025);
  for (const row of new Set(labels.map((m) => m.row))) {
    const same = labels.filter((m) => m.row === row);
    for (let i = 1; i < same.length; i++) expect(same[i]!.x - same[i - 1]!.x).toBeGreaterThan(80);
  }
  expect(milestoneLabels((y) => y, 1940, 2000).map((m) => m.year)).toEqual([1991]);
});
it("stacks all seven anchors on a shared scale and spans every row with milestone guides", () => {
  const { container } = render(<Maisema onExplore={vi.fn()} />);
  const anchors = landscapeAnchors();
  expect(new Set(anchors.map((a) => a.y)).size).toBe(7);
  expect(anchors.every((a, i) => !i || a.y > anchors[i - 1]!.y)).toBe(true);
  for (const a of anchors) expect(a.x).toBe(landscapeX((a.from + a.to) / 2));
  const overview = screen.getByRole("group", {
    name: "Seitsemän ankkuria ja niiden suunnatut yhteydet",
  });
  expect(overview.querySelectorAll(".tm-line")).toHaveLength(5);
  expect(overview.querySelector(".tm-line")).toHaveAttribute("y2", String(LANDSCAPE_HEIGHT - 30));
  fireEvent.click(within(overview).getByRole("button", { name: /^1939:/ }));
  expect(screen.getByRole("complementary", { name: "Murroskohdan tiedot" })).toHaveTextContent(
    "1939–1945",
  );
  expect(container).toHaveTextContent("ei osoita vaikutussuhdetta");
});
it("adds the same guides to the full timeline and the expanded landscape inside their SVGs", () => {
  const { unmount } = render(<Maisema onExplore={vi.fn()} />);
  fireEvent.change(screen.getByRole("combobox", { name: "Avaa maiseman ankkuri" }), {
    target: { value: "a4" },
  });
  const focused = screen.getByRole("group", {
    name: "Ankkurin lähdekortit ja relaatiot oikeilla vuosillaan",
  });
  expect(focused.querySelectorAll(".tm-line")).toHaveLength(5);
  unmount();
  render(<AnchorTimeline onExplore={vi.fn()} />);
  const full = screen.getByRole("group", { name: "Seitsemän ankkurin ryhmitelty aikajana" });
  expect(full.querySelectorAll(".tm-line")).toHaveLength(5);
  fireEvent.keyDown(within(full).getByRole("button", { name: /^2020:/ }), { key: "Enter" });
  expect(screen.getByRole("complementary", { name: "Murroskohdan tiedot" })).toHaveTextContent(
    "Pandemia",
  );
});
