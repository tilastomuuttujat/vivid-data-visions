import { ANCHORS } from "./ankkurit-model";
import { ARC_GROUPS, arcGroup, type ArcGroup } from "./KaariAikajana";
import { anchorPanelData, anchorPanelScale } from "./anchor-panels-model";
import { traceRelations } from "./anchor-timeline-model";
import { networkNode, type Direction, type NetworkEdge } from "./decision-network-model";

export type ExplorerFilters = {
  mode: "highlight" | "filter";
  anchors: string[];
  direction: Direction;
  groups: ArcGroup[];
  years: [number, number];
  zoom: boolean;
  depth: 1 | 2;
};
export function defaultExplorerFilters(): ExplorerFilters {
  const s = anchorPanelScale();
  return {
    mode: "highlight",
    anchors: [],
    direction: "all",
    groups: Object.keys(ARC_GROUPS) as ArcGroup[],
    years: [s.min, s.max],
    zoom: false,
    depth: 1,
  };
}
export function explorerEdges(ids: string[]) {
  return [
    ...new Map(ids.flatMap((id) => anchorPanelData(id).edges).map((e) => [e.id, e])).values(),
  ];
}
export function explorerPaths(
  ids: string[],
  nodeId: string | null,
  direction: Direction,
  depth: 1 | 2,
) {
  const edges = explorerEdges(ids);
  if (!nodeId) return null;
  const incoming =
    direction === "outgoing" ? [] : traceRelations([nodeId], "incoming", depth, edges).edges;
  const outgoing =
    direction === "incoming" ? [] : traceRelations([nodeId], "outgoing", depth, edges).edges;
  return new Set([...incoming, ...outgoing].map((e) => e.id));
}
export function explorerEdgeMatch(
  edge: NetworkEdge,
  anchorId: string,
  filters: ExplorerFilters,
  nodeId: string | null,
  path: Set<string> | null,
) {
  if (filters.anchors.length && !filters.anchors.includes(anchorId)) return false;
  if (!filters.groups.includes(arcGroup(edge.type))) return false;
  const own = ANCHORS.find((a) => a.id === anchorId)!.nodes;
  if (
    !nodeId &&
    filters.direction !== "all" &&
    !(filters.direction === "incoming" ? own.includes(edge.to) : own.includes(edge.from))
  )
    return false;
  if (path && !path.has(edge.id)) return false;
  const years = [networkNode(edge.from)?.yearStart, networkNode(edge.to)?.yearStart].filter(
    (v): v is number => v != null,
  );
  if (!years.length)
    return (
      filters.years[0] === anchorPanelScale().min && filters.years[1] === anchorPanelScale().max
    );
  return Math.min(...years) <= filters.years[1] && Math.max(...years) >= filters.years[0];
}
export function stackTicks(min: number, max: number) {
  const step = max - min <= 50 ? 10 : 50;
  const ticks = [min];
  for (let y = Math.ceil(min / step) * step; y < max; y += step) if (y > min) ticks.push(y);
  ticks.push(max);
  return ticks;
}
