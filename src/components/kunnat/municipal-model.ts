import raw from "./municipal-data.json";
export type Indicator = {
  id: string;
  label: string;
  unit: string;
  group: string;
  source: string;
  code: string;
  sourceLabel: string;
  formula: string | null;
  note: string | null;
  fixedYear: number | null;
};
export type Municipality = { id: string; name: string; values: (number | null)[] };
export type Pair = {
  a: number;
  b: number;
  r: number;
  p: number;
  n: number;
  controls: number;
  qBH: number;
  qBY: number;
  structural: string | null;
};
export type Family = {
  method: string;
  adjusted: boolean;
  mixed: boolean;
  tests: number;
  pairs: Pair[];
};
export type Snapshot = {
  year: number;
  rows: Municipality[];
  families: Family[];
  coverage: number[];
};
export const municipalData = raw as {
  schemaVersion: number;
  retrieved: string;
  geography: string;
  method: string;
  indicators: Indicator[];
  sources: {
    id: string;
    url: string;
    label: string;
    updated: string | null;
    retrieved: string;
    query: unknown;
  }[];
  snapshots: Snapshot[];
};
export const pairKey = (a: number, b: number) => `${Math.min(a, b)}:${Math.max(a, b)}`;
export const passes = (
  p: Pair,
  minimum: number,
  q: number,
  correction: "qBY" | "qBH",
  structural: boolean,
) => Math.abs(p.r) >= minimum && p[correction] <= q && (structural || !p.structural);
export function observations(rows: Municipality[], a: number, b: number, adjusted = false) {
  return rows.filter((row) =>
    [a, b, ...(adjusted ? [0, 3, 1] : [])].every((i) => row.values[i] != null),
  );
}
const csvCell = (value: unknown) => '"' + String(value ?? "").replaceAll('"', '""') + '"';
export const csv = (rows: unknown[][]) =>
  "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
export function dataCSV(snapshot: Snapshot) {
  return csv([
    [
      "Kuntatunnus",
      "Kunta",
      "Vertailuvuosi",
      ...municipalData.indicators.map(
        (i) => `${i.label} (${i.unit}; ${i.fixedYear ?? snapshot.year})`,
      ),
    ],
    ...snapshot.rows.map((row) => [row.id, row.name, snapshot.year, ...row.values]),
  ]);
}
export function correlationsCSV(snapshot: Snapshot, family: Family) {
  return csv([
    [
      "A",
      "B",
      "Vuosi A",
      "Vuosi B",
      "Menetelmä",
      "Vakioitu",
      "r",
      "n",
      "p (iid-approksimaatio)",
      "q BY",
      "q BH",
      "Rakenteellinen yhteys",
    ],
    ...family.pairs.map((p) => [
      municipalData.indicators[p.a]!.label,
      municipalData.indicators[p.b]!.label,
      municipalData.indicators[p.a]!.fixedYear ?? snapshot.year,
      municipalData.indicators[p.b]!.fixedYear ?? snapshot.year,
      family.method,
      family.adjusted,
      p.r,
      p.n,
      p.p,
      p.qBY,
      p.qBH,
      p.structural,
    ]),
  ]);
}
