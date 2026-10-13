// Ylläpidon tila: muokkaustila, ylläpitäjän tunnistus (GitHub-token selaimessa) ja julkaisemattomat muutokset.
// Muokkaukset kirjoitetaan suoraan ladattuihin JSON-olioihin, joten kaikki näkymät näkevät saman datan.
import { useSyncExternalStore } from 'react';
import anchors from '@/data/anchors.json';
import atlas from '@/data/atlas.json';

export const DATA_FILES = { 'anchors.json': anchors, 'atlas.json': atlas } as Record<string, unknown>;
export type DataFile = keyof typeof DATA_FILES;

export interface Admin { token: string; repo: string; branch: string; login: string }
interface State { admin: Admin | null; editing: boolean; dirty: string[]; version: number; busy: boolean; message: string }

const KEY = 'atlas-admin-v1';
const empty: State = { admin: null, editing: false, dirty: [], version: 0, busy: false, message: '' };
let state: State = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try { const a = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (a?.token) state = { ...state, admin: a }; } catch { /* ignore */ }
}
function set(patch: Partial<State>) { state = { ...state, ...patch }; listeners.forEach(l => l()); }

export function useEditor() {
  return useSyncExternalStore(
    l => { listeners.add(l); return () => listeners.delete(l); },
    () => { load(); return state; },
    () => empty,
  );
}

export const setEditing = (editing: boolean) => set({ editing });

/** Kirjoittaa kentän arvon JSON-olioon ja merkitsee tiedoston julkaisemattomaksi. */
export function updateField(file: string, obj: Record<string, unknown>, field: string, value: unknown) {
  if (obj[field] === value) return;
  obj[field] = value;
  set({ dirty: state.dirty.includes(file) ? state.dirty : [...state.dirty, file], version: state.version + 1, message: '' });
}

async function gh(admin: Pick<Admin, 'token'>, path: string, init?: RequestInit) {
  const r = await fetch(`https://api.github.com/${path}`, {
    ...init,
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${admin.token}`, ...(init?.headers ?? {}) },
  });
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

/** Tarkistaa tokenin ja kirjoitusoikeuden; tallentaa tunnistuksen pysyvästi tähän selaimeen. */
export async function login(token: string, repo: string, branch: string) {
  const user = await gh({ token }, 'user');
  const info = await gh({ token }, `repos/${repo}`);
  if (!info.permissions?.push) throw new Error('Tunnuksella ei ole kirjoitusoikeutta tähän repositorioon.');
  const admin: Admin = { token, repo, branch, login: user.login };
  localStorage.setItem(KEY, JSON.stringify(admin));
  set({ admin, editing: true, message: `Tervetuloa, ${user.login}` });
}

export function logout() { localStorage.removeItem(KEY); set({ admin: null, editing: false }); }

const b64 = (text: string) => { let s = ''; new TextEncoder().encode(text).forEach(b => { s += String.fromCharCode(b); }); return btoa(s); };

/** Lähettää muuttuneet JSON-tiedostot commitina GitHubiin → GitHub Actions julkaisee sivuston. */
export async function publish() {
  const { admin, dirty } = state;
  if (!admin || !dirty.length) return;
  set({ busy: true, message: 'Julkaistaan…' });
  try {
    for (const file of dirty) {
      const path = `repos/${admin.repo}/contents/src/data/${file}`;
      const cur = await gh(admin, `${path}?ref=${admin.branch}`);
      await gh(admin, path, {
        method: 'PUT',
        body: JSON.stringify({
          message: `Päivitetty ${file} muokkaustilasta`,
          content: b64(JSON.stringify(DATA_FILES[file], null, 2) + '\n'),
          sha: cur.sha, branch: admin.branch,
        }),
      });
    }
    set({ busy: false, dirty: [], message: 'Julkaistu ✓ Sivusto päivittyy noin minuutissa.' });
  } catch (e) {
    set({ busy: false, message: `Julkaisu epäonnistui: ${(e as Error).message}` });
  }
}

export function download(file: string) {
  const blob = new Blob([JSON.stringify(DATA_FILES[file], null, 2) + '\n'], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file; a.click();
}
