import { LINE_TURNS, LINES, SUBLINES, TURNS, YEAR_MAX, YEAR_MIN } from "@/components/kaari/kaari-model";

/**
 * Level on the same rounded Bézier the Kehityskaari draws (controls at the horizontal
 * midpoint): solve x(t) for the year, then return the eased y — no sharp corners.
 */
export function smoothLevel(points: [number, number][], year: number): number {
  if (year <= points[0]![0]) return points[0]![1];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]!;
    const [x1, y1] = points[i]!;
    if (year > x1) continue;
    const u = (year - x0) / (x1 - x0 || 1);
    let lo = 0, hi = 1, t = u;
    for (let k = 0; k < 40; k++) {
      t = (lo + hi) / 2;
      const xt = 1.5 * t * (1 - t) + t * t * t;
      if (xt < u) lo = t; else hi = t;
    }
    return y0 + (y1 - y0) * (3 * (1 - t) * t * t + t * t * t);
  }
  return points.at(-1)![1];
}

/**
 * Synteesikäyrä: rakenteellinen kantokyky = resurssien (tuotanto, väestö) keskiarvo,
 * josta vähennetään velvoitteiden ylitys (turva yli resurssien). Kaikki tasot ovat
 * toimituksellisia tulkintoja Kehityskaaren käyristä, eivät mitattuja arvoja.
 */
export const OVERLOAD_WEIGHT = 0.5;

const line = (id: string) => LINES.find((l) => l.id === id)!;

export function totalAt(year: number): number {
  const t = smoothLevel(line("tuotanto").points, year);
  const k = smoothLevel(line("kantokyky").points, year);
  const s = smoothLevel(line("turva").points, year);
  const resources = (t + k) / 2;
  const balance = (t + k + s) / 3;
  return balance - OVERLOAD_WEIGHT * Math.max(0, s - resources);
}

export type Observable = { id: string; group: string; label: string; note: string; points: [number, number][] };

/** Population groups are editorial readings of a cohort's position, not measured values. */
const COHORTS: Observable[] = [
  { id: "suuret", group: "Väestöryhmät", label: "Suuret ikäluokat (1945–50)", note: "Kasvoivat hyvinvointivaltion mukana, eläköityivät turvatuksi.",
    points: [[1860, 0.3], [1945, 0.3], [1965, 0.5], [1985, 0.75], [2010, 0.82], [2026, 0.7], [2050, 0.45]] },
  { id: "lama", group: "Väestöryhmät", label: "Laman nuoret (1970–80)", note: "Työelämään tullessa joukkotyöttömyys ja leikkaukset.",
    points: [[1860, 0.3], [1970, 0.5], [1985, 0.6], [1993, 0.25], [2008, 0.5], [2026, 0.5], [2050, 0.4]] },
  { id: "lapset", group: "Väestöryhmät", label: "2020-luvun lapset", note: "Pieni ikäluokka, suuri velka- ja hoivakuorma edessä.",
    points: [[1860, 0.3], [2015, 0.35], [2026, 0.32], [2040, 0.3], [2050, 0.32]] },
  { id: "maaseutu", group: "Väestöryhmät", label: "Maaseudun väestö", note: "Pienomistus vahvisti, suuri muutto ja keskittyminen heikensivät.",
    points: [[1860, 0.3], [1921, 0.45], [1950, 0.6], [1975, 0.4], [2000, 0.3], [2026, 0.22], [2050, 0.18]] },
];

export const OBSERVABLES: Observable[] = [
  ...LINES.map((l) => ({ id: l.id, group: "Päävoimat", label: l.label, note: l.question, points: l.points })),
  ...SUBLINES.map((s) => ({ id: s.id, group: `Alavirrat · ${LINES.find((l) => l.id === s.parent)!.label}`, label: s.label, note: s.note, points: s.points })),
  ...COHORTS,
];

export const valueAt = (o: Observable, year: number) => smoothLevel(o.points, year);

export type Sample = { year: number; total: number; value: number; delta: number };

export function sample(o: Observable, step = 1): Sample[] {
  const out: Sample[] = [];
  for (let yr = YEAR_MIN; yr <= YEAR_MAX; yr += step) {
    const total = totalAt(yr);
    const value = valueAt(o, yr);
    out.push({ year: yr, total, value, delta: value - total });
  }
  return out;
}

/** Editorial names for what drives the gap; sign = whether the factor carries (+) or lags (−). */
export type Factor = { year: number; label: string };
const FACTORS: Record<string, Factor[]> = {
  ict: [{ year: 2006, label: "Nokia-klusterin nousu" }, { year: 2015, label: "Älypuhelinmurros, vienti putoaa" }],
  metsa: [{ year: 1890, label: "Höyrysahat ja viennin synty" }, { year: 1960, label: "Paperin kultakausi" }, { year: 2010, label: "Paperin kysyntäromahdus" }],
  suuret: [{ year: 1985, label: "Paras työikä, eläkekertymä" }, { year: 2040, label: "Turvattu eläkeikä" }],
  lama: [{ year: 1993, label: "Joukkotyöttömyys työuran alussa" }],
  lapset: [{ year: 2040, label: "Velka- ja hoivakuorma" }],
  maaseutu: [{ year: 1940, label: "Torpparivapautus, pienomistus" }, { year: 2010, label: "Suuri muutto, keskittyminen" }],
  velka: [{ year: 1993, label: "Pankkikriisi ja alijäämät" }, { year: 2020, label: "Toistuvat alijäämät" }],
  elake: [{ year: 2000, label: "TEL-rahastot puskurina" }],
  syntyvyys: [{ year: 1948, label: "Suuret ikäluokat" }, { year: 2022, label: "Syntyvyyden pudotus" }],
};

const ALL_TURNS = [...TURNS, ...Object.values(LINE_TURNS).flat()];

/**
 * Named factors at the largest gaps: editorial names where written, otherwise the
 * nearest turning point (±12 v). Labels name timing, not proven causes.
 */
export function factorsFor(o: Observable, s: Sample[]): (Sample & { label: string })[] {
  const at = (yr: number) => s.reduce((a, b) => (Math.abs(b.year - yr) < Math.abs(a.year - yr) ? b : a));
  const manual = FACTORS[o.id];
  if (manual) return manual.map((f) => ({ ...at(f.year), label: f.label }));
  const peaks = s.filter((p, i) => i > 0 && i < s.length - 1 && Math.abs(p.delta) > 0.05
    && Math.abs(p.delta) >= Math.abs(s[i - 1]!.delta) && Math.abs(p.delta) >= Math.abs(s[i + 1]!.delta))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const out: (Sample & { label: string })[] = [];
  for (const p of peaks) {
    if (out.length >= 3 || out.some((q) => Math.abs(q.year - p.year) < 25)) continue;
    const t = ALL_TURNS.filter((t) => Math.abs(t.year - p.year) <= 12).sort((a, b) => Math.abs(a.year - p.year) - Math.abs(b.year - p.year))[0];
    if (t) out.push({ ...p, label: t.title });
  }
  return out.sort((a, b) => a.year - b.year);
}
