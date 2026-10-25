import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ThemeCoverage } from "./ThemeCoverage";
it("avaa kaikki teemat ja erottaa aineistoehdokkaan vaikutusnäytöstä", () => {
  const onYear = vi.fn();
  render(<ThemeCoverage onYear={onYear} />);
  fireEvent.click(screen.getByText(/32 teemaa · missä näyttö/));
  expect(screen.getAllByRole("option")).toHaveLength(32);
  expect(screen.getByText(/Kartoitus käsittää 192/)).toBeInTheDocument();
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "17" } });
  fireEvent.click(screen.getByRole("button", { name: "2008–2025" }));
  expect(onYear).toHaveBeenCalledWith(2025);
  expect(
    screen.getByRole("heading", { name: /Raha, rahoitus, verotus ja julkinen talous · 2008/ }),
  ).toBeInTheDocument();
  expect(screen.getByText(/Vaikutusta ei vielä arvioitu/)).toBeInTheDocument();
});
