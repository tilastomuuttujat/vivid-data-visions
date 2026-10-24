import data from "./production-data.json";

export const points = data.points;
export const source = data.source;
export const retrieved = data.retrieved;
export const BASELINES = [1975, 1990, 2007] as const;
export const factors = [
  { id: "productivity", label: "Työn tuottavuus", detail: "BKT tehtyä työtuntia kohti" },
  { id: "hours", label: "Työtunnit työllistä kohti", detail: "Kuinka paljon työllinen keskimäärin tekee töitä" },
  { id: "employment", label: "Työllisten osuus väestöstä", detail: "Kotimaan työlliset / keskiväkiluku" },
] as const;
export type FactorId = (typeof factors)[number]["id"];
export type Row = { year: number; gdp: number; hours: number; employed: number; population: number };

/** GDP/person = (GDP/hour) × (hours/employed) × (employed/population), euros per person at 2015 prices. */
export function factorize(r: Row): [number, number, number] {
  return [(r.gdp * 1e6) / (r.hours * 1e6), (r.hours * 1e6) / (r.employed * 1e3), r.employed / r.population];
}
export const total = (f: [number, number, number]) => f[0] * f[1] * f[2];

/** Exact three-factor Shapley allocation (same closed form as research.impact_shapley3). */
export function shapley3(b: readonly [number, number, number] | number[], c: readonly [number, number, number] | number[]): [number, number, number] {
  const out: number[] = [];
  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3,
      k = (j + 1) % 3;
    const [bi, bj, bk, ci, cj, ck] = [b[i]!, b[j]!, b[k]!, c[i]!, c[j]!, c[k]!];
    out.push((ci - bi) * ((bj * bk) / 3 + (cj * bk + bj * ck) / 6 + (cj * ck) / 3));
  }
  return out as [number, number, number];
}

export function decompose(rows: Row[], baseline: number) {
  const base = rows.find((r) => r.year === baseline);
  if (!base) throw new Error("Vertailuvuosi puuttuu aineistosta");
  const fb = factorize(base);
  const baseTotal = total(fb);
  return rows
    .filter((r) => r.year >= baseline)
    .map((r) => {
      const fx = factorize(r);
      const actual = total(fx);
      const parts = shapley3(fb, fx);
      return { year: r.year, actual, baseTotal, parts };
    });
}

export const factorIndex = (id: FactorId) => factors.findIndex((f) => f.id === id);
