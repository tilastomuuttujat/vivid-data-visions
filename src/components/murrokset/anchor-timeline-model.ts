import { ANCHORS, anchorOf } from "./ankkurit-model";
import {
  networkEdges,
  networkNode,
  type Direction,
  type NetworkEdge,
  type NetworkNode,
} from "./decision-network-model";

export type TimelineRole = "focus" | "incoming" | "outgoing" | "both" | "context";
export type TimelineNode = { node: NetworkNode; role: TimelineRole; distance: number | null };

/** Follow actual directed edges, never a synthetic link between grouped anchors. */
export function traceRelations(
  roots: string[],
  direction: "incoming" | "outgoing",
  depth: number,
  edges: NetworkEdge[] = networkEdges,
) {
  const distances = new Map(roots.map((id) => [id, 0]));
  const found = new Map<string, NetworkEdge>();
  let frontier = new Set(roots);
  for (let step = 1; step <= depth && frontier.size; step++) {
    const next = new Set<string>();
    for (const edge of edges) {
      const start = direction === "outgoing" ? edge.from : edge.to;
      const end = direction === "outgoing" ? edge.to : edge.from;
      if (!frontier.has(start)) continue;
      found.set(edge.id, edge);
      if (!distances.has(end)) {
        distances.set(end, step);
        next.add(end);
      }
    }
    frontier = next;
  }
  return { distances, edges: [...found.values()] };
}

export function anchorTimeline(
  anchorId: string | null,
  direction: Direction = "all",
  depth: 1 | 2 = 1,
) {
  const anchor = ANCHORS.find((a) => a.id === anchorId);
  const roots = anchor?.nodes ?? ANCHORS.flatMap((a) => a.nodes);
  const incoming = traceRelations(
    roots,
    "incoming",
    anchor && direction !== "outgoing" ? depth : 0,
  );
  const outgoing = traceRelations(
    roots,
    "outgoing",
    anchor && direction !== "incoming" ? depth : 0,
  );
  const edges = anchor
    ? [...new Map([...incoming.edges, ...outgoing.edges].map((e) => [e.id, e])).values()]
    : networkEdges.filter(
        (e) => anchorOf(e.from) && anchorOf(e.to) && anchorOf(e.from) !== anchorOf(e.to),
      );
  const ids = new Set([
    ...ANCHORS.flatMap((a) => a.nodes),
    ...edges.flatMap((e) => [e.from, e.to]),
  ]);
  const nodes: TimelineNode[] = [...ids].map((id) => {
    const node = networkNode(id)!;
    const before = incoming.distances.get(id);
    const after = outgoing.distances.get(id);
    const role: TimelineRole = !anchor
      ? "context"
      : roots.includes(id)
        ? "focus"
        : before != null && after != null
          ? "both"
          : before != null
            ? "incoming"
            : after != null
              ? "outgoing"
              : "context";
    const values = [before, after].filter((v): v is number => v != null);
    return { node, role, distance: values.length ? Math.min(...values) : null };
  });
  return { anchor, roots, nodes, edges, incoming, outgoing };
}

export type PositionedNode = TimelineNode & { x: number; y: number; lane: string };
export function layoutAnchorTimeline(model: ReturnType<typeof anchorTimeline>, showLabels = false) {
  const dated = model.nodes.filter((n) => n.node.yearStart != null);
  const minYear = Math.floor(Math.min(1850, ...dated.map((n) => n.node.yearStart!)) / 25) * 25;
  const maxYear = Math.ceil(Math.max(2025, ...dated.map((n) => n.node.yearStart!)) / 25) * 25;
  const width = 1560;
  const x = (year: number) => 250 + ((year - minYear) / (maxYear - minYear)) * (width - 420);
  const laneDefs = [
    { id: "incoming", title: "", label: "Muut taustat", tone: "var(--m-teal)" },
    ...ANCHORS.map((a) => ({
      id: a.id,
      title: a.title,
      label: `${a.n}. ${a.title}`,
      tone: a.tone,
    })),
    {
      id: "both",
      title: "",
      label: "Molempiin suuntiin liittyvät",
      tone: "var(--m-violet, #a78bfa)",
    },
    { id: "outgoing", title: "", label: "Muut seuraukset", tone: "var(--m-gold)" },
  ];
  const nodes: PositionedNode[] = [];
  let top = 110;
  const lanes = laneDefs.flatMap((lane) => {
    const members = dated
      .filter((n) => (anchorOf(n.node.id) ?? n.role) === lane.id)
      .sort((a, b) => a.node.yearStart! - b.node.yearStart! || a.node.id.localeCompare(b.node.id));
    if (!members.length && !lane.id.startsWith("a")) return [];
    const trackEnds: number[] = [];
    for (const member of members) {
      const px = x(member.node.yearStart!);
      let track = trackEnds.findIndex((end) => px - end >= (showLabels ? 200 : 22));
      if (track < 0) track = trackEnds.length;
      trackEnds[track] = px;
      nodes.push({ ...member, x: px, y: top + 40 + track * (showLabels ? 30 : 22), lane: lane.id });
    }
    const height = Math.max(80, trackEnds.length * (showLabels ? 30 : 22) + 50);
    const result = { ...lane, top, height };
    top += height;
    return [result];
  });
  const positions = new Map(nodes.map((n) => [n.node.id, n]));
  const edges = model.edges.filter((e) => positions.has(e.from) && positions.has(e.to));
  return {
    nodes,
    lanes,
    edges,
    positions,
    width,
    height: top + 36,
    minYear,
    maxYear,
    x,
    undated: model.nodes.filter((n) => n.node.yearStart == null),
  };
}
