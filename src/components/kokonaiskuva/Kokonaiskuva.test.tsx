import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("../MainLinks", () => ({ MainLinks: () => null }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));
import { Kokonaiskuva } from "./Kokonaiskuva";
afterEach(cleanup);
it("keeps the 1850–2050 overview fixed across group, era and future choices", () => {
  render(<Kokonaiskuva />);
  const chart = screen.getByRole("img");
  const slider = screen.getByRole("slider");
  const viewBox = chart.getAttribute("viewBox");
  expect(slider).toHaveAttribute("min", "1850");
  expect(slider).toHaveAttribute("max", "2050");
  fireEvent.click(screen.getByRole("button", { name: /Valitse näkökulma/ }));
  fireEvent.click(screen.getByRole("button", { name: "Lapsiperhe" }));
  expect(screen.getByText(/Miten lasten ja vanhempien toimintamahdollisuudet/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "1850–1917" }));
  expect(screen.getByText(/Tämän vaiheen molempia käyriä kattavaa vertailua/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Kasvu eriytyy" }));
  expect(slider).toHaveValue("2025");
  expect(screen.getByText(/oletuksen kokonaisseuraamuksen/)).toBeInTheDocument();
  expect(chart).toHaveAttribute("viewBox", viewBox);
  expect(chart).toHaveAccessibleDescription(/Yhteinen aikajana pysyy aina vuosissa 1850–2050/);
  expect(chart.innerHTML).not.toMatch(/NaN|Infinity/);
});
it("opens source cases and keeps the household drilldown distinct from national evidence", () => {
  render(<Kokonaiskuva />);
  fireEvent.click(screen.getByText(/Avaa ajanjakson aineisto ja lähteet/));
  expect(screen.getAllByRole("link", { name: /Lähde ↗/ }).length).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("button", { name: /Avaa tulojen hajotelma/ }));
  expect(screen.getAllByRole("img")).toHaveLength(2);
  expect(screen.getByRole("slider", { name: "Tarkasteluvuosi 1850–2050" })).toHaveAttribute(
    "min",
    "1850",
  );
  expect(
    screen.getByText(/ei yllä olevien kansallisten käyrien ryhmäkohtainen jako/),
  ).toBeInTheDocument();
});
