import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MechanismTimeline } from "./MechanismTimeline";
import { EVENTS } from "./mechanism-model";
import { MAIN_PATHS, QUESTIONS, bridgeEvidence, bridgePath, pathPosition } from "./path-model";
import { decisionMappings, networkEdges } from "../murrokset/decision-network-model";

describe("question-led routes", () => {
  it("keeps every route on real chronological nodes and their assigned mechanism rows", () => {
    expect(MAIN_PATHS).toHaveLength(6);
    expect(QUESTIONS).toHaveLength(6);
    for (const route of MAIN_PATHS) {
      expect(route.bridges).toHaveLength(route.steps.length - 1);
      expect(new Set(route.steps.map((s) => s.event)).size).toBe(route.steps.length);
      route.steps.forEach((step, i) => {
        const event = EVENTS.find((e) => e.id === step.event)!;
        expect(event).toBeDefined();
        expect(event.mechanisms).toContain(step.mechanism);
        const position = pathPosition(step);
        expect(Number.isFinite(position.x + position.y)).toBe(true);
        if (i)
          expect(event.year).toBeGreaterThanOrEqual(
            EVENTS.find((e) => e.id === route.steps[i - 1]!.event)!.year,
          );
      });
    }
  });
  it("never turns context mappings, reversed edges or invented shortcuts into documented bridge evidence", () => {
    for (const route of MAIN_PATHS)
      for (let i = 0; i < route.steps.length - 1; i++) {
        const from = route.steps[i]!,
          to = route.steps[i + 1]!;
        const exact = (id: string) =>
          new Set(
            EVENTS.find((e) => e.id === id)!.decisions.flatMap((d) =>
              decisionMappings[d]?.match === "decision" ? decisionMappings[d]!.nodes : [],
            ),
          );
        const a = exact(from.event),
          b = exact(to.event);
        expect(bridgeEvidence(from, to)).toEqual(
          networkEdges.filter((e) => a.has(e.from) && b.has(e.to)),
        );
        expect(bridgePath(from, to)).toMatch(/^M[\d.]+ [\d.]+ C/);
      }
  });
  it("draws a route across seven rows, opens bridge reasoning and resets without leaving stale lines", () => {
    const { container } = render(<MechanismTimeline onExplore={vi.fn()} />);
    const picker = screen.getByRole("region", { name: "Valitse kysymys ja pääreitti" });
    fireEvent.click(within(picker).getByRole("button", { name: /Miten koulutuksesta syntyi/ }));
    expect(container.querySelectorAll(".mt-track")).toHaveLength(7);
    expect(container.querySelectorAll(".mp-route-line")).toHaveLength(5);
    expect(container.querySelectorAll(".mp-route-numbers circle")).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "Seuraava reittisolmu →" }));
    expect(screen.getByRole("status")).toHaveTextContent("1921");
    fireEvent.click(screen.getByRole("button", { name: /^Avaa reittisilta 1:/ }));
    expect(screen.getByRole("article", { name: "Valitun sillan perustelu" })).toHaveTextContent(
      "Toimituksellinen reittiselitys",
    );
    expect(screen.getByRole("article", { name: "Valitun sillan perustelu" })).toHaveTextContent(
      "Mitä muuta olisi voinut tapahtua?",
    );
    expect(
      screen
        .getByRole("region", { name: "Solmukohdan kuusi tarkistuskysymystä" })
        .querySelectorAll("summary"),
    ).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "Kokonaiskuva ilman pääreittiä" }));
    expect(container.querySelector(".mp-route-lines")).toBeNull();
    expect(screen.queryByRole("article", { name: "Valitun sillan perustelu" })).toBeNull();
  });
});
