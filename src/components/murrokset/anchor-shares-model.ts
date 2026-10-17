import { ANCHORS, anchorOf } from "./ankkurit-model";
import { isScenario, networkEdges, networkNode, type NetworkEdge } from "./decision-network-model";
export type ShareKind = "background" | "historical" | "future";
export const SHARE_KINDS: { id: ShareKind; label: string; sub: string }[] = [
  {
    id: "background",
    label: "Saapuvat taustakytkennät",
    sub: "Taustakortti vuodelta 2025 tai aiemmin",
  },
  {
    id: "historical",
    label: "Historialliset jatkokytkennät",
    sub: "Kohdekortti vuodelta 2025 tai aiemmin",
  },
  {
    id: "future",
    label: "Tulevaisuuskytkennät",
    sub: "Kohdekortti vuoden 2025 jälkeen tai skenaario",
  },
];
export type ShareGroup = {
  id: string;
  label: string;
  tone: string;
  count: number;
  percent: number;
  edges: NetworkEdge[];
};
export type ShareDistribution = {
  kind: ShareKind;
  total: number;
  groups: ShareGroup[];
  factors: ShareGroup[];
};
export function anchorShares(anchorId: string, edges: readonly NetworkEdge[] = networkEdges) {
  const anchor = ANCHORS.find((a) => a.id === anchorId);
  if (!anchor) throw new Error("Tuntematon ankkuri: " + anchorId);
  const own = new Set(anchor.nodes);
  const sets: Record<ShareKind, NetworkEdge[]> = { background: [], historical: [], future: [] };
  let internal = 0,
    undatedIncoming = 0,
    undatedOutgoing = 0,
    scenarioIncoming = 0;
  for (const edge of new Map(edges.map((e) => [e.id, e])).values()) {
    const incoming = own.has(edge.to),
      outgoing = own.has(edge.from);
    if (!incoming && !outgoing) continue;
    if (incoming && outgoing) {
      internal++;
      continue;
    }
    const node = networkNode(incoming ? edge.from : edge.to);
    if (!node) continue;
    if (incoming) {
      if (isScenario(node)) {
        scenarioIncoming++;
        continue;
      }
      if (node.yearStart == null) {
        undatedIncoming++;
        continue;
      }
      sets.background.push(edge);
    } else if (isScenario(node)) sets.future.push(edge);
    else if (node.yearStart == null) undatedOutgoing++;
    else sets.historical.push(edge);
  }
  const distributions = SHARE_KINDS.map(({ id: kind }) => {
    const list = sets[kind],
      total = list.length;
    const groups = new Map<string, ShareGroup>(),
      factors = new Map<string, ShareGroup>();
    for (const edge of list) {
      const node = networkNode(kind === "background" ? edge.from : edge.to)!;
      const other = ANCHORS.find((a) => a.id === anchorOf(node.id));
      for (const [map, id, label, tone] of [
        [
          groups,
          other?.id ?? "other",
          other ? `${other.n}. ${other.title}` : "Muut lähdekortit",
          other?.tone ?? "#899aad",
        ],
        [factors, node.id, node.title, other?.tone ?? "#899aad"],
      ] as const) {
        if (!map.has(id)) map.set(id, { id, label, tone, count: 0, percent: 0, edges: [] });
        const group = map.get(id)!;
        group.count++;
        group.edges.push(edge);
        group.percent = (100 * group.count) / total;
      }
    }
    const sort = (a: ShareGroup, b: ShareGroup) =>
      b.count - a.count || a.label.localeCompare(b.label, "fi");
    return {
      kind,
      total,
      groups: [...groups.values()].sort(sort),
      factors: [...factors.values()].sort(sort),
    };
  });
  return { anchor, distributions, internal, undatedIncoming, undatedOutgoing, scenarioIncoming };
}
