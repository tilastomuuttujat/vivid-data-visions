import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ANCHORS } from "./ankkurit-model";
import { anchorStackLayout } from "./anchor-stack-model";
import { ARC_GROUPS, arcGroup } from "./KaariAikajana";
import { isScenario, networkNode, networkSource, type NetworkEdge } from "./decision-network-model";
import { MilestoneDetails, TimelineMilestones } from "./TimelineMilestones";
import "./anchor-stack.css";

const activate = (e: React.KeyboardEvent, action: () => void) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    action();
  }
};

export function AnchorStack({ ids, markers }: { ids: string[]; markers: boolean }) {
  const [spacious, setSpacious] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ anchorId: string; edgeId: string } | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);
  const uid = useId().replace(/:/g, "");
  const layout = useMemo(() => anchorStackLayout(ids, spacious), [ids, spacious]);
  const detailRef = useRef<HTMLElement>(null);
  const activeRow = layout.rows.find((r) => r.anchor.id === picked?.anchorId);
  const edge = activeRow?.data.edges.find((e) => e.id === picked?.edgeId);
  const focusedRow = layout.rows.find((r) => r.anchor.id === focus);
  useEffect(() => {
    if (picked) detailRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [picked]);
  const ax = (id: string) => {
    const a = ANCHORS.find((a) => a.id === id)!;
    return layout.x((a.from + a.to) / 2);
  };
  if (!layout.rows.length) return null;
  return (
    <div className="as">
      <div className="as-tools">
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
            setFocus(null);
            setPicked(null);
          }}
        >
          Poista rivikorostus
        </button>
        <span>Yläkaaret: muut ankkurit · alakaaret: muut taustat ja seuraukset</span>
      </div>
      <figure className="as-figure">
        <div
          className="as-scroll"
          role="region"
          tabIndex={0}
          aria-label="Ankkurien yhteinen vieritettävä kaarikuvaaja"
        >
          <div className="as-canvas" style={{ aspectRatio: `${layout.width}/${layout.height}` }}>
            <div className="as-labels">
              {layout.rows.map((row) => (
                <div
                  key={row.anchor.id}
                  className={focus === row.anchor.id ? "on" : ""}
                  style={
                    {
                      top: `${(row.top / layout.height) * 100}%`,
                      height: `${(layout.rowHeight / layout.height) * 100}%`,
                      "--as-tone": row.anchor.tone,
                    } as React.CSSProperties
                  }
                >
                  <button
                    aria-pressed={focus === row.anchor.id}
                    onClick={() => setFocus((f) => (f === row.anchor.id ? null : row.anchor.id))}
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
            >
              <defs>
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
              {Array.from(
                { length: (layout.max - layout.min) / 50 + 1 },
                (_, i) => layout.min + i * 50,
              ).map((year) => (
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
                const draw = (e: NetworkEdge, from: number, to: number, h: number) => {
                  const group = arcGroup(e.type),
                    end = to - Math.sign(to - from) * (anchor.nodes.includes(e.to) ? 12 : 6);
                  const path = `M${from} ${mid} C${from} ${mid + h},${end} ${mid + h},${end} ${mid}`;
                  const name = `${networkNode(e.from)!.title} → ${networkNode(e.to)!.title}`;
                  return (
                    <g
                      key={e.id}
                      className={`as-relation${picked?.anchorId === anchor.id && picked.edgeId === e.id ? " on" : ""}`}
                      style={{ color: ARC_GROUPS[group].tone }}
                      data-edge-id={e.id}
                    >
                      <path d={path} className="as-arc" markerEnd={`url(#${uid}-${group})`} />
                      <path
                        d={path}
                        className="as-hit"
                        role="button"
                        tabIndex={0}
                        aria-label={`Ankkuri ${anchor.n}: ${name}`}
                        onClick={() => setPicked({ anchorId: anchor.id, edgeId: e.id })}
                        onKeyDown={(event) =>
                          activate(event, () => setPicked({ anchorId: anchor.id, edgeId: e.id }))
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
                return (
                  <g
                    key={anchor.id}
                    data-anchor-id={anchor.id}
                    role="group"
                    aria-label={`Ankkurin ${anchor.n} kaaristo`}
                    className={`as-row${focus && focus !== anchor.id ? " dim" : ""}`}
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
                          -Math.min(maxHeight, 16 + Math.abs(ax(l.to) - ax(l.from)) * 0.2 + i * 4),
                        ),
                      ),
                    )}
                    {data.satellites.map(({ e, other, incoming }) => {
                      const from = incoming ? layout.x(other.yearStart!) : ax(anchor.id),
                        to = incoming ? ax(anchor.id) : layout.x(other.yearStart!);
                      return draw(e, from, to, Math.min(maxHeight, 12 + Math.abs(to - from) * 0.2));
                    })}
                    {data.satellites.map(({ e, other }) => (
                      <circle
                        key={e.id}
                        className={`as-satellite${isScenario(other) ? " scenario" : ""}`}
                        cx={layout.x(other.yearStart!)}
                        cy={mid}
                        r={2.5}
                      >
                        <title>
                          {other.yearStart} · {other.title}
                          {isScenario(other) ? " · skenaario" : ""}
                        </title>
                      </circle>
                    ))}
                    {ANCHORS.map((a) => (
                      <g
                        key={a.id}
                        className={`as-anchor${a.id === anchor.id ? " own" : " context"}`}
                        style={{ color: a.tone }}
                      >
                        <circle cx={ax(a.id)} cy={mid} r={a.id === anchor.id ? 10 : 4} />
                        {a.id === anchor.id && (
                          <text x={ax(a.id)} y={mid + 3.5} textAnchor="middle">
                            {a.n}
                          </text>
                        )}
                        <title>
                          {a.n}. {a.title} · {a.from}–{a.to}
                        </title>
                      </g>
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
        <figcaption>
          Yksi kuvaaja, yksi aikaskaala ja yksi vieritys: kaaristo 1 ylimpänä, 2 sen alla ja niin
          edelleen. Hento riviviiva erottaa kaaristot. Vaaka näyttää ajan; pystysijainti ryhmittelee
          kaaristot. Nuolen valinta avaa alkuperäisen relaation.
        </figcaption>
      </figure>
      <MilestoneDetails year={markers ? milestone : null} onClose={() => setMilestone(null)} />
      {edge && activeRow && (
        <aside
          className="as-detail"
          ref={detailRef}
          aria-label="Yhteisen kuvaajan relaatiotiedot"
          aria-live="polite"
        >
          <button onClick={() => setPicked(null)}>Sulje relaation tiedot</button>
          <small>Ankkurin {activeRow.anchor.n} kaaristo</small>
          <h3>
            {networkNode(edge.from)!.title} → {networkNode(edge.to)!.title}
          </h3>
          <p>{edge.rationale || "Perustelu puuttuu lähteestä."}</p>
          <p>
            {edge.type} · lähteen varmuusarvio: {edge.confidence}
          </p>
          <a href={networkSource.url} target="_blank" rel="noreferrer">
            TTT-lähde · {edge.id} ↗
          </a>
          <p>Vaikutusnäyttöä ei ole erikseen varmennettu.</p>
        </aside>
      )}
      {focusedRow && (
        <section className="as-detail" aria-label="Korostetun ankkurin tulkinta">
          <h3>
            {focusedRow.anchor.n}. {focusedRow.anchor.title}
          </h3>
          <p>
            <b>Toimituksellinen mekanismitulkinta.</b> {focusedRow.anchor.mechanism}
          </p>
          <p>
            <b>Nykytilan tulkinta.</b> {focusedRow.anchor.now}
          </p>
        </section>
      )}
      <details className="as-text">
        <summary>Kaaristot ja alkuperäiset relaatiot tekstimuodossa</summary>
        {layout.rows.map((row) => (
          <section key={row.anchor.id}>
            <h3>
              {row.anchor.n}. {row.anchor.title}
            </h3>
            <ul>
              {row.data.edges.map((e) => (
                <li key={e.id}>
                  <button onClick={() => setPicked({ anchorId: row.anchor.id, edgeId: e.id })}>
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
