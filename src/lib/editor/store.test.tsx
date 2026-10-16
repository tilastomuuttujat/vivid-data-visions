import { cleanup, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

let editor: typeof import("./store");
let remote: Record<string, unknown>;
let conflict = false;
let race = false;
const requests: { path: string; method: string; body: Record<string, unknown> }[] = [];
beforeEach(async () => {
  vi.resetModules();
  localStorage.clear();
  sessionStorage.clear();
  requests.length = 0;
  conflict = false;
  race = false;
  editor = await import("./store");
  remote = structuredClone(editor.DATA_FILES);
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const path = new URL(url).pathname;
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      requests.push({ path, method, body });
      let result: unknown;
      if (path === "/user") result = { login: "test-admin" };
      else if (path.endsWith("/test/repo")) result = { permissions: { push: true } };
      else if (path.includes("/contents/")) {
        const file = path.split("/").at(-1)!;
        result = {
          sha: (conflict ? "other-" : "base-") + file,
          content: Buffer.from(JSON.stringify(remote[file])).toString("base64"),
        };
      } else if (path.includes("/git/ref/heads/")) result = { object: { sha: "head" } };
      else if (path.endsWith("/git/commits/head")) result = { tree: { sha: "base-tree" } };
      else if (path.endsWith("/git/blobs")) result = { sha: "blob-" + requests.length };
      else if (path.endsWith("/git/trees")) result = { sha: "new-tree" };
      else if (path.endsWith("/git/commits")) result = { sha: "new-commit" };
      else if (path.includes("/git/refs/heads/")) {
        if (race) return new Response("Branch changed", { status: 422 });
        result = {};
      } else throw new Error(`Unexpected request ${path}`);
      return new Response(JSON.stringify(result), { status: 200 });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function State() {
  const state = editor.useEditor();
  return (
    <div>
      <p role="status">{state.message}</p>
      <p data-testid="dirty">{state.dirty.join(",")}</p>
    </div>
  );
}
async function prepare() {
  render(<State />);
  await act(() => editor.login("test-token", "test/repo", "main"));
  const anchors = editor.DATA_FILES["anchors.json"] as { anchors: { title: string }[] };
  const atlas = editor.DATA_FILES["atlas.json"] as { themes: { name: string }[] };
  act(() => {
    editor.updateField("anchors.json", anchors.anchors[0]!, "title", "Edited anchor");
    editor.updateField("atlas.json", atlas.themes[0]!, "name", "Edited theme");
  });
}

it("publishes both files atomically and stores the token only for the session", async () => {
  await prepare();
  expect(localStorage.getItem("atlas-admin-v1")).toBeNull();
  expect(sessionStorage.getItem("atlas-admin-v1")).toContain("test-token");
  await act(() => editor.publish());
  const commits = requests.filter((r) => r.method === "POST" && r.path.endsWith("/git/commits"));
  expect(commits).toHaveLength(1);
  const tree = requests.find((r) => r.method === "POST" && r.path.endsWith("/git/trees"))!;
  expect(tree.body["tree"]).toHaveLength(2);
  expect(requests.find((r) => r.method === "PATCH")!.body).toEqual({
    sha: "new-commit",
    force: false,
  });
  expect(screen.getByTestId("dirty")).toBeEmptyDOMElement();
  expect(screen.getByRole("status")).toHaveTextContent("Julkaistu yhtenä commitina");
});

it("rejects stale data before creating a commit and retains edits", async () => {
  await prepare();
  conflict = true;
  await act(() => editor.publish());
  expect(screen.getByRole("status")).toHaveTextContent("on muuttunut GitHubissa");
  expect(requests.some((r) => r.method === "POST")).toBe(false);
  expect(screen.getByTestId("dirty")).toHaveTextContent("anchors.json,atlas.json");
});

it("rejects login when the loaded page data differs from the target branch", async () => {
  (remote["atlas.json"] as { themes: { name: string }[] }).themes[0]!.name = "Changed on GitHub";
  await expect(editor.login("test-token", "test/repo", "main")).rejects.toThrow(
    "on muuttunut tämän sivuversion jälkeen",
  );
  expect(sessionStorage.getItem("atlas-admin-v1")).toBeNull();
});

it("retains edits if the branch advances during publication and never forces the update", async () => {
  await prepare();
  race = true;
  await act(() => editor.publish());
  expect(screen.getByRole("status")).toHaveTextContent("Julkaisu epäonnistui");
  expect(screen.getByTestId("dirty")).toHaveTextContent("anchors.json,atlas.json");
  expect(requests.find((r) => r.method === "PATCH")!.body["force"]).toBe(false);
});
