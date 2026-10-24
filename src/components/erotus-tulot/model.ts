import data from "../planeetta/household-example-data.json";
export const vintages = data.vintages;
export type Point = (typeof vintages)[number]["profiles"][number]["points"][number];
export const factors = [
  { id: "gross", label: "Bruttotulot", detail: "Palkka, eläke tai veronalainen päiväraha" },
  { id: "transfers", label: "Muut etuudet", detail: "Lähteen erikseen ilmoittamat tulonsiirrot" },
  { id: "taxes", label: "Verot ja maksut", detail: "Kasvu pienentää käytettävissä olevia tuloja" },
] as const;
export type Factor = (typeof factors)[number]["id"];
export const residual = (p: Point) => p.net - (p.gross + p.transfers - p.taxes);
export function contribution(base: Point, point: Point, factor: Factor) {
  return (point[factor] - base[factor]) * (factor === "taxes" ? -1 : 1);
}
export function decompose(base: Point, point: Point) {
  return [
    ...factors.map((f) => ({ id: f.id, label: f.label, value: contribution(base, point, f.id) })),
    { id: "rounding", label: "Lähteen pyöristysero", value: residual(point) - residual(base) },
  ];
}
export function series(points: Point[], baseYear: number, factor: Factor) {
  const base = points.find((p) => p.year === baseYear);
  if (!base) throw new Error("Vertailuvuosi puuttuu aineistosta");
  return points
    .filter((p) => p.year >= baseYear)
    .map((p) => ({
      ...p,
      contribution: contribution(base, p, factor),
      comparison: p.net - contribution(base, p, factor),
    }));
}
/** Shape-preserving cubic: control points stay inside each segment's endpoint range.
 * Curves are display interpolation only; no additional observations are produced. */
export function curve(points: { x: number; y: number }[]) {
  return points
    .map((p, i) => {
      if (!i) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1]!;
      const mid = (p.x + prev.x) / 2;
      return `C ${mid} ${prev.y} ${mid} ${p.y} ${p.x} ${p.y}`;
    })
    .join(" ");
}
