import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FiscalChart, FiscalDetails, fiscalData, fiscalPoint } from "./Fiscal";
describe("Julkisen talouden selityspolku", () => {
  it("täsmäyttää jokaisen laskentavuoden ja näyttää vertailuvuoden nollamuutoksen", () => {
    for (const p of fiscalData.points.filter((p) => p.status === "computed"))
      expect(p.parts.reduce((s, a) => s + a.value_pp, 0)).toBeCloseTo(p.change_pp!, 7);
    expect(fiscalPoint(1990)?.change_pp).toBe(0);
    expect(fiscalPoint(1993)?.balance_pct).toBeLessThan(-7);
    expect(fiscalPoint(1850)).toBeUndefined();
    expect(fiscalPoint(2050)).toBeUndefined();
  });
  it("vaihtaa koko aikajanan tulo- ja menokäyriin", () => {
    render(<FiscalChart year={1993} active onOpen={() => {}} />);
    expect(screen.getByRole("img").getAttribute("aria-label")).toContain("1850–2050");
    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByText(/Vihreä yhtenäinen viiva: tulot/)).toBeInTheDocument();
  });
  it("erottaa etuudet työttömyydestä ja päätösten tunnistamisen kirjanpidosta", () => {
    render(<FiscalDetails year={1993} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(
      screen.getByText(/Rahamääräiset sosiaalietuudet sisältävät myös eläkkeitä/),
    ).toBeInTheDocument();
  });
});
