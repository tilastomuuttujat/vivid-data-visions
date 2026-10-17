// Compact view of the same source-directed anchor network as the systemic timeline.
import { ANCHORS, anchorLinks } from "./ankkurit-model";
import { anchorTimeline } from "./anchor-timeline-model";
import { linkedDecisions, type NetworkEdge } from "./decision-network-model";

export type LensId =
  "oikeudet" | "talous" | "osaaminen" | "perhe" | "toimeentulo" | "terveys" | "alueet";
export const LENSES: { id: LensId; label: string; icon: string; tone: string }[] = [
  { id: "oikeudet", label: "Oikeudet ja hallinto", icon: "⚖", tone: "oklch(0.72 0.12 300)" },
  { id: "talous", label: "Tuotanto ja talous", icon: "◈", tone: "oklch(0.8 0.13 85)" },
  { id: "osaaminen", label: "Osaaminen", icon: "✦", tone: "oklch(0.74 0.1 195)" },
  { id: "perhe", label: "Perhe ja lapset", icon: "❀", tone: "oklch(0.75 0.13 350)" },
  { id: "toimeentulo", label: "Toimeentulo ja työ", icon: "⇄", tone: "oklch(0.72 0.11 150)" },
  { id: "terveys", label: "Terveys ja hoiva", icon: "✚", tone: "oklch(0.68 0.15 30)" },
  { id: "alueet", label: "Alueet ja liikkuvuus", icon: "◎", tone: "oklch(0.7 0.11 245)" },
];
const THEME_WORDS: Record<LensId, RegExp> = {
  oikeudet: /oikeu|hallinto|sääntely|kuluttaj|turvallisuus/i,
  talous: /tuotanto|talous|verotus|energia|rahoitus/i,
  osaaminen: /koulutus|sivistys|osaaminen|tutkimus/i,
  perhe: /perhe|laps/i,
  toimeentulo: /toimeentulo|työ|eläk|velat|kriisit|riskinjako/i,
  terveys: /terveys|hoiva/i,
  alueet: /alueet|asuminen|liikkuvuus|integraatio/i,
};
/** Editorial grouping of the explicit theme field; composite themes can match several lenses. */
export function themeLenses(theme: string): LensId[] {
  return LENSES.filter((l) => THEME_WORDS[l.id].test(theme)).map((l) => l.id);
}
/** Themes come only through the explicit decision crosswalk, never guessed from node titles. */
export function nodeLenses(id: string): Set<LensId> {
  return new Set(linkedDecisions(id).flatMap((d) => themeLenses(d.teema)));
}
export function matchesLens(ids: string[], lenses: Set<LensId>) {
  return (
    lenses.size === 0 || ids.some((id) => [...nodeLenses(id)].some((lens) => lenses.has(lens)))
  );
}
export const LANDSCAPE_WIDTH = 1240;
export const LANDSCAPE_HEIGHT = 470;
export const landscapeX = (year: number) => 60 + ((year - 1850) / 175) * 1110;
export const landscapeAnchors = () =>
  ANCHORS.map((anchor, i) => ({
    ...anchor,
    x: landscapeX((anchor.from + anchor.to) / 2),
    y: 105 + (i % 3) * 115,
  }));
export function landscapeLinks() {
  return anchorLinks().map((link) => ({ ...link, id: `${link.from}>${link.to}` }));
}
export const labelLines = (text: string, max = 24) => {
  const lines: string[] = [];
  for (const word of text.split(" ")) {
    const last = lines.at(-1);
    if (last && last.length + word.length + 1 <= max) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return lines;
};

/** Detail geometry compresses the same node-level relations without creating group shortcuts. */
export function focusLandscape(model: ReturnType<typeof anchorTimeline>) {
  const visible = new Set([...model.roots, ...model.edges.flatMap((e) => [e.from, e.to])]);
  const nodes = model.nodes.filter((n) => visible.has(n.node.id));
  const dated = nodes.filter((n) => n.node.yearStart != null);
  const min = Math.floor(Math.min(1850, ...dated.map((n) => n.node.yearStart!)) / 25) * 25;
  const max = Math.ceil(Math.max(2025, ...dated.map((n) => n.node.yearStart!)) / 25) * 25;
  const x = (year: number) => 160 + ((year - min) / (max - min)) * 1000;
  const positioned: ((typeof nodes)[number] & { x: number; y: number })[] = [];
  let top = 60;
  const lanes = ["incoming", "focus", "both", "outgoing"].flatMap((role) => {
    const members = dated
      .filter((n) => n.role === role)
      .sort((a, b) => a.node.yearStart! - b.node.yearStart! || a.node.id.localeCompare(b.node.id));
    if (!members.length) return [];
    const tracks: number[] = [];
    for (const member of members) {
      const px = x(member.node.yearStart!);
      let track = tracks.findIndex((end) => px - end >= 22);
      if (track < 0) track = tracks.length;
      tracks[track] = px;
      positioned.push({ ...member, x: px, y: top + 28 + track * 22 });
    }
    const height = Math.max(70, 40 + tracks.length * 22);
    const lane = { role, top, height };
    top += height;
    return [lane];
  });
  const positions = new Map(positioned.map((n) => [n.node.id, n]));
  const edges: NetworkEdge[] = model.edges.filter(
    (e) => positions.has(e.from) && positions.has(e.to),
  );
  return {
    nodes: positioned,
    positions,
    edges,
    lanes,
    min,
    max,
    x,
    height: top + 25,
    undated: nodes.filter((n) => n.node.yearStart == null),
  };
}
