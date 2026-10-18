import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DECISIONS } from "../murrokset/murrokset-model";
import { MechanismTimeline } from "./MechanismTimeline";
import {
  ERAS,
  EVENTS,
  MECHANISMS,
  eraOf,
  eventDecisions,
  eventMarkers,
  timelineX,
} from "./mechanism-model";

describe("mechanism timeline", () => {
  it("keeps seven persistent mechanisms, a contiguous chronology and real decision IDs", () => {
    expect(MECHANISMS).toHaveLength(7);
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
    ERAS.forEach((era, i) => {
      if (i) expect(era.from).toBe(ERAS[i - 1]!.to);
    });
    expect(eraOf(1850)).toBe(0);
    expect(eraOf(1917)).toBe(2);
    expect(eraOf(2025)).toBe(6);
    expect(eraOf(2026)).toBe(-1);
    for (const event of EVENTS) {
      expect(event.year).toBeGreaterThanOrEqual(1850);
      expect(event.year).toBeLessThanOrEqual(2025);
      expect(event.mechanisms.length).toBeGreaterThan(0);
      event.mechanisms.forEach((id) => expect(MECHANISMS.some((m) => m.id === id)).toBe(true));
      event.decisions.forEach((id) => expect(DECISIONS.some((d) => d.id === id)).toBe(true));
      expect(eventDecisions(event)).toHaveLength(event.decisions.length);
    }
    MECHANISMS.forEach((m) => expect(m.states).toHaveLength(ERAS.length));
  });
  it("shares chronological geometry and marks multiple views of the same event, not invented source edges", () => {
    expect(timelineX(1850)).toBe(230);
    expect(timelineX(2025)).toBe(1420);
    const work = eventMarkers("work").find((p) => p.event.id === "comprehensive")!;
    const capacity = eventMarkers("capacity").find((p) => p.event.id === "comprehensive")!;
    expect(work.x).toBe(capacity.x);
    for (const m of MECHANISMS)
      for (const p of eventMarkers(m.id)) expect([0, 1, 2]).toContain(p.lane);
    expect(EVENTS.find((e) => e.id === "euro")!.dateNote).toContain("1998");
    expect(EVENTS.find((e) => e.id === "war")!.kind).toBe("context");
  });
  it("offers an accessible chapter walkthrough, synchronized selection and exact source handoff", () => {
    const explore = vi.fn();
    const { container } = render(<MechanismTimeline onExplore={explore} />);
    expect(container.querySelectorAll("[data-mechanism]")).toHaveLength(7);
    expect(screen.getByRole("button", { name: "← Edellinen aikakausi" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Seuraava aikakausi →" }));
    expect(container.querySelector(".mt-chapter")).toHaveTextContent("Kasvu ja osallisuus");
    const marker = container.querySelector('[data-mechanism="work"] [data-event="comprehensive"]')!;
    fireEvent.keyDown(marker, { key: "Enter" });
    expect(screen.getByRole("status")).toHaveTextContent("1968 · Yhteinen peruskoulu");
    expect(
      container.querySelectorAll('[data-event="comprehensive"][aria-pressed="true"]'),
    ).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Avaa päätöskortti d045" }));
    expect(explore).toHaveBeenCalledWith("d045");
    const evidence = screen.getByRole("article", { name: "Valitun murroksen tarina" });
    expect(within(evidence).getAllByRole("link")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /⚖ 1.*Valta ja oikeudet/ }));
    expect(container.querySelectorAll(".mt-track.dim")).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "Näytä kaikki polut" }));
    expect(container.querySelectorAll(".mt-track.dim")).toHaveLength(0);
  });
});
