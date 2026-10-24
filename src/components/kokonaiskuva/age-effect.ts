import data from "./employment-age-data.json";
export const ageData = data;
export const FIRST = data.rows[0]!.year,
  LAST = data.rows.at(-1)!.year;
export const views = [
  { id: "all", label: "Ikärakenne kokonaisuutena", ages: data.groups.map((g) => g.id) },
  { id: "young", label: "Alle 25-vuotiaiden osuus", ages: ["0-17", "18-24"] },
  { id: "prime", label: "25–44-vuotiaiden osuus", ages: ["25-29", "30-34", "35-39", "40-44"] },
  { id: "middle", label: "45–64-vuotiaiden osuus", ages: ["45-49", "50-54", "55-59", "60-64"] },
  { id: "old", label: "65 vuotta täyttäneiden osuus", ages: ["65-69", "70-74", "75-"] },
] as const;
export type Profile = { year: number; weights: number[]; rates: number[] };
export function profile(year: number): Profile {
  const row = data.rows.find((r) => r.year === year);
  if (!row) throw new Error("Vuosi puuttuu lähteestä");
  return {
    year,
    weights: row.population.map((p) => p / row.totalPopulation),
    rates: row.employed.map((e, i) => e / row.population[i]!),
  };
}
export function assess(current: Profile, base: Profile) {
  if (current.weights.length !== base.weights.length || current.rates.length !== base.rates.length)
    throw new Error("Ryhmät eivät vastaa toisiaan");
  for (const p of [current, base])
    if (
      p.weights.length !== p.rates.length ||
      Math.abs(p.weights.reduce((a, b) => a + b, 0) - 1) > 1e-10 ||
      p.weights.some((w) => !Number.isFinite(w) || w < 0) ||
      p.rates.some((r) => !Number.isFinite(r) || r < 0 || r > 1)
    )
      throw new Error("Virheellinen väestöprofiili");
  const actual = 100 * current.weights.reduce((sum, w, i) => sum + w * current.rates[i]!, 0);
  const reference = 100 * base.weights.reduce((sum, w, i) => sum + w * current.rates[i]!, 0);
  // Centered allocation sums exactly to the aggregate composition effect; it is an accounting convention.
  const parts = current.weights.map(
    (w, i) => (w - base.weights[i]!) * (100 * current.rates[i]! - reference),
  );
  return { year: current.year, actual, reference, effect: actual - reference, parts };
}
export function allocated(parts: number[], viewId: string) {
  const view = views.find((v) => v.id === viewId);
  if (!view) throw new Error("Tuntematon ryhmä");
  return parts.reduce(
    (sum, p, i) => sum + ((view.ages as readonly string[]).includes(data.groups[i]!.id) ? p : 0),
    0,
  );
}
export function historic(baseYear: number) {
  const base = profile(baseYear);
  return data.rows.filter((r) => r.year >= baseYear).map((row) => assess(profile(row.year), base));
}
export const futures = [
  {
    id: "fixed",
    label: "Ikäjakauma säilyy",
    description: `Vuoden ${LAST} ikäjakauma ja ikäryhmittäiset työllisten osuudet säilyvät. Ei väestöennuste.`,
  },
  {
    id: "continue",
    label: "Rakennemuutos jatkuu",
    description: `Vuosien ${LAST - 10}–${LAST} ikäosuuksien keskimääräinen vuosimuutos jatkuu suoraviivaisesti. Ikäryhmittäiset työllisten osuudet pysyvät vuoden ${LAST} tasolla. Ei väestöennuste.`,
  },
] as const;
export function futureProfiles(mode: string): Profile[] {
  if (!futures.some((f) => f.id === mode)) throw new Error("Tuntematon skenaario");
  const now = profile(LAST),
    before = profile(LAST - 10);
  return Array.from({ length: 2050 - LAST + 1 }, (_, offset) => {
    const weights = now.weights.map((w, i) =>
      mode === "fixed" ? w : Math.max(0, w + ((w - before.weights[i]!) / 10) * offset),
    );
    const sum = weights.reduce((a, b) => a + b, 0);
    return { year: LAST + offset, weights: weights.map((w) => w / sum), rates: now.rates };
  });
}
