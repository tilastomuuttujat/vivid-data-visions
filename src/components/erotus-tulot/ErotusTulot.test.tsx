import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("../MainLinks", () => ({ MainLinks: () => null }));
import { ErotusTulot } from "./ErotusTulot";
afterEach(cleanup);
it("lets a reader select a household and component, with exact values and no missing years", () => {
  render(<ErotusTulot />);
  expect(screen.getByRole("img")).toHaveAccessibleDescription(/Erotus −250 euroa/);
  fireEvent.change(screen.getByRole("combobox", { name: "Mikä osa?" }), {
    target: { value: "taxes" },
  });
  expect(screen.getByRole("img")).toHaveAccessibleDescription(/Erotus \+1 euroa/);
  fireEvent.change(screen.getByRole("combobox", { name: "Kenen näkökulma?" }), {
    target: { value: "earnings-unemployed" },
  });
  expect(screen.getAllByText(/ensimmäisiltä 40 päivärahapäivältä/).length).toBeGreaterThan(0);
  fireEvent.change(screen.getByRole("combobox", { name: "Lähteen laskentaversio" }), {
    target: { value: "2024" },
  });
  expect(screen.getAllByText(/Porrastus sisältyy vuoden 2025 laskelmaan/).length).toBeGreaterThan(
    0,
  );
  fireEvent.click(screen.getByText("Tarkat luvut ja lähde"));
  const table = screen.getByRole("table");
  expect(within(table).getByRole("rowheader", { name: "2025*" })).toBeInTheDocument();
  expect(within(table).queryByRole("rowheader", { name: "2022" })).not.toBeInTheDocument();
  expect(screen.getByRole("img").querySelectorAll("path")).not.toHaveLength(0);
  expect(screen.getByRole("img").innerHTML).not.toMatch(/NaN|Infinity/);
});
it("keeps the shorter period valid and resets it safely across publication versions", () => {
  render(<ErotusTulot />);
  fireEvent.change(screen.getByRole("combobox", { name: "Vertailuvuosi" }), {
    target: { value: "2024" },
  });
  expect(screen.getByRole("img")).toHaveAccessibleDescription(/Erotus −68 euroa/);
  fireEvent.change(screen.getByRole("combobox", { name: "Lähteen laskentaversio" }), {
    target: { value: "2024" },
  });
  expect(screen.getByRole("combobox", { name: "Vertailuvuosi" })).toHaveValue("2023");
});
