import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { EvidenceExplorer } from "./EvidenceExplorer";
import { chartSegments, evidence, factKind, periodLabel, type Observation } from "./evidence-model";
afterEach(cleanup);
it("keeps nine episodes, all comparisons and source references reachable", () => {
  expect(evidence.episodes).toHaveLength(9);
  expect(evidence.episodes.reduce((n, e) => n + e.metrics.length, 0)).toBe(73);
  expect(evidence.implementationRecords).toHaveLength(15);
  for (const e of evidence.episodes) {
    expect(evidence.cases.some((c) => c.id === e.case_id)).toBe(true);
    for (const id of e.implementation_ids)
      expect(evidence.implementationRecords.some((r) => r.id === id)).toBe(true);
  }
});
it("never connects across missing years or a definition change", () => {
  const points: Observation[] = [2018, 2019, 2021, 2022].map((year) => ({
    year,
    value: 1,
    value_kind: "observed",
    validation_status: "checked",
  }));
  expect(
    chartSegments(
      points,
      [2019],
      (n) => n,
      (n) => n,
    ),
  ).toBe("M2018,1 M2019,1 M2021,1 L2022,1");
});
it("retains original period evidence rather than fabricated annual points", () => {
  render(<EvidenceExplorer />);
  expect(screen.getByText("Historialliset jaksohavainnot · ei vuosiarvoja")).toBeInTheDocument();
  expect(screen.getAllByText("1866–1870").length).toBeGreaterThan(0);
});
it("separates expectations and open/cumulative periods from realized annual data", () => {
  expect(factKind("ex_ante_expectation")).toBe("Ennakkoarvio · ei toteuma");
  expect(factKind("source_availability")).toContain("ei toteumamittari");
  expect(periodLabel({ start_year: 1918, end_year: null })).toBe("1918–avoin");
  expect(periodLabel({ as_of: "2021-03-02" })).toContain("Kertymä");
  render(<EvidenceExplorer />);
  fireEvent.change(screen.getByLabelText("Murrosjakso"), {
    target: { value: evidence.episodes.at(-1)!.code },
  });
  expect(screen.getByText(/Seurantaikkuna on vielä kesken/)).toBeInTheDocument();
  expect(screen.getByText("Ennakkoarvio · ei toteuma")).toBeInTheDocument();
  expect(screen.getByText(/Noin 100\s000 kotitaloutta/)).toBeInTheDocument();
});
it("resets metric selection when switching between different-sized episodes", () => {
  render(<EvidenceExplorer />);
  const many = evidence.episodes.find((e) => e.metrics.length > 5)!;
  fireEvent.change(screen.getByLabelText("Murrosjakso"), { target: { value: many.code } });
  fireEvent.change(screen.getByLabelText("Mittari ja väestöryhmä"), { target: { value: "5" } });
  fireEvent.change(screen.getByLabelText("Murrosjakso"), {
    target: { value: evidence.episodes[0]!.code },
  });
  expect(screen.getByLabelText("Mittari ja väestöryhmä")).toHaveValue("0");
});
