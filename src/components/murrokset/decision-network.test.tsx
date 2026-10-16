import { useState } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider,
} from "@tanstack/react-router";
import { afterEach, expect, it } from "vitest";
import { DecisionNetwork } from "./DecisionNetwork";
import { Murrokset } from "./Murrokset";
import { Juurisyyt } from "./Juurisyyt";
import {
  decisionMappings,
  edgesFor,
  isScenario,
  networkEdges,
  networkNode,
  networkNodes,
  networkSource,
  validateNetwork,
} from "./decision-network-model";

afterEach(cleanup);
function Harness({ initial = "d050" }: { initial?: string }) {
  const [decision, setDecision] = useState(initial);
  return <DecisionNetwork key={decision} decisionId={decision} onDecision={setDecision} />;
}
function withRouter(element: React.ReactNode) {
  const router = createRouter({
    routeTree: createRootRoute(),
    history: createMemoryHistory({ initialEntries: ["/murrokset"] }),
  });
  return render(<RouterContextProvider router={router}>{element}</RouterContextProvider>);
}

it("preserves directed source relations, explicit mappings and scenario labels", () => {
  expect(validateNetwork).not.toThrow();
  expect(networkNodes).toHaveLength(340);
  expect(networkEdges).toHaveLength(642);
  expect(networkSource.commit).toMatch(/^[0-9a-f]{40}$/);
  const incoming = edgesFor("kansanterveyslaki-1972", "incoming");
  const outgoing = edgesFor("kansanterveyslaki-1972", "outgoing");
  expect(incoming.every((e) => e.to === "kansanterveyslaki-1972")).toBe(true);
  expect(outgoing.every((e) => e.from === "kansanterveyslaki-1972")).toBe(true);
  expect(incoming.length + outgoing.length).toBe(edgesFor("kansanterveyslaki-1972").length);
  expect(edgesFor("not-a-node")).toEqual([]);
  expect(decisionMappings["d064"]!.match).toBe("context");
  expect(isScenario(networkNode("skenaario-t07-terveyden-ennakointi")!)).toBe(true);
});

it("navigates both directions without inventing edges and returns to the selected decision", () => {
  withRouter(<Harness />);
  const incoming = screen.getByRole("list", { name: "Saapuvat relaatiot" });
  expect(within(incoming).getAllByRole("listitem")).toHaveLength(
    edgesFor("kansanterveyslaki-1972", "incoming").length,
  );
  fireEvent.click(
    within(incoming).getByRole("button", { name: /Kunnallinen äitiys- ja lastenneuvola/ }),
  );
  expect(
    screen.getByRole("heading", { name: "Kunnallinen äitiys- ja lastenneuvola" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "← Edellinen solmu" }));
  expect(screen.getByRole("heading", { name: "Kansanterveyslaki" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Taustat \(/ }));
  expect(screen.queryByRole("list", { name: "Lähtevät relaatiot" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Vertailu" }));
  const table = screen.getByRole("table");
  expect(within(table).getAllByText("Saapuva")).toHaveLength(
    edgesFor("kansanterveyslaki-1972", "incoming").length,
  );
  expect(within(table).queryByText("Lähtevä")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Aineisto" }));
  expect(screen.getByRole("link", { name: "Avaa versioitu alkuperäisaineisto" })).toHaveAttribute(
    "href",
    networkSource.url,
  );
  expect(
    screen.getByText(/ei sisällä erillisiä relaatioiden tutkimuslähteitä/),
  ).toBeInTheDocument();
});

it("shows unmapped decisions without guessed relations and resets focus for a new decision", () => {
  withRouter(<Harness />);
  fireEvent.change(screen.getByRole("combobox", { name: "Aikajanan päätös" }), {
    target: { value: "d073" },
  });
  expect(screen.getByRole("status")).toHaveTextContent(
    "ei ole vielä tarkistettua verkostovastinetta",
  );
  expect(screen.queryByRole("list", { name: "Saapuvat relaatiot" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Syntyvyys ja perhepolitiikka/ })).toHaveAttribute(
    "href",
    "/laboratorio#family-policy",
  );
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "d106" } });
  expect(
    screen.getByRole("heading", { name: networkNode(decisionMappings["d106"]!.nodes[0]!)!.title }),
  ).toBeInTheDocument();
  expect(screen.getByText(/Aiheyhteys, ei täsmällinen päätösvastine/)).toBeInTheDocument();
});

it("opens the selected chronological decision in the network", async () => {
  withRouter(<Murrokset />);
  fireEvent.click(screen.getByRole("button", { name: /1992 Valtion vakuusrahasto perustettiin/ }));
  fireEvent.click(screen.getByRole("button", { name: /Tutki taustoja ja seurauksia/ }));
  expect(await screen.findByRole("combobox", { name: "Aikajanan päätös" })).toHaveValue("d064");
  expect(
    screen.getByRole("heading", { name: networkNode("pankkikriisi")!.title }),
  ).toBeInTheDocument();
});

it("opens the selected root-path decision via the integration callback", () => {
  let selected: string | null = null;
  withRouter(
    <Juurisyyt
      onDecision={(id) => {
        selected = id;
      }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /2016 Subjektiivista/ }));
  fireEvent.click(screen.getByRole("button", { name: /Tutki taustoja ja seurauksia/ }));
  expect(selected).toBe("d095");
});
