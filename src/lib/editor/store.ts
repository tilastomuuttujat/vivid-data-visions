// Ylläpidon tila: muokkaustila, ylläpitäjän tunnistus (GitHub-token selaimessa) ja julkaisemattomat muutokset.
// Muokkaukset kirjoitetaan suoraan ladattuihin JSON-olioihin, joten kaikki näkymät näkevät saman datan.
import { useSyncExternalStore } from "react";
import anchors from "@/data/anchors.json";
import atlas from "@/data/atlas.json";
import { validateData } from "@/lib/atlas-data";

export const DATA_FILES = { "anchors.json": anchors, "atlas.json": atlas } as Record<
  string,
  unknown
>;
export type DataFile = keyof typeof DATA_FILES;

export interface Admin {
  token: string;
  repo: string;
  branch: string;
  login: string;
}
interface State {
  admin: Admin | null;
  editing: boolean;
  dirty: string[];
  version: number;
  busy: boolean;
  message: string;
}

const KEY = "atlas-admin-v1";
const baselineContent = new Map(
  Object.entries(DATA_FILES).map(([file, data]) => [file, canonical(data)]),
);
const baselineShas = new Map<string, string>();
function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, v]) => JSON.stringify(key) + ":" + canonical(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value) ?? "null";
}
function decodeContent(content: string) {
  return JSON.parse(
    new TextDecoder().decode(
      Uint8Array.from(atob(content.replace(/\s/g, "")), (c) => c.charCodeAt(0)),
    ),
  );
}
const empty: State = {
  admin: null,
  editing: false,
  dirty: [],
  version: 0,
  busy: false,
  message: "",
};
let state: State = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* Storage may be unavailable. */
  }
  try {
    const a = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
    if (a?.token) state = { ...state, admin: a };
  } catch {
    /* ignore */
  }
}
function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useEditor() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => {
      load();
      return state;
    },
    () => empty,
  );
}

export const setEditing = (editing: boolean) => set({ editing });

/** Kirjoittaa kentän arvon JSON-olioon ja merkitsee tiedoston julkaisemattomaksi. */
export function updateField(
  file: string,
  obj: Record<string, unknown>,
  field: string,
  value: unknown,
) {
  if (state.busy) return;
  if (!(file in DATA_FILES)) throw new Error("Tuntematon datatiedosto.");
  if (obj[field] === value) return;
  obj[field] = value;
  set({
    dirty: state.dirty.includes(file) ? state.dirty : [...state.dirty, file],
    version: state.version + 1,
    message: "",
  });
}

async function gh(admin: Pick<Admin, "token">, path: string, init?: RequestInit) {
  const r = await fetch(`https://api.github.com/${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${admin.token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

/** Tarkistaa oikeudet ja datan lähtöversion; token säilyy vain selainistunnossa. */
export async function login(token: string, repo: string, branch: string) {
  const user = await gh({ token }, "user");
  const info = await gh({ token }, `repos/${repo}`);
  if (!info.permissions?.push)
    throw new Error("Tunnuksella ei ole kirjoitusoikeutta tähän repositorioon.");
  const admin: Admin = { token, repo, branch, login: user.login };
  const files = await Promise.all(
    Object.keys(DATA_FILES).map(async (file) => {
      const remote = await gh(
        admin,
        `repos/${repo}/contents/src/data/${file}?ref=${encodeURIComponent(branch)}`,
      );
      if (canonical(decodeContent(remote.content)) !== baselineContent.get(file))
        throw new Error(
          `${file} on muuttunut tämän sivuversion jälkeen. Lataa ajantasainen sivu ennen muokkausta.`,
        );
      return [file, remote.sha] as const;
    }),
  );
  baselineShas.clear();
  files.forEach(([file, sha]) => baselineShas.set(file, sha));
  sessionStorage.setItem(KEY, JSON.stringify(admin));
  set({ admin, editing: true, message: `Tervetuloa, ${user.login}` });
}

export function logout() {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
  baselineShas.clear();
  set({ admin: null, editing: false });
}

/** Julkaisee kaikki tiedostot yhtenä commitina ja estää vanhan lähtöversion ylikirjoituksen. */
export async function publish() {
  const { admin, dirty } = state;
  if (!admin || !dirty.length || state.busy) return;
  set({ busy: true, message: "Julkaistaan…" });
  try {
    if (dirty.includes("atlas.json")) validateData(DATA_FILES["atlas.json"]);
    const contents = dirty.map((file) => ({
      file,
      content: JSON.stringify(DATA_FILES[file], null, 2) + "\n",
    }));
    const root = `repos/${admin.repo}`;
    const head = await gh(admin, `${root}/git/ref/heads/${encodeURIComponent(admin.branch)}`);
    const commit = await gh(admin, `${root}/git/commits/${head.object.sha}`);
    for (const { file } of contents) {
      const current = await gh(admin, `${root}/contents/src/data/${file}?ref=${head.object.sha}`);
      // Restored sessions have no cached SHA: compare immutable page baseline instead.
      const matches = baselineShas.has(file)
        ? baselineShas.get(file) === current.sha
        : canonical(decodeContent(current.content)) === baselineContent.get(file);
      if (!matches)
        throw new Error(
          `${file} on muuttunut GitHubissa. Muutoksiasi ei ylikirjoiteta; lataa omat muutokset talteen ja sovita ne ajantasaiseen aineistoon.`,
        );
    }
    const blobs = await Promise.all(
      contents.map(async ({ file, content }) => {
        const blob = await gh(admin, `${root}/git/blobs`, {
          method: "POST",
          body: JSON.stringify({ content, encoding: "utf-8" }),
        });
        return { file, content, sha: blob.sha as string };
      }),
    );
    const tree = await gh(admin, `${root}/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        base_tree: commit.tree.sha,
        tree: blobs.map((b) => ({
          path: `src/data/${b.file}`,
          mode: "100644",
          type: "blob",
          sha: b.sha,
        })),
      }),
    });
    const next = await gh(admin, `${root}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message: `Päivitetty ${dirty.join(", ")} muokkaustilasta`,
        tree: tree.sha,
        parents: [head.object.sha],
      }),
    });
    await gh(admin, `${root}/git/refs/heads/${encodeURIComponent(admin.branch)}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: next.sha, force: false }),
    });
    blobs.forEach((b) => {
      baselineShas.set(b.file, b.sha);
      baselineContent.set(b.file, canonical(JSON.parse(b.content)));
    });
    set({
      busy: false,
      dirty: [],
      message: "Julkaistu yhtenä commitina ✓ Sivusto päivittyy julkaisun tarkistusten jälkeen.",
    });
  } catch (e) {
    set({ busy: false, message: `Julkaisu epäonnistui: ${(e as Error).message}` });
  }
}

export function download(file: string) {
  const blob = new Blob([JSON.stringify(DATA_FILES[file], null, 2) + "\n"], {
    type: "application/json",
  });
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = file;
  a.click();
  URL.revokeObjectURL(url);
}
