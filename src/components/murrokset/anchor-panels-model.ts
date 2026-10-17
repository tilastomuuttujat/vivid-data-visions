import { ANCHORS, anchorLinks, anchorSatellites } from "./ankkurit-model";
import { networkNode } from "./decision-network-model";

/** One fixed scale for all panels, independent of the visible selection. */
export function anchorPanelScale() {
  const years = ANCHORS.flatMap((a) => [
    a.from,
    a.to,
    ...anchorSatellites(a.id).map((s) => s.other.yearStart!),
  ]);
  const min = Math.floor(Math.min(1800, ...years) / 50) * 50;
  const max = Math.ceil(Math.max(2060, ...years) / 50) * 50;
  return { min, max, x: (year: number) => 40 + ((year - min) / (max - min)) * 920 };
}
export function anchorPanelData(id: string) {
  const anchor = ANCHORS.find((a) => a.id === id);
  if (!anchor) throw new Error(`Tuntematon ankkuri: ${id}`);
  const links = anchorLinks().filter((l) => l.from === id || l.to === id);
  const satellites = anchorSatellites(id);
  const all = links.flatMap((l) => l.edges).concat(satellites.map((s) => s.e));
  return {
    anchor,
    links,
    satellites,
    edges: all,
    undated: anchor.nodes.filter((n) => networkNode(n)?.yearStart == null),
  };
}
