import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("../MainLinks", () => ({ MainLinks: () => null }));
import { Kokonaiskuva } from "./Kokonaiskuva";
afterEach(cleanup);
it("shows actual and standardized whole curves with a real shaded difference", () => {
  render(<Kokonaiskuva />);
  const chart = screen.getByRole("img");
  expect(chart.querySelector("path.ki-actual")?.getAttribute("d")).not.toBe(
    chart.querySelector("path.ki-reference")?.getAttribute("d"),
  );
  expect(chart.querySelector('path[fill*="hatch"]')?.getAttribute("d")).toMatch(/Z$/);
  expect(screen.getByText("−3,4", { selector: "strong" })).toBeInTheDocument();
  expect(chart).toHaveAccessibleDescription(/Laskettu historia 1987–2024/);
  expect(chart.innerHTML).not.toMatch(/NaN|Infinity/);
});
it("keeps the full domain and whole curves unchanged when opening an age-group part", () => {
  render(<Kokonaiskuva />);
  const chart = screen.getByRole("img");
  const original = chart.querySelector("path.ki-reference")!.getAttribute("d");
  const actual = chart.querySelector("path.ki-actual")!.getAttribute("d");
  fireEvent.click(screen.getByRole("button", { name: /Näkökulma ja vertailuvuosi/ }));
  fireEvent.change(screen.getByRole("combobox", { name: /Minkä ryhmän/ }), {
    target: { value: "old" },
  });
  expect(
    screen.getByRole("heading", { name: /65 vuotta täyttäneiden osuus:/ }),
  ).toBeInTheDocument();
  expect(chart.querySelector("path.ki-reference")).toHaveAttribute("d", original);
  fireEvent.change(screen.getByRole("combobox", { name: "Vertailuvuosi" }), {
    target: { value: "2000" },
  });
  expect(chart.querySelector("path.ki-reference")!.getAttribute("d")).not.toBe(original);
  expect(chart.querySelector("path.ki-actual")).toHaveAttribute("d", actual);
  const slider = screen.getByRole("slider");
  expect(slider).toHaveAttribute("min", "1850");
  expect(slider).toHaveAttribute("max", "2050");
  fireEvent.change(slider, { target: { value: "1900" } });
  expect(
    screen.getByText(/Aikaisemmille vuosille ei esitetä keksittyä vertailukäyrää/),
  ).toBeInTheDocument();
  expect(screen.queryByText(/prosenttiyksikköä$/, { selector: "small" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Rakennemuutos jatkuu" }));
  expect(slider).toHaveValue("2050");
  expect(chart).toHaveAttribute("viewBox", "0 0 1160 440");
});
it("opens exact source totals and inline drilldown while retaining the long timeline", () => {
  render(<Kokonaiskuva />);
  fireEvent.click(screen.getByText("Avaa vuosiluvut ja alkuperäislähde"));
  expect(screen.getByRole("table", { name: /Käyrien laskenta/ })).toHaveTextContent("2024");
  expect(screen.getByRole("link", { name: /Tilastokeskus, työssäkäynti/ })).toHaveAttribute(
    "href",
    "https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/tyokay/115w.px",
  );
  fireEvent.click(screen.getByRole("button", { name: /Avaa toimeentulon yksityiskohta/ }));
  expect(screen.getAllByRole("img")).toHaveLength(2);
  expect(screen.getByRole("slider")).toHaveAttribute("min", "1850");
});
