import { LINES, SUBLINES, YEAR_MAX, YEAR_MIN, levelAt } from "@/components/kaari/kaari-model";

/**
 * Synteesikäyrä: rakenteellinen kantokyky = resurssien (tuotanto, väestö) keskiarvo,
 * josta vähennetään velvoitteiden ylitys (turva yli resurssien). Kaikki tasot ovat
 * toimituksellisia tulkintoja Kehityskaaren käyristä, eivät mitattuja arvoja.
 */
export const OVERLOAD_WEIGHT = 0.5;

const line = (id: string) => LINES.find((l) => l.id === id)!;

export function totalAt(year: number): number {
  const t = levelAt(line("tuotanto"), year);
  const k = levelAt(line("kantokyky"), year);
  const s = levelAt(line("turva"), year);
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

export const valueAt = (o: Observable, year: number) => levelAt({ id: o.id, label: "", tone: "", question: "", points: o.points }, year);

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
