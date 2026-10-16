import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { afterEach, expect, it } from "vitest";
import { Juurisyyt } from "./Juurisyyt";
import { ROOT_PATHS, stepDecisions } from "./juurisyyt-model";

afterEach(cleanup);
function renderPaths() {
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: ["/murrokset"] }),
  });
  return render(
    <RouterContextProvider router={router}>
      <Juurisyyt />
    </RouterContextProvider>,
  );
}

it("resolves all decision references and rejects unknown references", () => {
  for (const path of ROOT_PATHS)
    for (const step of path.steps) {
      expect(stepDecisions(step)).toHaveLength(step.ids.length);
    }
  expect(() => stepDecisions({ era: "2025", title: "", mechanism: "", ids: ["missing"] })).toThrow(
    "Tuntematon päätösviittaus",
  );
});

it("selects a matching path when switching filters and preserves matching selections", () => {
  renderPaths();
  const filter = (name: string) => screen.getByRole("button", { name });
  fireEvent.click(filter("Vahvuus"));
  expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Kriisinkestävyys");
  expect(filter("Vahvuus")).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(filter("Heikkous"));
  expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Tuottavuuskasvun");
  fireEvent.click(filter("Vinouma"));
  fireEvent.click(screen.getByRole("button", { name: /Vinouma Asuntovarallisuuden/ }));
  fireEvent.click(filter("Kaikki"));
  expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Asuntovarallisuuden");
});

it("opens decision sources, resets expanded content on filter changes and explains evidence limits", () => {
  renderPaths();
  const law = screen.getByRole("button", { name: /2016 Subjektiivista/ });
  fireEvent.click(law);
  expect(law).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("link", { name: /Päätöksen lähde:/ })).toHaveAttribute("href");
  expect(screen.getByText("Vaihtoehtoinen selitys.")).toBeInTheDocument();
  expect(screen.getByText("Miten koetellaan?")).toBeInTheDocument();
  expect(
    screen.getByText(/vaikutusketju ja sen viive tarvitsevat erillistä näyttöä/),
  ).toBeInTheDocument();
  expect(screen.getAllByText(/Vaikutusviive: ei arvioitu/)).toHaveLength(
    ROOT_PATHS[0]!.steps.length,
  );
  expect(screen.getByRole("link", { name: /Syntyvyys ja perhepolitiikka/ })).toHaveAttribute(
    "href",
    "/laboratorio#family-policy",
  );
  fireEvent.click(screen.getByRole("button", { name: "Vahvuus" }));
  fireEvent.click(screen.getByRole("button", { name: "Vinouma" }));
  expect(screen.getByRole("button", { name: /2016 Subjektiivista/ })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});
