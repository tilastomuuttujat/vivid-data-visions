import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ANCHORS } from "./ankkurit-model";
import { anchorStackLayout } from "./anchor-stack-model";
import { ARC_GROUPS, arcGroup } from "./KaariAikajana";
import { isScenario, networkNode, type NetworkEdge } from "./decision-network-model";
import { MilestoneDetails, TimelineMilestones } from "./TimelineMilestones";
import {
  defaultExplorerFilters,
  explorerPaths,
  explorerEdges,
  explorerEdgeMatch,
  stackTicks,
} from "./anchor-explorer-model";
import { AnchorExplorerControls } from "./AnchorExplorerControls";
import { AnchorExplorerDetails } from "./AnchorExplorerDetails";
import "./anchor-stack.css";
import "./anchor-explorer.css";

const activate = (e: React.KeyboardEvent, action: () => void) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    action();
  }
};

export function AnchorStack({ ids, markers }: { ids: string[]; markers: boolean }) {
  const [spacious, setSpacious] = useState(false);
  const [filters, setFilters] = useState(defaultExplorerFilters);
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ anchorId: string; edgeId: string } | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [controls, setControls] = useState(false);
  const [inspector, setInspector] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [showCursor, setShowCursor] = useState(true);
  const uid = useId().replace(/:/g, "");
  const panelId = `${uid}-controls`;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTrigger = useRef<{ focus: (options?: FocusOptions) => void } | null>(null);
  const visibleIds = useMemo(
    () =>
      filters.mode === "filter" && filters.anchors.length
        ? ids.filter((id) => filters.anchors.includes(id))
        : ids,
    [ids, filters.anchors, filters.mode],
  );
  const layout = useMemo(
    () => anchorStackLayout(visibleIds, spacious, filters.zoom ? filters.years : undefined),
    [visibleIds, spacious, filters.zoom, filters.years],
  );
  const path = useMemo(
    () => explorerPaths(ids, nodeId, filters.direction, filters.depth),
    [ids, nodeId, filters.direction, filters.depth],
  );
  const matches = useMemo(
    () =>
      new Map(
        layout.rows.map((row) => [
          row.anchor.id,
          new Set(
            row.data.edges
              .filter((e) => explorerEdgeMatch(e, row.anchor.id, filters, nodeId, path))
              .map((e) => e.id),
          ),
        ]),
      ),
    [layout, filters, nodeId, path],
  );
  const matchingIds = useMemo(
    () => new Set([...matches.values()].flatMap((set) => [...set])),
    [matches],
  );
  const allIds = useMemo(() => new Set(explorerEdges(ids).map((e) => e.id)), [ids]);
  const activeRow = layout.rows.find((row) => row.anchor.id === picked?.anchorId);
  const edge = activeRow?.data.edges.find((e) => e.id === picked?.edgeId);
  const selectedAnchor = filters.anchors.length === 1 ? filters.anchors[0]! : null;
  const closeControls = () => {
    setControls(false);
    toggleRef.current?.focus({ preventScroll: true });
  };
  const closeInspector = () => {
    setInspector(false);
    lastTrigger.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (!controls) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setControls(false);
        toggleRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [controls]);
  const selectNode = (id: string) => {
    setNodeId(id);
    setPicked(null);
    setControls(false);
    setInspector(true);
  };
  const selectEdge = (anchorId: string, edgeId: string) => {
    setPicked({ anchorId, edgeId });
    setControls(false);
    setInspector(true);
  };
  const selectAnchor = (id: string) => {
    setFilters((f) => ({
      ...f,
      anchors: f.anchors.length === 1 && f.anchors[0] === id ? [] : [id],
    }));
    setNodeId(null);
    setPicked(null);
    setControls(false);
    setInspector(true);
  };
  const reset = () => {
    setFilters(defaultExplorerFilters());
    setNodeId(null);
    setPicked(null);
    setInspector(false);
    setCursor(null);
    if (scrollRef.current) scrollRef.current.scrollLeft = 0;
  };
  const ax = (id: string) => {
    const a = ANCHORS.find((a) => a.id === id)!;
    return layout.x((a.from + a.to) / 2);
  };
  if (!ids.length) return null;
  return (
    <div className="as">
      <div className="as-tools">
        <button
          ref={toggleRef}
          aria-expanded={controls}
          aria-controls={panelId}
          onClick={() => {
            if (controls) closeControls();
            else {
              setControls(true);
              setInspector(false);
            }
          }}
        >
          Ohjauspaneeli
        </button>
        <label>
          <input
            type="checkbox"
            checked={spacious}
            onChange={(e) => setSpacious(e.target.checked)}
          />{" "}
          Väljemmät rivit
        </label>
        <button
          onClick={() => {
            setFilters((f) => ({ ...f, anchors: [] }));
            setNodeId(null);
            setPicked(null);
            setInspector(false);
          }}
        >
          Poista rivikorostus
        </button>
        {nodeId && (
          <button
            onClick={() => {
              setNodeId(null);
              setPicked(null);
              setInspector(false);
            }}
          >
            Poista korttivalinta
          </button>
        )}
        {!inspector && (nodeId || picked || selectedAnchor) && (
          <button
            onClick={() => {
              setInspector(true);
              setControls(false);
            }}
          >
            Näytä valinnan tiedot
          </button>
        )}
        <button onClick={reset}>Palauta kokonaiskuva</button>
      </div>
      <div className="ae-status" role="status">
        {filters.mode === "highlight" ? "Korostettu" : "Näkyvissä"}: {matchingIds.size} /{" "}
        {allIds.size} lähderelaatiota · {filters.years[0]}–{filters.years[1]}
        {nodeId ? ` · Kortti: ${networkNode(nodeId)?.title ?? nodeId}` : ""}
      </div>
      {!matchingIds.size && (
        <p className="ae-empty">
          Valintaan ei osu lähderelaatioita. Muuta valintoja tai palauta kokonaiskuva.
        </p>
      )}
      <div className="ae-cursor-tools">
        <label>
          <input
            type="checkbox"
            checked={showCursor}
            onChange={(e) => setShowCursor(e.target.checked)}
          />{" "}
          Yhteinen vuosikohdistin
        </label>
        {showCursor && (
          <>
            <input
              type="range"
              aria-label="Yhteinen vuosikohdistin"
              min={layout.min}
              max={layout.max}
              step={1}
              value={cursor ?? layout.min}
              onChange={(e) => setCursor(Number(e.target.value))}
            />
            <output>{cursor ?? "–"}</output>
          </>
        )}
      </div>
      <div className="ae-workbench">
        <figure className="as-figure">
          <div
            className="as-scroll"
            ref={scrollRef}
            role="region"
            tabIndex={0}
            aria-label="Ankkurien yhteinen vieritettävä kaarikuvaaja"
          >
            <div className="as-canvas" style={{ aspectRatio: `${layout.width}/${layout.height}` }}>
              <div className="as-labels">
                {layout.rows.map((row) => (
                  <div
                    key={row.anchor.id}
                    className={filters.anchors.includes(row.anchor.id) ? "on" : ""}
                    style={
                      {
                        top: `${(row.top / layout.height) * 100}%`,
                        height: `${(layout.rowHeight / layout.height) * 100}%`,
                        "--as-tone": row.anchor.tone,
                      } as React.CSSProperties
                    }
                  >
                    <button
                      aria-pressed={filters.anchors.includes(row.anchor.id)}
                      onClick={(e) => {
                        lastTrigger.current = e.currentTarget;
                        selectAnchor(row.anchor.id);
                      }}
                    >
                      <b>
                        {row.anchor.n}. {row.anchor.title}
                      </b>
                      <small>
                        {row.anchor.from}–{row.anchor.to}
                      </small>
                    </button>
                  </div>
                ))}
              </div>
              <svg
                viewBox={`0 0 ${layout.width} ${layout.height}`}
                role="group"
                aria-label="Ankkurit 1–7: kokonaiset kaarikuviot yhteisessä kuvaajassa"
                onPointerMove={(e) => {
                  if (!showCursor) return;
                  const rect = e.currentTarget.getBoundingClientRect(),
                    px = ((e.clientX - rect.left) / rect.width) * layout.width;
                  if (px >= 220 && px <= 1160)
                    setCursor(
                      Math.round(layout.min + ((px - 220) / 940) * (layout.max - layout.min)),
                    );
                }}
              >
                <defs>
                  <clipPath id={`${uid}-plot`}>
                    <rect x={220} y={94} width={940} height={Math.max(0, layout.height - 116)} />
                  </clipPath>
                  {Object.entries(ARC_GROUPS).map(([id, group]) => (
                    <marker
                      key={id}
                      id={`${uid}-${id}`}
                      markerWidth="7"
                      markerHeight="7"
                      refX="7"
                      refY="3.5"
                      orient="auto"
                      markerUnits="userSpaceOnUse"
                    >
                      <path d="M0 0 L7 3.5 L0 7 Z" fill={group.tone} />
                    </marker>
                  ))}
                </defs>
                {stackTicks(layout.min, layout.max).map((year) => (
                  <g key={year} className="as-grid">
                    <line x1={layout.x(year)} x2={layout.x(year)} y1={94} y2={layout.height - 22} />
                    <text x={layout.x(year)} y={25} textAnchor="middle">
                      {year}
                    </text>
                    <text x={layout.x(year)} y={layout.height - 4} textAnchor="middle">
                      {year}
                    </text>
                  </g>
                ))}
                {markers && (
                  <TimelineMilestones
                    x={layout.x}
                    min={layout.min}
                    max={layout.max}
                    bottom={layout.height - 22}
                    onSelect={setMilestone}
                  />
                )}
                {layout.rows.map((row) => {
                  const { anchor, data, mid } = row;
                  const matched = matches.get(anchor.id)!;
                  const draw = (e: NetworkEdge, from: number, to: number, h: number) => {
                    const match = matched.has(e.id);
                    if (filters.mode === "filter" && !match) return null;
                    if (filters.zoom) {
                      const years = [
                        networkNode(e.from)?.yearStart,
                        networkNode(e.to)?.yearStart,
                      ].filter((y): y is number => y != null);
                      if (
                        !years.length ||
                        Math.max(...years) < layout.min ||
                        Math.min(...years) > layout.max
                      )
                        return null;
                    }
                    const group = arcGroup(e.type),
                      end = to - Math.sign(to - from) * (anchor.nodes.includes(e.to) ? 12 : 6),
                      d = `M${from} ${mid} C${from} ${mid + h},${end} ${mid + h},${end} ${mid}`;
                    const on = picked?.edgeId === e.id || (nodeId != null && path?.has(e.id));
                    const name = `${networkNode(e.from)!.title} → ${networkNode(e.to)!.title}`;
                    return (
                      <g
                        key={e.id}
                        className={`as-relation${on && match ? " on" : ""}${!match ? " ae-muted" : ""}`}
                        style={{ color: ARC_GROUPS[group].tone }}
                        data-edge-id={e.id}
                        data-match={String(match)}
                      >
                        <path d={d} className="as-arc" markerEnd={`url(#${uid}-${group})`} />
                        <path
                          d={d}
                          className="as-hit"
                          role="button"
                          tabIndex={0}
                          aria-label={`Ankkuri ${anchor.n}: ${name}`}
                          onClick={(event) => {
                            lastTrigger.current = event.currentTarget;
                            selectEdge(anchor.id, e.id);
                          }}
                          onKeyDown={(event) =>
                            activate(event, () => {
                              lastTrigger.current = event.currentTarget;
                              selectEdge(anchor.id, e.id);
                            })
                          }
                        >
                          <title>
                            {name} · {e.type} · {e.id}
                          </title>
                        </path>
                      </g>
                    );
                  };
                  const maxHeight = layout.rowHeight / 2 - 12;
                  const points = new Map(data.satellites.map((s) => [s.other.id, s.other]));
                  if (nodeId && data.edges.some((e) => e.from === nodeId || e.to === nodeId)) {
                    const n = networkNode(nodeId);
                    if (n) points.set(n.id, n);
                  }
                  return (
                    <g
                      key={anchor.id}
                      data-anchor-id={anchor.id}
                      role="group"
                      aria-label={`Ankkurin ${anchor.n} kaaristo`}
                      className={`as-row${filters.anchors.length && !filters.anchors.includes(anchor.id) ? " dim" : ""}`}
                      clipPath={`url(#${uid}-plot)`}
                    >
                      <line
                        className="as-divider"
                        x1={0}
                        x2={layout.width}
                        y1={row.top + layout.rowHeight}
                        y2={row.top + layout.rowHeight}
                      />
                      <line className="as-baseline" x1={220} x2={1160} y1={mid} y2={mid} />
                      {data.links.flatMap((l) =>
                        l.edges.map((e, i) =>
                          draw(
                            e,
                            ax(l.from),
                            ax(l.to),
                            -Math.min(
                              maxHeight,
                              16 + Math.abs(ax(l.to) - ax(l.from)) * 0.2 + i * 4,
                            ),
                          ),
                        ),
                      )}
                      {data.satellites.map(({ e, other, incoming }) => {
                        const from = incoming ? layout.x(other.yearStart!) : ax(anchor.id),
                          to = incoming ? ax(anchor.id) : layout.x(other.yearStart!);
                        return draw(
                          e,
                          from,
                          to,
                          Math.min(maxHeight, 12 + Math.abs(to - from) * 0.2),
                        );
                      })}
                      {ANCHORS.map((a) => {
                        const px = ax(a.id);
                        if (px < 220 || px > 1160) return null;
                        return (
                          <g
                            key={a.id}
                            role="button"
                            tabIndex={0}
                            aria-label={`Ankkuriryhmä ${a.n}, kaaristo ${anchor.n}: ${a.title}`}
                            className={`as-anchor${a.id === anchor.id ? " own" : " context"}${nodeId && a.nodes.includes(nodeId) ? " ae-related-anchor" : ""}`}
                            style={{ color: a.tone }}
                            onClick={(event) => {
                              lastTrigger.current = event.currentTarget;
                              selectAnchor(a.id);
                            }}
                            onKeyDown={(event) =>
                              activate(event, () => {
                                lastTrigger.current = event.currentTarget;
                                selectAnchor(a.id);
                              })
                            }
                          >
                            <circle cx={px} cy={mid} r={a.id === anchor.id ? 10 : 4} />
                            {a.id === anchor.id && (
                              <text x={px} y={mid + 3.5} textAnchor="middle">
                                {a.n}
                              </text>
                            )}
                            <title>
                              {a.n}. {a.title} · {a.from}–{a.to}
                            </title>
                          </g>
                        );
                      })}
                      {[...points.values()]
                        .filter(
                          (n) =>
                            n.yearStart != null &&
                            n.yearStart >= layout.min &&
                            n.yearStart <= layout.max,
                        )
                        .map((node) => {
                          const match = data.edges.some(
                            (e) => (e.from === node.id || e.to === node.id) && matched.has(e.id),
                          );
                          if (filters.mode === "filter" && !match) return null;
                          return (
                            <g
                              key={node.id}
                              role="button"
                              tabIndex={0}
                              data-node-id={node.id}
                              aria-label={`${node.yearStart} ${node.title}${isScenario(node) ? " · skenaario" : ""}`}
                              className={`ae-node${nodeId === node.id ? " on" : ""}${!match ? " ae-muted" : ""}`}
                              onClick={(event) => {
                                lastTrigger.current = event.currentTarget;
                                selectNode(node.id);
                              }}
                              onKeyDown={(event) =>
                                activate(event, () => {
                                  lastTrigger.current = event.currentTarget;
                                  selectNode(node.id);
                                })
                              }
                            >
                              <circle
                                className={`as-satellite${isScenario(node) ? " scenario" : ""}`}
                                cx={layout.x(node.yearStart!)}
                                cy={mid}
                                r={nodeId === node.id ? 5 : 3}
                              />
                              <title>
                                {node.yearStart} · {node.title}
                                {isScenario(node) ? " · Skenaario" : ""}
                              </title>
                              {nodeId === node.id && (
                                <text
                                  x={Math.min(1000, Math.max(230, layout.x(node.yearStart!) + 10))}
                                  y={mid - 13}
                                >
                                  {node.title.length > 28
                                    ? node.title.slice(0, 26) + "…"
                                    : node.title}
                                </text>
                              )}
                            </g>
                          );
                        })}
                    </g>
                  );
                })}
                {showCursor && cursor != null && cursor >= layout.min && cursor <= layout.max && (
                  <g className="ae-year-cursor" aria-hidden="true">
                    <line
                      x1={layout.x(cursor)}
                      x2={layout.x(cursor)}
                      y1={90}
                      y2={layout.height - 22}
                    />
                    <text x={layout.x(cursor)} y={88} textAnchor="middle">
                      {cursor}
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>
          <figcaption>
            Yksi kuvaaja ja yhteinen aika-akseli. Valitse pieni piste tutkiaksesi lähdekorttia eri
            riveillä tai nuoli avataksesi relaation. Iso numero edustaa ankkuriryhmää. Korostus
            säilyttää muun aineiston himmeänä; Rajaa piilottaa valintaan kuulumattomat yhteydet.
            Lähennetyn aikavälin ulkopuolelle jatkuvan nuolen päätekortit voi tarkistaa valinnan
            tiedoista.
          </figcaption>
        </figure>
        {controls && (
          <AnchorExplorerControls
            nodeTitle={nodeId ? (networkNode(nodeId)?.title ?? nodeId) : null}
            onClearNode={() => {
              setNodeId(null);
              setPicked(null);
            }}
            panelId={panelId}
            filters={filters}
            onChange={setFilters}
            onReset={reset}
            onClose={closeControls}
          />
        )}
        {inspector && !controls && (
          <AnchorExplorerDetails
            nodeId={picked ? null : nodeId}
            edge={edge}
            anchorId={picked?.anchorId ?? selectedAnchor}
            onNode={selectNode}
            onClose={closeInspector}
          />
        )}
      </div>
      <MilestoneDetails year={markers ? milestone : null} onClose={() => setMilestone(null)} />
      <details className="as-text">
        <summary>Kaaristot ja alkuperäiset relaatiot tekstimuodossa</summary>
        {layout.rows.map((row) => (
          <section key={row.anchor.id}>
            <h3>
              {row.anchor.n}. {row.anchor.title}
            </h3>
            <ul>
              {row.data.edges
                .filter((e) => filters.mode !== "filter" || matches.get(row.anchor.id)!.has(e.id))
                .map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={(event) => {
                        lastTrigger.current = event.currentTarget;
                        selectEdge(row.anchor.id, e.id);
                      }}
                    >
                      {networkNode(e.from)!.title} → {networkNode(e.to)!.title} · {e.id}
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </details>
    </div>
  );
}
