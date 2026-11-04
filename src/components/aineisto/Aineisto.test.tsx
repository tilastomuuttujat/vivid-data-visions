import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Aineisto } from "./Aineisto";
vi.mock("@/components/MainLinks", () => ({ MainLinks: () => null }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const catalog = { version: 1, source: "Turso", observations: 3, images: [{ id: 1, title: "Kuva", file: "images/a.webp", purpose: "Vertailu", original_path: "a.webp", archive_path: "a.webp" }], series: [{ series_key: "x", title: "Työllisyys", observations: 3, file: "series/x.json", source_url: "javascript:alert(1)", source: "Lähde" }] };
describe("Public archive browser", () => {
  it("loads only the chosen series and preserves zero, missing values and groups", async () => {
    const fetcher = vi.fn(async (url: string) => ({ ok: true, json: async () => url.endsWith("catalog.json") ? catalog : { series_key: "x", rows: [[1990, "a", "Ryhmä A", null, "0", null, "observed"], [2000, "a", "Ryhmä A", null, null, null, "estimate"], [2001, "b", "Ryhmä B", null, "123.456789123456789", null, "observed"]] } }));
    vi.stubGlobal("fetch", fetcher);
    render(<Aineisto />);
    fireEvent.click(await screen.findByRole("button", { name: /Työllisyys/ }));
    await screen.findByText("Puuttuva");
    expect(screen.getByText("0", { selector: "td" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Lähde" })).toBeNull();
    fireEvent.change(screen.getByLabelText("Havaintoryhmä"), { target: { value: "b" } });
    expect(screen.getByText("123.456789123456789")).toBeInTheDocument();
    expect(screen.queryByText("Puuttuva", { selector: "td" })).toBeNull();
    expect(fetcher.mock.calls.map(c => c[0])).toEqual(["data/turso/catalog.json", "data/turso/series/x.json"]);
    fireEvent.click(screen.getByRole("button", { name: "Kuvat" }));
    expect(screen.getByAltText("Kuva")).toHaveAttribute("src", "data/turso/images/a.webp");
  });
  it("shows a recoverable error when the publication is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    render(<Aineisto />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Yritä uudelleen" })).toBeInTheDocument();
  });
});
