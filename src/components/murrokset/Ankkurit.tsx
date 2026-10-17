// Seven complete arc diagrams, one anchor per panel on a shared time scale.
import { useId, useMemo, useRef, useState } from "react";
import { ANCHORS } from "./ankkurit-model";
import { anchorPanelData, anchorPanelScale } from "./anchor-panels-model";
import { ARC_GROUPS, arcGroup } from "./KaariAikajana";
import { isScenario, networkNode, networkSource, type NetworkEdge } from "./decision-network-model";
import { TimelineMilestones, MilestoneDetails } from "./TimelineMilestones";
import "./anchor-panels.css";

const W = 1000,
  MID = 210,
  H = 420;
const activate = (e: React.KeyboardEvent, action: () => void) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    action();
  }
};

function AnchorPanel({
  id,
  scale,
  markers,
  register,
  onScroll,
}: {
  id: string;
  scale: ReturnType<typeof anchorPanelScale>;
  markers: boolean;
  register: (node: HTMLDivElement | null) => void;
  onScroll: (element: HTMLDivElement) => void;
}) {
  const data = useMemo(() => anchorPanelData(id), [id]);
  const { anchor, links, satellites } = data;
  const uid = useId().replace(/:/g, "");
  const [picked, setPicked] = useState<NetworkEdge | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null);
  const ax = (aid: string) => {
    const a = ANCHORS.find((a) => a.id === aid)!;
    return scale.x((a.from + a.to) / 2);
  };
  const incoming = links.filter((l) => l.to === id).flatMap((l) => l.edges).length;
  const outgoing = links.filter((l) => l.from === id).flatMap((l) => l.edges).length;
  const arc = (edge: NetworkEdge, from: number, to: number, height: number, key: string) => {
    const tone = ARC_GROUPS[arcGroup(edge.type)].tone;
    const targetAnchor =
      anchor.nodes.includes(edge.to) || ANCHORS.some((a) => a.nodes.includes(edge.to));
    const end = to - Math.sign(to - from) * (targetAnchor ? 18 : 6);
    const d = `M ${from} ${MID} C ${from} ${MID + height}, ${end} ${MID + height}, ${end} ${MID}`;
    const label = `${networkNode(edge.from)!.title} → ${networkNode(edge.to)!.title}`;
    return (
      <g
        key={key}
        className={`ap-relation${picked?.id === edge.id ? " on" : ""}`}
        style={{ color: tone }}
        data-edge-id={edge.id}
      >
        <path d={d} className="ap-arc" markerEnd={`url(#${uid}-${arcGroup(edge.type)})`} />
        <path
          d={d}
          className="ap-hit"
          role="button"
          tabIndex={0}
          aria-label={label}
          onClick={() => setPicked(edge)}
          onKeyDown={(e) => activate(e, () => setPicked(edge))}
        >
          <title>
            {label} · {edge.type} · {edge.id}
          </title>
        </path>
      </g>
    );
  };
  return (
    <article
      className="ap-panel"
      aria-label={`Ankkurin ${anchor.n} kaarikuvio`}
      style={{ "--ap-tone": anchor.tone } as React.CSSProperties}
    >
      <header>
        <span className="ap-number">{anchor.n}</span>
        <div>
          <small>
            {anchor.from}–{anchor.to}
          </small>
          <h3>{anchor.title}</h3>
        </div>
      </header>
      <div
        className="ap-scroll"
        ref={register}
        onScroll={(e) => onScroll(e.currentTarget)}
        role="region"
        tabIndex={0}
        aria-label={`Ankkurin ${anchor.n} vieritettävä aikajana`}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="group"
          aria-label={`Ankkuri ${anchor.n}: taustat ja seuraukset samalla aikaskaalalla`}
        >
          <defs>
            {Object.entries(ARC_GROUPS).map(([group, value]) => (
              <marker
                key={group}
                id={`${uid}-${group}`}
                markerWidth="8"
                markerHeight="8"
                refX="8"
                refY="4"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M0 0 L8 4 L0 8 Z" fill={value.tone} />
              </marker>
            ))}
          </defs>
          <text x={40} y={17} className="ap-side">
            Ylhäällä: tämän ankkurin yhteydet muihin ankkureihin
          </text>
          {Array.from(
            { length: (scale.max - scale.min) / 50 + 1 },
            (_, i) => scale.min + i * 50,
          ).map((year) => (
            <g key={year} className="ap-grid">
              <line x1={scale.x(year)} x2={scale.x(year)} y1={94} y2={H - 28} />
              <text x={scale.x(year)} y={35} textAnchor="middle">
                {year}
              </text>
            </g>
          ))}
          {markers && (
            <TimelineMilestones
              x={scale.x}
              min={scale.min}
              max={scale.max}
              bottom={H - 28}
              onSelect={setMilestone}
            />
          )}
          <line x1={40} x2={960} y1={MID} y2={MID} className="pa-grid" />
          {links.flatMap((l) =>
            l.edges.map((edge, index) =>
              arc(
                edge,
                ax(l.from),
                ax(l.to),
                -Math.min(MID - 98, 30 + Math.abs(ax(l.to) - ax(l.from)) * 0.4 + index * 8),
                edge.id,
              ),
            ),
          )}
          {satellites.map(({ e, other, incoming }) => {
            const from = incoming ? scale.x(other.yearStart!) : ax(id),
              to = incoming ? ax(id) : scale.x(other.yearStart!);
            return arc(e, from, to, Math.min(H - MID - 34, 24 + Math.abs(to - from) * 0.4), e.id);
          })}
          {satellites.map(({ e, other }) => (
            <circle
              key={e.id}
              cx={scale.x(other.yearStart!)}
              cy={MID}
              r={3.5}
              className={`ap-satellite${isScenario(other) ? " scenario" : ""}`}
            >
              <title>
                {other.yearStart} · {other.title}
                {isScenario(other) ? " · Skenaario" : ""}
              </title>
            </circle>
          ))}
          {ANCHORS.map((a) => (
            <g
              key={a.id}
              className={a.id === id ? "ap-anchor selected" : "ap-anchor context"}
              style={{ color: a.tone }}
            >
              <circle cx={ax(a.id)} cy={MID} r={a.id === id ? 15 : 10} />
              <text x={ax(a.id)} y={MID + 4} textAnchor="middle">
                {a.n}
              </text>
              <title>
                {a.from}–{a.to} · {a.title}
                {a.id === id ? " · Tämän kuvion ankkuri" : " · Vertailupiste"}
              </title>
            </g>
          ))}
          <text x={40} y={H - 8} className="ap-side">
            Alhaalla: tämän ankkurin muut taustat ja seuraukset · nuoli säilyttää lähteen suunnan
          </text>
        </svg>
      </div>
      <MilestoneDetails year={markers ? milestone : null} onClose={() => setMilestone(null)} />
      {picked && (
        <aside
          className="ap-evidence"
          aria-label={`Ankkurin ${anchor.n} valittu relaatio`}
          aria-live="polite"
        >
          <button onClick={() => setPicked(null)}>Sulje relaation tiedot</button>
          <h4>
            {networkNode(picked.from)!.title} → {networkNode(picked.to)!.title}
          </h4>
          <p>{picked.rationale || "Perustelu puuttuu lähteestä."}</p>
          <p>
            {picked.type} · lähteen varmuusarvio: {picked.confidence}
          </p>
          <a href={networkSource.url} target="_blank" rel="noreferrer">
            TTT-lähde · {picked.id} ↗
          </a>
        </aside>
      )}
      <details>
        <summary>
          Ankkurin {anchor.n} tulkinta ja lähdeyhteydet ({data.edges.length})
        </summary>
        <p>
          <b>Toimituksellinen mekanismitulkinta.</b> {anchor.mechanism}
        </p>
        <p>
          <b>Nykytilan tulkinta.</b> {anchor.now}
        </p>
        <p>
          Yhteyksiä muihin ankkureihin: {incoming} saapuvaa ja {outgoing} lähtevää.
        </p>
        <ul>
          {data.edges.map((e) => (
            <li key={e.id}>
              <button onClick={() => setPicked(e)}>
                {networkNode(e.from)!.title} → {networkNode(e.to)!.title} · {e.id}
              </button>
            </li>
          ))}
        </ul>
      </details>
    </article>
  );
}

export function Ankkurit() {
  const [selected, setSelected] = useState<string[]>(ANCHORS.map((a) => a.id));
  const [markers, setMarkers] = useState(true);
  const scale = useMemo(anchorPanelScale, []);
  const scrolls = useRef(new Map<string, HTMLDivElement>());
  const scrollLeft = useRef(0);
  const synchronize = (source: HTMLDivElement) => {
    scrollLeft.current = source.scrollLeft;
    for (const element of scrolls.current.values())
      if (element !== source && Math.abs(element.scrollLeft - source.scrollLeft) > 1)
        element.scrollLeft = source.scrollLeft;
  };
  return (
    <section className="ank" aria-label="Seitsemän systeemistä ankkuria">
      <h2>Seitsemän kaarikuviota samalla aikaskaalalla</h2>
      <p className="ank-lead">
        Ankkurin 1 koko kuvio on ensimmäisenä, sen alla ankkuri 2 ja niin edelleen. Jokaisessa
        korostuu yksi ankkuri omine yhteyksineen; muut kuusi ovat himmeitä vertailupisteitä.
        Yläkaaret yhdistävät muihin ankkureihin, alakaaret muihin lähdekortteihin.
      </p>
      <div className="ank-chips" role="group" aria-label="Valitse näkyvät ankkurikuviot">
        {ANCHORS.map((a) => (
          <button
            key={a.id}
            aria-pressed={selected.includes(a.id)}
            className={selected.includes(a.id) ? "on" : ""}
            style={{ "--tone": a.tone } as React.CSSProperties}
            onClick={() =>
              setSelected((s) => (s.includes(a.id) ? s.filter((id) => id !== a.id) : [...s, a.id]))
            }
          >
            <b>{a.n}</b> {a.from}–{a.to}
          </button>
        ))}
        <button onClick={() => setSelected(ANCHORS.map((a) => a.id))}>Kaikki</button>
        <button onClick={() => setSelected([])}>Tyhjennä</button>
      </div>
      <label className="ap-toggle">
        <input type="checkbox" checked={markers} onChange={(e) => setMarkers(e.target.checked)} />{" "}
        Näytä yhteiset murroskohtien katkoviivat
      </label>
      <div className="ka-legend">
        {Object.entries(ARC_GROUPS).map(([id, g]) => (
          <span key={id}>
            <i style={{ background: g.tone }} />
            {g.label}
          </span>
        ))}
      </div>
      <p className="ank-note">
        Aikaskaala on kaikissa kuvioissa {scale.min}–{scale.max} ja pysyy samana myös rajattaessa.
        Vaakavieritys liikuttaa kaikkia kuvioita yhdessä. Ankkuripiste sijaitsee ryhmän aikavälin
        keskellä, muut kortit lähteen alkamisvuodessa. Katkoviivat ovat ajallisia kiinnekohtia,
        eivät vaikutussuhteita.
      </p>
      {!selected.length && (
        <p role="status">Valitse vähintään yksi ankkuri näyttääksesi kaarikuviot.</p>
      )}
      <div className="ap-panels">
        {ANCHORS.filter((a) => selected.includes(a.id)).map((a) => (
          <AnchorPanel
            key={a.id}
            id={a.id}
            scale={scale}
            markers={markers}
            register={(node) => {
              if (node) {
                scrolls.current.set(a.id, node);
                node.scrollLeft = scrollLeft.current;
              } else scrolls.current.delete(a.id);
            }}
            onScroll={synchronize}
          />
        ))}
      </div>
      <p className="ank-note">
        Ankkurien rajaus on toimituksellinen. Kaaret perustuvat vain kiinnitetyn TTT-aineiston
        relaatioihin; vaikutusnäyttöä ja lähteen varmuusarvioita ei ole erikseen varmennettu. Kaaren
        korkeus auttaa erottamaan aikavälejä, ei kuvaa vaikutuksen voimaa. Skenaariokortin kehys on
        katkoviivoitettu.
      </p>
    </section>
  );
}
