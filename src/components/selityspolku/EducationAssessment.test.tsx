import { fireEvent, render, screen } from "@testing-library/react";
import { it, expect, vi } from "vitest";
import { EducationAssessment } from "./EducationAssessment";
it("säilyttää pitkän akselin, näyttää rajatun vaikutusnäytön ja vaihtaa vertailua", () => {
  const onYear = vi.fn();
  render(<EducationAssessment onYear={onYear} />);
  expect(screen.getByRole("img")).toHaveAccessibleName(/koko aikajana 1850–2050/);
  fireEvent.click(screen.getByText("Avaa havainto, vaikutusnäyttö ja epävarmuus"));
  expect(screen.getByText(/Uudistus toteutui 1972–1977/)).toBeInTheDocument();
  expect(screen.getByText(/Koulutuksen osuutta koko tuotannon/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /1995–2025 · työ/ }));
  expect(onYear).toHaveBeenCalledWith(2024);
  expect(screen.getByRole("img")).toHaveAccessibleName(/1995–2024/);
});
