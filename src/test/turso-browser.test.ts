import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
const script = readFileSync("scripts/editorial/turso-browser.js", "utf8");
type Transport = (path: string, data?: unknown) => Promise<unknown>;
function factory(fetcher: unknown): Transport {
  new Function(script)();
  return (window as unknown as { createTursoArticleTransport: (fetcher: unknown) => Transport }).createTursoArticleTransport(fetcher);
}
function table(records: Record<string, unknown>[]) {
  const names = Object.keys(records[0] ?? {});
  return { cols: names.map(name => ({ name })), rows: records.map(row => names.map(name => {
    const value = row[name]; return value === null ? { type: "null" } : typeof value === "number" ? { type: "integer", value: String(value) } : { type: "text", value: String(value) };
  })) };
}
const original = { title: "Title", summary: "", body_text: "Old text", tags_json: "[]", status: "draft", editorial_note: "", review_flags_json: "[]", change_note: "" };
function mock(conflict = false) {
  return vi.fn(async (_url: string, options: RequestInit) => {
    const payload = JSON.parse(options.body as string);
    return { ok: true, json: async () => ({ baton: payload.requests.some((r: { type: string }) => r.type === "close") ? null : "private-connection", results: payload.requests.map((request: { type: string; stmt?: { sql: string } }) => {
      if (request.type === "close") return { type: "ok", response: { type: "close" } };
      const sql = request.stmt!.sql;
      let data: Record<string, unknown>[] = [];
      if (sql.includes("count(*)")) data = [{ count: 34 }];
      else if (sql.includes("changes()")) data = [{ affected: conflict ? 0 : 1 }];
      else if (sql.startsWith("SELECT title")) data = sql.includes(" AS revision") ? [{ ...original, body_text: "New text", revision: 2 }] : [original];
      return { type: "ok", response: { type: "execute", result: table(data) } };
    }) }) };
  });
}
const login = { url: "libsql://test.turso.io", password: "private-test-token" };
afterEach(() => { delete (window as unknown as Record<string, unknown>)["articleEditorTransport"]; delete (window as unknown as Record<string, unknown>)["createTursoArticleTransport"]; });
describe("Standalone Turso browser transport", () => {
  it("uses HTTPS and keeps credentials out of storage and clears them on disconnect", async () => {
    const fetcher = mock(), api = factory(fetcher);
    await api("/api/login", login);
    expect(fetcher.mock.calls[0]![0]).toBe("https://test.turso.io/v2/pipeline");
    expect(fetcher.mock.calls[0]![1]).toMatchObject({ credentials: "omit", redirect: "error", headers: { Authorization: "Bearer private-test-token" } });
    await api("/api/logout", {});
    await expect(api("/api/articles")).rejects.toThrow("Avaa ensin");
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
  it("rejects non-Turso destinations before transmitting credentials", async () => {
    const fetcher = mock(), api = factory(fetcher);
    await expect(api("/api/login", { ...login, url: "https://evil.example" })).rejects.toThrow("tietokantaosoite");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("guards the version, verifies the readback and commits only afterwards", async () => {
    const fetcher = mock(), api = factory(fetcher);
    await api("/api/login", login);
    await expect(api("/api/articles/one", { expected_revision: 1, changes: { body_text: "New text" } })).resolves.toEqual({ revision: 2 });
    const requests = fetcher.mock.calls.map(c => JSON.parse(c[1].body as string));
    const update = requests.flatMap(r => r.requests).find((r: { stmt?: { sql: string } }) => r.stmt?.sql.startsWith("UPDATE"));
    expect(update.stmt.sql).toContain("max(revision_no)");
    expect(update.stmt.args.at(-1)).toEqual({ type: "integer", value: "1" });
    expect(requests[4].requests[0].stmt.sql).toBe("COMMIT");
    expect(requests[4].baton).toBe("private-connection");
  });
  it("does not send an update if BEGIN fails", async () => {
    const inner = mock(); let count = 0;
    const fetcher = vi.fn(async (url: string, options: RequestInit) => {
      const response = await inner(url, options); count++;
      if (count !== 2) return response;
      return { ok: true, json: async () => ({ baton: "private-connection", results: [
        { type: "ok", response: { type: "execute", result: table([]) } },
        { type: "error", error: { code: "SQLITE_BUSY" } }
      ] }) };
    });
    const api = factory(fetcher); await api("/api/login", login);
    await expect(api("/api/articles/one", { expected_revision: 1, changes: { body_text: "New text" } })).rejects.toThrow("ei voitu vahvistaa");
    const sql = inner.mock.calls.flatMap(c => JSON.parse(c[1].body as string).requests.map((r: { stmt?: { sql: string } }) => r.stmt?.sql || ""));
    expect(sql.some((s: string) => s.startsWith("UPDATE"))).toBe(false);
    expect(sql).not.toContain("COMMIT");
  });
  it("rolls back a stale save without issuing a commit", async () => {
    const fetcher = mock(true), api = factory(fetcher);
    await api("/api/login", login);
    await expect(api("/api/articles/one", { expected_revision: 1, changes: { body_text: "New text" } })).rejects.toThrow("muuttui muualla");
    const sql = fetcher.mock.calls.flatMap(c => JSON.parse(c[1].body as string).requests.map((r: { stmt?: { sql: string } }) => r.stmt?.sql));
    expect(sql).toContain("ROLLBACK"); expect(sql).not.toContain("COMMIT");
  });
});
