import source from '@/data/atlas.json';

export interface Step { stage: number; year: number; label: string; text: string }
export interface Theme { id: number; name: string; thesis: string; group: string; steps: Step[]; window: string; connections: string; test: string }
export interface AtlasData { schema_version: number; themes: Theme[]; links: { source: string; target: string; kind: string }[] }
export const initialData = source as AtlasData;
export const groups = ['Arki ja hyvinvointi', 'Talous ja työ', 'Valta ja osallisuus', 'Ympäristö ja turvallisuus'];
export const stages = ['Ongelma', 'Ratkaisu', 'Vakiintuminen', 'Muutos', 'Ristiriita', 'Korjausliike'];
export function groupIndex(group: string) { return Math.max(0, groups.indexOf(group)); }
export function validateData(value: unknown): AtlasData {
  if (!value || typeof value !== 'object' || !('themes' in value) || !Array.isArray(value.themes) || !value.themes.length) throw new Error('JSON-tiedostossa tulee olla vähintään yksi teema.');
  const ids = new Set<number>();
  for (const theme of value.themes) {
    if (!theme || typeof theme.id !== 'number' || ids.has(theme.id) || typeof theme.name !== 'string' || typeof theme.group !== 'string' || typeof theme.thesis !== 'string' || !Array.isArray(theme.steps) || !theme.steps.length) throw new Error('Teeman tiedot puuttuvat tai tunniste on päällekkäinen.');
    ids.add(theme.id);
    for (const s of theme.steps) if (!s || !Number.isInteger(s.stage) || s.stage < 1 || s.stage > 6 || !Number.isFinite(s.year) || typeof s.text !== 'string' || typeof s.label !== 'string') throw new Error('Vaiheen vuosi, numero tai kuvaus puuttuu.');
  }
  const raw = value as Partial<AtlasData>;
  return { schema_version: raw.schema_version ?? 3, themes: value.themes.map(t => ({ id: t.id, name: t.name, thesis: t.thesis, group: t.group, steps: t.steps.map((s: Step)=>({stage:s.stage,year:s.year,label:s.label,text:s.text})), window: typeof t.window === 'string' ? t.window : '', connections: typeof t.connections === 'string' ? t.connections : '', test: typeof t.test === 'string' ? t.test : '' })), links: Array.isArray(raw.links) ? raw.links.filter(l => l && typeof l.source === 'string' && typeof l.target === 'string' && typeof l.kind === 'string') : [] };
}
export function connections(data: AtlasData) {
  const seen = new Set<string>();
  return data.links.filter(l => l.kind === 'association').map(l => [Number(l.source.split('-')[0]), Number(l.target.split('-')[0])] as [number, number]).filter(([a,b]) => {
    const key = [a,b].sort((x,y)=>x-y).join('-');
    if (a === b || seen.has(key) || !data.themes.some(t=>t.id===a) || !data.themes.some(t=>t.id===b)) return false;
    seen.add(key); return true;
  });
}
export function layoutNodes(data: AtlasData) {
  const centers: [number,number][] = [[270,235],[680,215],[425,490],[795,470]];
  return data.themes.map(theme => {
    const g = groupIndex(theme.group), members = data.themes.filter(t=>t.group===theme.group), index = members.findIndex(t=>t.id===theme.id);
    const a = index / members.length * Math.PI * 2 - Math.PI/2;
    const radius = members.length > 8 ? 148 : 115;
    const center = centers[g] ?? [270,235];
    return { theme, x: (center[0] ?? 270) + Math.cos(a)*radius, y: (center[1] ?? 235) + Math.sin(a)*radius*.68, group: g };
  });
}