// Murrosmaisema: one view that places every decision and crisis on time × direction.
// Vertical position encodes the source's own assessment class (arvioLuokka), never measured effect.
import { DECISIONS, TURNS, type Decision } from "./murrokset-model";

export type LensId = "oikeudet" | "talous" | "osaaminen" | "perhe" | "toimeentulo" | "terveys" | "alueet";
export const LENSES: { id: LensId; label: string; icon: string; tone: string }[] = [
  { id: "oikeudet", label: "Oikeudet ja hallinto", icon: "⚖", tone: "oklch(0.72 0.12 300)" },
  { id: "talous", label: "Tuotanto ja talous", icon: "◈", tone: "oklch(0.8 0.13 85)" },
  { id: "osaaminen", label: "Osaaminen", icon: "✦", tone: "oklch(0.74 0.1 195)" },
  { id: "perhe", label: "Perhe ja lapset", icon: "❀", tone: "oklch(0.75 0.13 350)" },
  { id: "toimeentulo", label: "Toimeentulo ja työ", icon: "⇄", tone: "oklch(0.72 0.11 150)" },
  { id: "terveys", label: "Terveys ja hoiva", icon: "✚", tone: "oklch(0.68 0.15 30)" },
  { id: "alueet", label: "Alueet ja liikkuvuus", icon: "◎", tone: "oklch(0.7 0.11 245)" },
];

export function lensOf(teema: string): LensId {
  const t = teema.split(" ")[0];
  if (t === "Koulutus") return "osaaminen";
  if (t === "Perhe") return "perhe";
  if (t === "Terveys") return "terveys";
  if (t === "Alueet" || t === "Liikkuvuus") return "alueet";
  if (t === "Tuotanto" || t === "Verotus" || t === "Julkinen") return "talous";
  if (t === "Toimeentulo" || t === "Työelämä" || t === "Työ" || t === "Kriisit") return "toimeentulo";
  return "oikeudet";
}

export const SCORE: Record<string, number> = {
  vahvistava: 1,
  korjaava: 0.5,
  ristiriitainen: 0,
  arvioimaton: 0,
  heikentava: -1,
};
export const scoreOf = (d: Decision) => {
  const s = SCORE[d.arvioLuokka];
  if (s === undefined) throw new Error(`Tuntematon arvioluokka: ${d.arvioLuokka}`);
  return s;
};

export type Point = { year: number; v: number; spread: number };
/** Kernel-smoothed average direction; sparse years drift toward the neutral line. */
export function smooth(items: { year: number; s: number }[], from = 1850, to = 2025, sigma = 11): Point[] {
  const out: Point[] = [];
  for (let y = from; y <= to; y += 5) {
    let w = 0, ws = 0, ws2 = 0;
    for (const it of items) {
      const k = Math.exp(-((it.year - y) ** 2) / (2 * sigma * sigma));
      w += k; ws += k * it.s; ws2 += k * it.s * it.s;
    }
    const v = ws / (w + 0.4);
    const varc = w > 0 ? Math.max(0, ws2 / w - (ws / w) ** 2) : 0;
    out.push({ year: y, v, spread: 0.08 + Math.sqrt(varc) * 0.35 * Math.min(1, w) });
  }
  return out;
}

export const CRISES = TURNS.filter((t) => t.kind === "kriisi");

export function lensSeries(lens: LensId | "all") {
  const items = DECISIONS.filter((d) => lens === "all" || lensOf(d.teema) === lens).map((d) => ({
    year: d.vuosi,
    s: scoreOf(d),
  }));
  for (const c of CRISES) items.push({ year: (c.from + c.to) / 2, s: -1 });
  return smooth(items);
}

export type Scenario = "heikkenee" | "nykyinen" | "vahvistuu";
export const SCENARIO_TARGET: Record<Scenario, number | null> = { heikkenee: -0.55, nykyinen: null, vahvistuu: 0.55 };
/** Interpretive projection 2025→2050: blends the 2025 level toward the scenario target. */
export function project(last: number, scenario: Scenario): Point[] {
  const target = SCENARIO_TARGET[scenario] ?? last;
  return [2025, 2030, 2035, 2040, 2045, 2050].map((year, i) => ({
    year,
    v: last + (target - last) * (i / 5),
    spread: 0.08 + i * 0.03,
  }));
}
