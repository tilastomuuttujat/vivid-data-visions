import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";

const html = readFileSync("scripts/editorial/editor.html", "utf8");
const script = readFileSync("scripts/editorial/editor.js", "utf8");
const initial = { id: "one", title: "Ensimmäinen artikkeli", body_text: "Alkuperäinen teksti", summary: "", tags_json: "[]", status: "draft", editorial_note: "", change_note: "Alkutuonti", review_flags_json: "[]", revision: 1, page_start: 1, page_end: 6 };
afterEach(() => { document.body.replaceChildren(); vi.unstubAllGlobals(); });
async function setup(conflict = false) {
  document.body.innerHTML = html.split("<body>")[1]!.split("</body>")[0]!;
  const fetcher = vi.fn(async (path: string, options?: RequestInit) => {
    let data: unknown;
    if (path === "/api/session") data = { csrf: "csrf-token" };
    else if (path === "/api/articles") data = { articles: [{ ...initial, source_position: 1 }] };
    else if (path === "/api/articles/one/history") data = [{ revision_no: 1, title: initial.title, status: "draft", change_note: "Alkutuonti", saved_at: "2026-11-04" }];
    else if (path === "/api/articles/one/history/1") data = { ...initial, revision_no: 1 };
    else if (path === "/api/articles/one" && options?.method === "POST") {
      if (conflict) return { ok: false, json: async () => ({ error: "Artikkeli muuttui muualla." }) };
      data = { revision: 2 };
    } else data = initial;
    return { ok: true, json: async () => data };
  });
  vi.stubGlobal("fetch", fetcher); vi.stubGlobal("confirm", vi.fn().mockReturnValue(true));
  new Function(script)();
  fireEvent.click(await screen.findByRole("button", { name: /Ensimmäinen artikkeli/ }));
  await screen.findByDisplayValue("Alkuperäinen teksti");
  await waitFor(() => expect(screen.getByLabelText("Artikkeliteksti")).not.toBeDisabled());
  return fetcher;
}
describe("Browser article editor", () => {
  it("saves edited text with a revision guard and a CSRF token", async () => {
    const fetcher = await setup();
    expect(screen.getByRole("button", { name: "Tallenna uusi versio" })).toBeDisabled();
    fireEvent.input(screen.getByLabelText("Artikkeliteksti"), { target: { value: "Muokattu teksti" } });
    fireEvent.submit(document.getElementById("article-form")!);
    await screen.findByText("Tallennettu. Nykyinen versio on 2.");
    const request = fetcher.mock.calls.find(c => c[1]?.method === "POST");
    expect(JSON.parse(request![1]!.body as string)).toMatchObject({ expected_revision: 1, changes: { body_text: "Muokattu teksti" } });
    expect(request![1]!.headers).toMatchObject({ "X-Editor-CSRF": "csrf-token" });
    expect(screen.getByDisplayValue("Muokattu teksti")).toBeInTheDocument();
  });
  it("preserves the draft after a conflicting save", async () => {
    await setup(true);
    fireEvent.input(screen.getByLabelText("Artikkeliteksti"), { target: { value: "Oma tallentamaton teksti" } });
    fireEvent.submit(document.getElementById("article-form")!);
    await screen.findByText("Artikkeli muuttui muualla.");
    expect(screen.getByDisplayValue("Oma tallentamaton teksti")).toBeInTheDocument();
    expect(screen.getByText("Tallentamattomia muutoksia")).toBeInTheDocument();
  });
  it("restores history into the draft without saving it automatically", async () => {
    const fetcher = await setup();
    fireEvent.click(await screen.findByRole("button", { name: /Versio 1 ·/ }));
    await screen.findByText("Versio 1: Ensimmäinen artikkeli");
    fireEvent.click(screen.getByRole("button", { name: "Tuo tämä versio muokattavaksi" }));
    expect(screen.getByDisplayValue("Palautettu versio 1")).toBeInTheDocument();
    expect(fetcher.mock.calls.filter(c => c[1]?.method === "POST")).toHaveLength(0);
  });
});
