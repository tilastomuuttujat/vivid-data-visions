import snapshot from "@/data/research/explanation-path.json";
export const data = snapshot;
export const models = [
  {
    id: "production_components",
    title: "1. Tuotanto",
    short: "Tuotanto / asukas",
    color: "#06716c",
    detail: "Reaalinen BKT asukasta kohti. Vuoden 2015 hinnoin; kuvaajassa 1990 = 100.",
  },
  {
    id: "age_structure",
    title: "2. Työn käyttö",
    short: "Työlliset / koko väestö",
    color: "#a45e13",
    detail:
      "Vuoden lopun rekisterityölliset / koko väestö, %. Katkoviiva pitää vuoden 1987 ikäjakauman vakiona.",
  },
  {
    id: "real_income_components",
    title: "3. Toimeentulo",
    short: "Reaalitulo / asukas",
    color: "#574a9a",
    detail:
      "Kotitaloussektorin käytettävissä oleva reaalitulo / asukas. Vuoden 2025 rahassa; kuvaajassa 1990 = 100. Ei mediaani eikä esimerkkikotitalous.",
  },
] as const;
export const names: Record<string, string> = {
  productivity: "Tuotos työtuntia kohti",
  hours_per_employed: "Työtunnit työllistä kohti",
  employed_per_population: "Työlliset suhteessa väestöön",
  nominal_disposable_income: "Nimellinen käytettävissä oleva tulo",
  prices: "Hintojen muutos",
  population: "Väestömäärä",
};
export function run(id: string) {
  const r = data.runs.find((r) => r.model === id);
  if (!r) throw Error("Malli puuttuu");
  return r;
}
export function point(id: string, year: number) {
  return run(id).points.find(
    (p) => p.year === year && p.status === "computed" && p.actual !== null,
  );
}
export function actual(id: string, year: number): number | null {
  return (
    point(id, year)?.actual ??
    data.history.find((p) => p.model === id && p.year === year)?.actual ??
    null
  );
}
export function displayValue(id: string, year: number): number | null {
  const v = actual(id, year);
  if (v === null) return null;
  const base = actual(id, 1990);
  return id === "age_structure" ? v : base ? (100 * v) / base : null;
}
export function parts(id: string, year: number) {
  return run(id).points.filter(
    (p) => p.year === year && p.status === "computed" && p.effect !== null,
  );
}
export function segments(id: string) {
  const out: { year: number; value: number }[][] = [];
  let segment: { year: number; value: number }[] = [];
  for (let year = 1850; year <= 2050; year++) {
    const value = displayValue(id, year);
    if (value === null) {
      if (segment.length) out.push(segment);
      segment = [];
    } else segment.push({ year, value });
  }
  if (segment.length) out.push(segment);
  return out;
}
export const fmt = (v: number) => v.toLocaleString("fi-FI", { maximumFractionDigits: 1 });
export const signed = (v: number) => `${v > 0 ? "+" : ""}${fmt(v)}`;
export function reading(year: number) {
  const production = change("production_components", year);
  const employment = change("age_structure", year);
  const income = change("real_income_components", year);
  if (production === null || employment === null || income === null) return null;
  if (production > 0 && employment < 0)
    return {
      title: "Tuotanto on elpynyt, työn käyttö ei samassa suhteessa",
      text: "Tuotanto asukasta kohti ylittää vuoden 1990 tason, mutta työllisten osuus väestöstä jää sen alle. Tämä osoittaa eritahtisen kehityksen; se ei yksin kerro, ketkä hyötyivät kasvusta.",
    };
  if (production < 0 && employment < 0)
    return {
      title: "Tuotanto ja työn käyttö supistuivat yhdessä",
      text:
        Math.abs(income) < Math.abs(production)
          ? "Reaalitulo asukasta kohti poikkeaa vuoden 1990 tasosta vähemmän kuin tuotanto. Ero kutsuu tutkimaan tulonsiirtoja, veroja ja muita tulolähteitä; nykyinen malli ei vielä erota niiden vaikutuksia."
          : "Tuotannon, työn ja toimeentulon heikkeneminen näkyy rinnakkain. Samanaikaisuus ei vielä tunnista muutoksen syytä tai sen jakautumista väestöryhmiin.",
    };
  return {
    title: "Muutokset välittyvät eri kanavia",
    text: "Vertaa ensin kokonaismuutoksia. Avaa sen jälkeen osittelu ja erota laskennallinen koostumus muutoksen historiallisista syistä.",
  };
}
export function change(id: string, year: number) {
  const v = actual(id, year),
    b = actual(id, 1990);
  return v === null || b === null ? null : id === "age_structure" ? v - b : 100 * (v / b - 1);
}
// Horizontal control points keep each annual interval between its observed endpoint values.
export function smooth(points: { x: number; y: number }[]) {
  return points
    .map((p, i) => {
      const prev = points[i - 1];
      if (!prev) return `M ${p.x} ${p.y}`;
      const mid = (prev.x + p.x) / 2;
      return `C ${mid} ${prev.y} ${mid} ${p.y} ${p.x} ${p.y}`;
    })
    .join(" ");
}
