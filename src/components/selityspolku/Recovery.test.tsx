import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Recovery } from "./Recovery";
it("perustaa toipumisen vertailun havaintoihin ja välittää luvun vuosivalintaan", () => {
  const onYear = vi.fn();
  render(<Recovery year={1993} onYear={onYear} />);
  expect(
    screen.getByRole("heading", { name: "Tuotanto palautui. Työllisten osuus jäi alemmaksi." }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /3. Toipumisen erot/ }));
  expect(onYear).toHaveBeenCalledWith(2000);
  fireEvent.click(screen.getByText("Mihin päätelmä perustuu?"));
  expect(screen.getByRole("table")).toHaveTextContent("+21");
  expect(screen.getByRole("table")).toHaveTextContent("−3,6");
});
