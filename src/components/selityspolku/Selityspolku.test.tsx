import { fireEvent, render, screen } from "@testing-library/react";
import { vi, it, expect } from "vitest";
vi.mock("../MainLinks", () => ({ MainLinks: () => null }));
import { Selityspolku } from "./Selityspolku";
it("pitää pitkän aikajanan, avaa vastuun puuttuvan laskennan ja erottaa tulevaisuuden", () => {
  render(<Selityspolku />);
  expect(screen.getByRole("region", { name: "Koko aikajana 1850–2050" })).toBeInTheDocument();
  expect(screen.queryByText(/Ikärakennemalli ei selitä/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "4. Yhteinen vastuu" }));
  expect(
    screen.getByText("Tässä ei vielä ole julkisen talouden laskentamallia."),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "2050" }));
  expect(screen.getByText(/Vuosille 2026–2050 ei ole tässä polussa laskettu/)).toBeInTheDocument();
  expect(screen.getByRole("slider", { name: /Tarkasteluvuosi/ })).toHaveAttribute("min", "1850");
});
