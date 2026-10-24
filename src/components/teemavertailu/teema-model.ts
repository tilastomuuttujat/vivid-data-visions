import atlas from "@/data/atlas.json";

export type Step = { year: number; label: string; text: string; stage: number };
export type Theme = { id: number; name: string; thesis?: string; group?: string; steps: Step[] };

export const THEMES = (atlas.themes as Theme[]).filter((t) => t.steps?.length);
export const MAX_THEMES = 6;
export const PALETTE = ["#e0b45c", "#5cc4b4", "#e07a6c", "#8fb3ff", "#c9a0e8", "#a8d08d"];

/** Editorial height for each atlas stage: problem → solution → consolidation → change → contradiction → correction. Not a measurement. */
export const STAGE_LEVEL: Record<number, number> = { 1: 0.2, 2: 0.66, 3: 0.82, 4: 0.52, 5: 0.3, 6: 0.46 };

const rangeMid = (label: string) => {
  const m = label.match(/(\d{4})\D+(\d{4})/);
  return m ? (Number(m[1]) + Number(m[2])) / 2 : null;
};

export type ArcPoint = { x: number; level: number; step: Step };

/** Places a theme's six stages on a time axis. Years stay ordered; the correction stage is drawn as a scenario after the present. */
export function themeArc(theme: Theme): ArcPoint[] {
  const steps = [...theme.steps].sort((a, b) => a.stage - b.stage);
  const out: ArcPoint[] = [];
  for (const s of steps) {
    const prev = out.at(-1)?.x ?? 1850;
    let x = s.stage <= 4 ? rangeMid(s.label) ?? s.year : s.year;
    if (s.stage === 6) x = Math.max(x, 2040);
    x = Math.max(x, prev + 6);
    out.push({ x, level: STAGE_LEVEL[s.stage] ?? 0.5, step: s });
  }
  return out;
}

export const PRESETS: { label: string; ids: number[] }[] = [
  { label: "Demografinen shokki", ids: [6, 30, 7, 17] },
  { label: "Hyvinvointivaltion kaari", ids: [5, 7, 4, 17] },
  { label: "Teollinen murros", ids: [15, 31, 16, 1] },
  { label: "Alueet ja asuminen", ids: [20, 3, 1, 26] },
];

export function addTheme(ids: number[], id: number): number[] {
  if (ids.includes(id) || ids.length >= MAX_THEMES) return ids;
  return [...ids, id];
}
