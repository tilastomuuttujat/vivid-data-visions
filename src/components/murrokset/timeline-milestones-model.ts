import { TURNS } from "./murrokset-model";

// Editorial reference dates taken from the existing turning-point chronology.
export const TIMELINE_MILESTONES = [
  { year: 1918, short: "Sisällissota" },
  { year: 1939, short: "Sodat" },
  { year: 1991, short: "Lama" },
  { year: 2008, short: "Finanssikriisi" },
  { year: 2020, short: "Pandemia" },
].map((item) => {
  const turn = TURNS.find((t) => t.from === item.year && t.kind === "kriisi");
  if (!turn) throw new Error(`Puuttuva murrosjakso: ${item.year}`);
  return { ...item, ...turn, year: item.year };
});
export function milestoneLabels(x: (year: number) => number, min: number, max: number) {
  const ends: number[] = [];
  return TIMELINE_MILESTONES.filter((m) => m.year >= min && m.year <= max).map((m) => {
    const px = x(m.year),
      half = Math.max(40, m.short.length * 3.3);
    let row = ends.findIndex((end) => px - half > end + 8);
    if (row < 0) row = ends.length;
    ends[row] = px + half;
    return { ...m, x: px, row };
  });
}
