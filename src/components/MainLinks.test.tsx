import { render, screen } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { expect, it } from "vitest";
import { MainLinks } from "./MainLinks";

it("makes the laboratory and turning points directly accessible from the atlas", () => {
  const router = createRouter({ routeTree: createRootRoute(), history: createMemoryHistory() });
  render(
    <RouterContextProvider router={router}>
      <MainLinks exclude="/" />
    </RouterContextProvider>,
  );
  expect(screen.getByRole("link", { name: "Laboratorio" })).toHaveAttribute("href", "/laboratorio");
  expect(screen.getByRole("link", { name: "Murrokset" })).toHaveAttribute("href", "/murrokset");
  expect(screen.queryByRole("link", { name: "Atlas" })).not.toBeInTheDocument();
});
