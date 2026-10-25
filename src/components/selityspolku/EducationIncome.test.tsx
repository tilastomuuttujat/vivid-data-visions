import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { EducationIncome } from "./EducationIncome";
it("näyttää erilliset käyrät ja pitää palkat poikkileikkauksena", () => {
  const onYear = vi.fn();
  render(<EducationIncome onYear={onYear} />);
  expect(screen.getAllByRole("img")).toHaveLength(2);
  expect(screen.getAllByRole("img")[0]).toHaveAccessibleName(/1850–2050/);
  fireEvent.click(screen.getByRole("button", { name: /Tarkastele vuotta 2024/ }));
  expect(onYear).toHaveBeenCalledWith(2024);
  fireEvent.click(screen.getByText("Mistä tulot muodostuvat — ja mitä ei voi erotella?"));
  expect(screen.getByText(/Mediaanien erot eivät jaa muutosta/)).toBeInTheDocument();
  fireEvent.change(screen.getByRole("combobox", { name: "Palkansaajan ikä" }), {
    target: { value: "30-34" },
  });
  expect(
    screen.getByRole("table", { name: /Kokoaikaisten palkansaajien ansiot/ }),
  ).toBeInTheDocument();
  expect(screen.getByText(/Palkkarakenteen uudistus katkaisi/)).toBeInTheDocument();
});
