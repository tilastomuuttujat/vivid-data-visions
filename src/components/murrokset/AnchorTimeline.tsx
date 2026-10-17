import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ANCHORS } from "./ankkurit-model";
import { anchorTimeline, layoutAnchorTimeline, type TimelineRole } from "./anchor-timeline-model";
import { ARC_GROUPS, arcGroup } from "./KaariAikajana";
import {
  edgesFor,
  isScenario,
  linkedDecisions,
  networkNode,
  networkSource,
  type Direction,
  type NetworkEdge,
  type NetworkNode,
} from "./decision-network-model";
import { useTimelineScroll } from "./useTimelineScroll";
import "./anchor-timeline.css";

const ROLES: Record<TimelineRole, string> = {
  focus: "Valitun ankkurin kortti",
  incoming: "Tausta",
  outgoing: "Seuraus",
  both: "Tausta ja seuraus",
  context: "Muu ankkurikortti",
};
const yearLabel = (node: NetworkNode) =>
  node.yearStart == null
    ? "Ajankohta avoin"
    : `${node.yearStart}${node.yearEnd != null && node.yearEnd !== node.yearStart ? `–${node.yearEnd}` : ""}`;
const activate = (event: React.KeyboardEvent, action: () => void) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
};

export function AnchorTimeline({
  onExplore,
}: {
  onExplore: (decisionId: string, nodeId: string) => void;
}) {
  const uid = useId().replace(/:/g, "");
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [direction, setDirection] = useState<Direction>("all");
  const [showLabels, setShowLabels] = useState(true);
  const [depth, setDepth] = useState<1 | 2>(1);
  const [selection, setSelection] = useState<{ kind: "node" | "edge"; id: string } | null>(null);
  const model = useMemo(
    () => anchorTimeline(anchorId, direction, depth),
    [anchorId, direction, depth],
  );
  const layout = useMemo(() => layoutAnchorTimeline(model, showLabels), [model, showLabels]);
  const selectedNode = selection?.kind === "node" ? networkNode(selection.id) : undefined;
  const selectedEdge =
    selection?.kind === "edge" ? model.edges.find((e) => e.id === selection.id) : undefined;
  const center = model.anchor
    ? layout.x((model.anchor.from + model.anchor.to) / 2) / layout.width
    : 0.65;
  const scrollRef = useTimelineScroll(center, `${anchorId}:${direction}:${depth}`, 140);
  const detailRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const lane = layout.lanes.find((l) => l.id === anchorId);
    if (scrollRef.current)
      scrollRef.current.scrollTop = lane
        ? Math.max(0, lane.top + lane.height / 2 - scrollRef.current.clientHeight / 2)
        : 0;
  }, [anchorId, layout, scrollRef]);
  useEffect(() => {
    if (selection) detailRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [selection]);
  const change = (id: string | null) => {
    setAnchorId(id);
    setSelection(null);
  };
  const count = (dir: "incoming" | "outgoing") =>
    [...model[dir].distances.values()].filter((d) => d > 0).length;
  const edgeTitle = (edge: NetworkEdge) =>
    `${networkNode(edge.from)!.title} → ${networkNode(edge.to)!.title} · ${edge.type}`;
  const openEdge = (edge: NetworkEdge) => setSelection({ kind: "edge", id: edge.id });
  const relevant = new Set(model.edges.flatMap((e) => [e.from, e.to]));

  return (
    <section className="at" aria-label="Ankkurien vaikutuspolut aikajanalla">
      <header className="at-header">
        <span className="v-kicker">Ajoitus · suunta · välittyminen</span>
        <h2>Mistä muutos tuli, mihin se jatkui?</h2>
        <p>
          Seitsemän ankkuria omilla riveillään. Kortti sijoittuu lähteen alkamisvuoteen, nuoli
          kulkee lähdekortista kohdekorttiin. Valitse ankkuri nähdäksesi sen taustat ja seuraukset.
        </p>
      </header>
      <div className="at-anchors" role="group" aria-label="Aikajanan ankkurivalinta">
        <button
          className={!anchorId ? "on" : ""}
          aria-pressed={!anchorId}
          onClick={() => change(null)}
        >
          <b>Kokonaiskuva</b>
          <span>7 ankkuria · suorat yhteydet niiden välillä</span>
        </button>
        {ANCHORS.map((a) => (
          <button
            key={a.id}
            aria-pressed={anchorId === a.id}
            className={anchorId === a.id ? "on" : ""}
            style={{ "--at-tone": a.tone } as React.CSSProperties}
            onClick={() => change(a.id)}
          >
            <span>
              {String(a.n).padStart(2, "0")} · {a.from}–{a.to}
            </span>
            <b>{a.title}</b>
          </button>
        ))}
      </div>
      <div className="at-toolbar">
        <label>
          Yhteyksien suunta
          <select
            aria-label="Ankkurin yhteyksien suunta"
            value={direction}
            disabled={!anchorId}
            onChange={(e) => {
              setDirection(e.target.value as Direction);
              setSelection(null);
            }}
          >
            <option value="all">Taustat ja seuraukset</option>
            <option value="incoming">Vain taustat</option>
            <option value="outgoing">Vain seuraukset</option>
          </select>
        </label>
        <label>
          Polun pituus
          <select
            aria-label="Ankkurin polun pituus"
            value={depth}
            disabled={!anchorId}
            onChange={(e) => {
              setDepth(Number(e.target.value) as 1 | 2);
              setSelection(null);
            }}
          >
            <option value={1}>Suorat yhteydet · 1 askel</option>
            <option value={2}>Myös välilliset polut · 2 askelta</option>
          </select>
        </label>
        <label className="at-label-toggle">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={(e) => setShowLabels(e.target.checked)}
          />
          Näytä korttien nimet
        </label>
        <p>
          {anchorId
            ? "Vaihda suuntaa erottaaksesi taustan seurauksesta."
            : "Kokonaiskuva näyttää vain eri ankkurien väliset lähdeyhteydet. Valitse ankkuri laajentaaksesi."}
        </p>
      </div>
      <div className="at-summary" aria-live="polite">
        <div>
          <b>{model.edges.length}</b>
          <span>lähdeyhteyttä tarkastelussa</span>
        </div>
        {anchorId && (
          <>
            <div>
              <b>{count("incoming")}</b>
              <span>taustakorttia {depth === 2 ? "enintään 2 askeleen päässä" : "suoraan"}</span>
            </div>
            <div>
              <b>{count("outgoing")}</b>
              <span>seurauskorttia {depth === 2 ? "enintään 2 askeleen päässä" : "suoraan"}</span>
            </div>
          </>
        )}
        <p>
          Yhteysmäärä kuvaa lähdeaineiston kattavuutta, ei vaikutuksen suuruutta. Kahden askeleen
          polku on ketju lähteen väitteitä, ei osoitettu välillinen vaikutus.
        </p>
      </div>
      <div className="at-legend">
        {Object.entries(ARC_GROUPS).map(([id, group]) => (
          <span key={id}>
            <i style={{ background: group.tone }} />
            {group.label}
          </span>
        ))}
        <span>→ Lähteen relaation suunta</span>
        <span>⋯ Skenaariokortti</span>
      </div>
      <figure className="at-figure">
        <div
          className="at-scroll"
          ref={scrollRef}
          tabIndex={0}
          role="region"
          aria-label="Vieritettävä systeeminen aikajana"
        >
          <div
            className={`at-canvas${showLabels ? " labels-on" : ""}`}
            style={{ height: layout.height }}
          >
            <div className="at-ruler" aria-hidden="true">
              <span className="at-ruler-corner">Vuosi →</span>
              {Array.from(
                { length: (layout.maxYear - layout.minYear) / 25 + 1 },
                (_, i) => layout.minYear + i * 25,
              ).map((year) => (
                <span key={year} className="at-ruler-year" style={{ left: layout.x(year) }}>
                  {year}
                </span>
              ))}
            </div>
            <div
              className="at-lane-labels"
              aria-label="Aikajanan rivit"
              style={{ height: layout.height }}
            >
              {layout.lanes.map((lane) => (
                <div
                  key={lane.id}
                  className={`at-row-label${lane.id === anchorId ? " selected" : ""}`}
                  style={
                    {
                      top: lane.top,
                      height: lane.height - 4,
                      "--at-tone": lane.tone,
                    } as React.CSSProperties
                  }
                >
                  {ANCHORS.some((a) => a.id === lane.id) ? (
                    <button onClick={() => change(lane.id)}>
                      <b>{lane.label}</b>
                      <small>
                        {ANCHORS.find((a) => a.id === lane.id)!.from}–
                        {ANCHORS.find((a) => a.id === lane.id)!.to}
                      </small>
                    </button>
                  ) : (
                    <b>{lane.label}</b>
                  )}
                </div>
              ))}
            </div>
            <svg
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              role="group"
              aria-label="Seitsemän ankkurin ryhmitelty aikajana"
            >
              <defs>
                {Object.entries(ARC_GROUPS).map(([key, group]) => (
                  <marker
                    key={key}
                    id={`${uid}-${key}`}
                    markerWidth="8"
                    markerHeight="8"
                    refX="8"
                    refY="4"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                  >
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill={group.tone} />
                  </marker>
                ))}
              </defs>
              {layout.lanes.map((lane) => (
                <g key={lane.id} className={`at-lane${anchorId === lane.id ? " selected" : ""}`}>
                  <rect x={0} y={lane.top} width={layout.width} height={lane.height - 4} rx={8} />
                  {ANCHORS.filter((a) => a.id === lane.id).map((a) => (
                    <g key={a.id}>
                      <line
                        x1={layout.x(a.from)}
                        x2={layout.x(a.to)}
                        y1={lane.top + 16}
                        y2={lane.top + 16}
                        stroke={a.tone}
                        strokeWidth={5}
                        opacity={0.5}
                      />
                      <text x={18} y={lane.top + 49} className="at-small">
                        {a.from}–{a.to} · toimituksellinen ryhmä
                      </text>
                    </g>
                  ))}
                </g>
              ))}
              {Array.from(
                { length: (layout.maxYear - layout.minYear) / 25 + 1 },
                (_, i) => layout.minYear + i * 25,
              ).map((year) => (
                <g key={year} className="at-grid">
                  <line x1={layout.x(year)} x2={layout.x(year)} y1={44} y2={layout.height - 28} />
                  <text x={layout.x(year)} y={28} textAnchor="middle">
                    {year}
                  </text>
                  <text x={layout.x(year)} y={layout.height - 7} textAnchor="middle">
                    {year}
                  </text>
                </g>
              ))}
              {layout.edges.map((edge, i) => {
                const from = layout.positions.get(edge.from)!;
                const to = layout.positions.get(edge.to)!;
                const group = arcGroup(edge.type);
                const sameLane = from.lane === to.lane;
                const bend = sameLane ? -32 - (i % 3) * 12 : 0;
                const dx = to.x - from.x,
                  dy = to.y - from.y,
                  length = Math.hypot(dx, dy) || 1;
                const tx = to.x - (dx / length) * 10,
                  ty = to.y - (dy / length) * 10;
                const d = `M ${from.x} ${from.y} C ${from.x + dx * 0.35} ${from.y + bend}, ${tx - dx * 0.35} ${ty + bend}, ${tx} ${ty}`;
                const selected =
                  selectedEdge?.id === edge.id ||
                  selectedNode?.id === edge.from ||
                  selectedNode?.id === edge.to;
                return (
                  <g
                    key={edge.id}
                    className={`at-edge${selected ? " active" : selection ? " dim" : ""}`}
                    style={{ color: ARC_GROUPS[group].tone }}
                  >
                    <path d={d} markerEnd={`url(#${uid}-${group})`} className="at-edge-line" />
                    <path
                      d={d}
                      className="at-edge-hit"
                      role="button"
                      tabIndex={0}
                      aria-label={edgeTitle(edge)}
                      onClick={() => openEdge(edge)}
                      onKeyDown={(event) => activate(event, () => openEdge(edge))}
                    >
                      <title>{edgeTitle(edge)}</title>
                    </path>
                  </g>
                );
              })}
              {layout.nodes.map(({ node, x, y, role, distance }) => {
                const active = !anchorId || role === "focus" || relevant.has(node.id);
                return (
                  <g
                    key={node.id}
                    className={`at-node${active ? "" : " muted"}${selectedNode?.id === node.id ? " active" : ""}${isScenario(node) ? " scenario" : ""}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${yearLabel(node)} ${node.title}${isScenario(node) ? " · skenaario" : ""}`}
                    onClick={() => setSelection({ kind: "node", id: node.id })}
                    onKeyDown={(event) =>
                      activate(event, () => setSelection({ kind: "node", id: node.id }))
                    }
                  >
                    <circle cx={x} cy={y} r={role === "focus" ? 8 : 6} />
                    <text x={x + 11} y={y + 4}>
                      {showLabels
                        ? node.title.length > 30 ? node.title.slice(0, 28) + "…" : node.title
                        : ""}
                    </text>
                    <title>
                      {yearLabel(node)} · {node.title} · {ROLES[role]}
                      {distance ? ` · ${distance} askelta` : ""}
                      {isScenario(node) ? " · skenaario / tulevaisuustarkastelu" : ""}
                    </title>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
        <figcaption>
          Vieritä aikajanaa vaaka- ja pystysuunnassa. Valitse kortti tai nuoli avataksesi tiedot.
          Rivijärjestys on ryhmittely, ei vaikutusten arvojärjestys; viivan paksuus ei mittaa
          vaikutusta. Värit ryhmittelevät lähteen relaatiotyyppejä. Tausta voi ajoittua kohdetta
          myöhemmäksi: nuoli säilyttää lähteen suunnan.
        </figcaption>
      </figure>
      <section
        ref={detailRef}
        className="at-detail"
        aria-label="Aikajanan valinnan tiedot"
        aria-live="polite"
      >
        {selectedEdge ? (
          <>
            <span className="v-kicker">Lähteen kuvaama yhteys · {selectedEdge.id}</span>
            <h3>{edgeTitle(selectedEdge)}</h3>
            <div className="at-endpoints">
              {[selectedEdge.from, selectedEdge.to].map((id, i) => (
                <button key={`${i}-${id}`} onClick={() => setSelection({ kind: "node", id })}>
                  <small>
                    {i ? "Kohde" : "Lähtökohta"} · {yearLabel(networkNode(id)!)}
                  </small>
                  <b>{networkNode(id)!.title}</b>
                </button>
              ))}
            </div>
            <p>{selectedEdge.rationale || "Relaation perustelu puuttuu lähteestä."}</p>
            <p>
              Relaatiotyyppi: <b>{selectedEdge.type}</b> · luokka: {selectedEdge.relationClass} ·
              lähteen varmuusarvio: {selectedEdge.confidence}.
            </p>
            <p>Vaikutusnäyttöä ei ole erikseen varmennettu tässä sovelluksessa.</p>
            <a href={networkSource.url} target="_blank" rel="noreferrer">
              TTT-lähde ja relaation tunniste {selectedEdge.id} ↗
            </a>
          </>
        ) : selectedNode ? (
          <>
            <span className="v-kicker">
              Lähdekortti · {yearLabel(selectedNode)}
              {isScenario(selectedNode) ? " · Skenaario / tulevaisuustarkastelu" : ""}
            </span>
            <h3>{selectedNode.title}</h3>
            <p>{selectedNode.problem}</p>
            <p>
              <b>Lähteen mekanismitulkinta.</b> {selectedNode.mechanism}
            </p>
            <p>
              <b>Lähteen kuvaama pidempi seuraus.</b> {selectedNode.longEffect}
            </p>
            <div className="at-endpoints">
              {linkedDecisions(selectedNode.id).map((d) => (
                <button key={d.id} onClick={() => onExplore(d.id, selectedNode.id)}>
                  Avaa Taustat ja seuraukset: {d.paatos} →
                </button>
              ))}
            </div>
            <a href={networkSource.url} target="_blank" rel="noreferrer">
              Lähdekortti TTT-aineistossa: {selectedNode.id} ↗
            </a>
            <details>
              <summary>
                Kortin kaikki suorat taustat ja seuraukset ({edgesFor(selectedNode.id).length})
              </summary>
              <ul className="at-relations">
                {edgesFor(selectedNode.id).map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={() => {
                        const other = networkNode(e.from === selectedNode.id ? e.to : e.from)!;
                        setSelection({ kind: "node", id: other.id });
                      }}
                    >
                      {e.to === selectedNode.id ? "Tausta" : "Seuraus"}:{" "}
                      {networkNode(e.from === selectedNode.id ? e.to : e.from)!.title}
                    </button>
                    <p>
                      {e.type} · {e.rationale} · lähteen varmuus: {e.confidence}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          </>
        ) : model.anchor ? (
          <>
            <span className="v-kicker">
              Ankkuri {model.anchor.n} · {model.anchor.from}–{model.anchor.to}
            </span>
            <h3>{model.anchor.title}</h3>
            <p>
              <b>Toimituksellinen mekanismitulkinta.</b> {model.anchor.mechanism}
            </p>
            <p>
              <b>Nykytilan tulkinta.</b> {model.anchor.now}
            </p>
            <p>
              Valitse nuoli tutkiaksesi, mitä väitetty yhteys tarkoittaa ja mihin lähdekortteihin se
              perustuu.
            </p>
          </>
        ) : (
          <>
            <h3>Lue reittejä, älä vain seitsemää otsikkoa</h3>
            <p>
              Kokonaiskuvassa näkyvät ankkurien väliset suorat lähdeyhteydet. Ankkurin valinta tuo
              mukaan sen muut taustat ja seuraukset. Kahden askeleen tarkastelu näyttää, minkä
              korttien kautta yhteys välittyy.
            </p>
          </>
        )}
      </section>
      <details className="at-table">
        <summary>Yhteydet tekstimuodossa ({model.edges.length})</summary>
        {!model.edges.length && <p>Tähän rajaukseen ei ole lähteessä kirjattu yhteyksiä.</p>}
        <ol>
          {model.edges.map((e) => (
            <li key={e.id}>
              <button onClick={() => openEdge(e)}>{edgeTitle(e)}</button>
              <small>
                {e.id} · {yearLabel(networkNode(e.from)!)} → {yearLabel(networkNode(e.to)!)}
              </small>
            </li>
          ))}
        </ol>
      </details>
      {layout.undated.length > 0 && (
        <details>
          <summary>Ilman alkamisvuotta: {layout.undated.length} korttia</summary>
          <ul>
            {layout.undated.map(({ node }) => (
              <li key={node.id}>
                <button onClick={() => setSelection({ kind: "node", id: node.id })}>
                  {node.title}
                </button>
              </li>
            ))}
          </ul>
          <p>
            Näihin kortteihin liittyvät yhteydet ovat tekstiluettelossa, mutta niitä ei sijoiteta
            arvattuun vuoteen.
          </p>
        </details>
      )}
      <p className="at-note">
        Ankkurien rajaus on toimituksellinen. Yhteydet tulevat samasta kiinnitetystä TTT-aineistosta
        kuin Taustat ja seuraukset. Aineisto on analyyttinen työversio; relaatioiden
        kausaaliväitteitä tai varmuusarvioita ei ole tässä varmennettu. Puuttuva nuoli tarkoittaa
        puuttuvaa lähdeyhteyttä tässä rajauksessa.
      </p>
    </section>
  );
}
