import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MechanismTimeline } from "./MechanismTimeline";
import { ERAS, EVENTS, eraOf } from "./mechanism-model";
import { LANDSCAPE, eraWidth, landmarkEvents } from "./landscape-model";

describe("progressive society landscape", () => {
  it("compresses every era into three themes and valid landmarks on a proportional time scale", () => {
    expect(LANDSCAPE).toHaveLength(ERAS.length);
    expect(LANDSCAPE.reduce((sum, _, i) => sum + eraWidth(i), 0)).toBeCloseTo(100);
    LANDSCAPE.forEach((era, i) => {
      expect(era.currents).toHaveLength(3);
      expect(landmarkEvents(i)).toHaveLength(era.nodes.length);
      era.nodes.forEach((id) => {
        const event = EVENTS.find((e) => e.id === id)!;
        expect(event).toBeDefined();
        expect(eraOf(event.year)).toBe(i);
      });
    });
  });
  it("starts with a complete overview and reveals era, then exact source evidence on demand", () => {
    const onExplore = vi.fn();
    const { container } = render(<MechanismTimeline onExplore={onExplore} />);
    expect(
      screen.getByRole("group", { name: "Seitsemän kehitysvaiheen yleiskartta" }),
    ).toBeVisible();
    expect(container.querySelectorAll(".sl-region")).toHaveLength(7);
    expect(container.querySelector(".mt-track")).toBeNull();
    expect(
      screen.queryByRole("article", { name: "Valitun murroksen tarina" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Valitse kysymys ja pääreitti" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Tarkenna aikakauteen 1960–1985/ }));
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Mahdollisuudet laajenevat",
    );
    expect(container.querySelectorAll(".sl-node-row>button")).toHaveLength(3);
    expect(
      screen.queryByRole("article", { name: "Valitun murroksen tarina" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole("region", { name: "Aikakauden keskeiset solmukohdat" })).getByRole(
        "button",
        { name: /Yhteinen peruskoulu/ },
      ),
    );
    expect(screen.getByRole("article", { name: "Valitun murroksen tarina" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Avaa päätöskortti d045" }));
    expect(onExplore).toHaveBeenCalledWith("d045");
    fireEvent.click(screen.getByRole("button", { name: "← Takaisin aikakauden kokonaisuuteen" }));
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Mahdollisuudet laajenevat",
    );
    fireEvent.click(screen.getByRole("button", { name: "Palaa kokonaiskuvaan" }));
    expect(container.querySelectorAll(".sl-region")).toHaveLength(7);
    expect(container.querySelector(".mt-detail")).toBeNull();
  });
  it("keeps the full mechanism atlas optional and preserves the selected era", () => {
    const { container } = render(<MechanismTimeline onExplore={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Tarkenna aikakauteen 1985–2008/ }));
    fireEvent.click(screen.getByText("Miten seitsemän mekanismia näkyvät tässä vaiheessa?"));
    fireEvent.click(screen.getByRole("button", { name: "Avaa kaikkien mekanismien aikajana ↗" }));
    expect(container.querySelectorAll(".mt-track")).toHaveLength(7);
    expect(container.querySelector(".mt-chapter")).toHaveTextContent("Avautuminen ja riippuvuudet");
    fireEvent.click(screen.getByRole("button", { name: "← Takaisin aikakauden kokonaisuuteen" }));
    expect(container.querySelectorAll(".mt-track")).toHaveLength(0);
  });
});
