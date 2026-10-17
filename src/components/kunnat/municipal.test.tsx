import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MunicipalExplorer } from "./MunicipalExplorer";
import {
  municipalData as data,
  pairKey,
  passes,
  observations,
  dataCSV,
  correlationsCSV,
} from "./municipal-model";

describe("municipal screening", () => {
  it("keeps annual and mixed-year families separate with pairwise missing values", () => {
    const snapshot = data.snapshots[0]!;
    expect(snapshot.rows).toHaveLength(308);
    const annual = snapshot.families.find(
      (f) => !f.mixed && !f.adjusted && f.method === "spearman",
    )!;
    expect(annual.pairs).toHaveLength(276);
    expect(annual.pairs.every((p) => p.a !== 24 && p.b !== 24)).toBe(true);
    expect(observations(snapshot.rows, 9, 19)).toHaveLength(307);
    expect(observations(snapshot.rows, 9, 24)).toHaveLength(292);
    expect(observations(snapshot.rows, 9, 21).length).toBeLessThan(308);
    expect(pairKey(9, 19)).toBe(pairKey(19, 9));
  });
  it("filters the precomputed family without recomputing multiplicity and flags definitional links", () => {
    const family = data.snapshots[0]!.families[0]!;
    const pair = family.pairs.find((p) => p.a === 9 && p.b === 10)!;
    expect(pair.structural).toBeTruthy();
    expect(passes(pair, 0, 1, "qBY", false)).toBe(false);
    expect(passes(pair, 0, 1, "qBY", true)).toBe(true);
    expect(passes(pair, 1, 1, "qBY", true)).toBe(false);
    expect(family.tests).toBe(276);
  });
  it("exports observation years and all family pairs, keeping missing cells empty", () => {
    const snapshot = data.snapshots[0]!;
    const values = dataCSV(snapshot),
      pairs = correlationsCSV(snapshot, snapshot.families[0]!);
    expect(values.split("\r\n")).toHaveLength(309);
    expect(values).toContain("2025");
    expect(values).toContain('""');
    expect(pairs.split("\r\n")).toHaveLength(277);
    expect(pairs).toContain("q BY");
  });
  it("exposes source evidence and the screening limitations", () => {
    const { container } = render(<MunicipalExplorer />);
    const status = container.querySelector('[role="status"]')!;
    expect(status).toHaveTextContent("276 testattavaa paria");
    const details = container.querySelector(".km-detail")! as HTMLElement;
    expect(within(details).getByText("X:n lähdetaulukko")).toHaveAttribute(
      "href",
      expect.stringContaining("pxdata.stat.fi"),
    );
    expect(
      screen.getByText(/kuntien alueellista riippuvuutta ei ole korjattu/),
    ).toBeInTheDocument();
  });
});
