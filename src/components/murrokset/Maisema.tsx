import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ANCHORS } from "./ankkurit-model";
import { anchorTimeline } from "./anchor-timeline-model";
import {
  LENSES,
  LANDSCAPE_WIDTH as W,
  LANDSCAPE_HEIGHT as H,
  landscapeAnchors,
  landscapeLinks,
  landscapeX as x,
  labelLines,
  matchesLens,
  focusLandscape,
  nodeLenses,
  type LensId,
} from "./maisema-model";
import {
  isScenario,
  linkedDecisions,
  networkNode,
  networkSource,
  type Direction,
  type NetworkEdge,
  type NetworkNode,
} from "./decision-network-model";
import { useTimelineScroll } from "./useTimelineScroll";
import "./maisema.css";

const activate = (event: React.KeyboardEvent, action: () => void) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
};
const yearOf = (node: NetworkNode) =>
  node.yearStart == null
    ? "Ajankohta avoin"
    : `${node.yearStart}${node.yearEnd !== node.yearStart && node.yearEnd != null ? `–${node.yearEnd}` : ""}`;
const roles: Record<string, string> = {
  incoming: "Taustat",
  focus: "Ankkurin kortit",
  both: "Molemmat suunnat",
  outgoing: "Seuraukset",
};
const roleTones: Record<string, string> = {
  incoming: "var(--m-teal)",
  focus: "var(--m-gold)",
  both: "#c4a0ff",
  outgoing: "var(--m-blue)",
};
const edgeName = (e: NetworkEdge) => `${networkNode(e.from)!.title} → ${networkNode(e.to)!.title}`;

export function Maisema({ onExplore }: { onExplore: (id: string, nodeId?: string) => void }) {
  const uid = useId().replace(/:/g, "");
  const [anchorId, setAnchorId] = useState<string | null>(null);
  const [lenses, setLenses] = useState<Set<LensId>>(new Set());
  const [direction, setDirection] = useState<Direction>("all");
  const [depth, setDepth] = useState<1 | 2>(1);
  const [selection, setSelection] = useState<{ kind: "node" | "link" | "edge"; id: string } | null>(
    null,
  );
  const evidenceRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (selection) evidenceRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [selection]);
  const anchors = useMemo(landscapeAnchors, []);
  const links = useMemo(landscapeLinks, []);
  const model = useMemo(
    () => anchorTimeline(anchorId, direction, depth),
    [anchorId, direction, depth],
  );
  const detail = useMemo(() => focusLandscape(model), [model]);
  const selected = anchors.find((a) => a.id === anchorId);
  const scrollRef = useTimelineScroll((selected?.x ?? W / 2) / W, anchorId ?? "all");
  const detailRef = useTimelineScroll(
    selected ? detail.x((selected.from + selected.to) / 2) / W : 0.5,
    `${anchorId}:${direction}:${depth}`,
  );
  const chosenNode = selection?.kind === "node" ? networkNode(selection.id) : undefined;
  const chosenLink =
    selection?.kind === "link" ? links.find((l) => l.id === selection.id) : undefined;
  const chosenEdges =
    chosenLink?.edges ??
    (selection?.kind === "edge" ? model.edges.filter((e) => e.id === selection.id) : []);
  const pickAnchor = (id: string) => {
    setAnchorId(id);
    setSelection(null);
  };
  const toggle = (id: LensId) =>
    setLenses((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const nodeButton = (id: string) => (
    <button onClick={() => setSelection({ kind: "node", id })}>
      {yearOf(networkNode(id)!)} · {networkNode(id)!.title}
    </button>
  );
  const evidence = (edge: NetworkEdge) => (
    <article key={edge.id} className="ms-evidence">
      <h4>{edgeName(edge)}</h4>
      <div className="ms-endpoints">
        {nodeButton(edge.from)}
        <span aria-hidden>→</span>
        {nodeButton(edge.to)}
      </div>
      <p>{edge.rationale || "Perustelu puuttuu lähteestä."}</p>
      <p>
        Relaatiotyyppi: <b>{edge.type}</b> · luokka: {edge.relationClass} · lähteen varmuusarvio:{" "}
        {edge.confidence}.
      </p>
      <a href={networkSource.url} target="_blank" rel="noreferrer">
        TTT-lähde · {edge.id} ↗
      </a>
    </article>
  );

  return (
    <section className="ms" aria-label="Murrosmaisema">
      <header className="ms-intro">
        <span className="v-kicker">Systeemisen aikajanan tiivistelmä</span>
        <h2>Seitsemän ankkuria, yhteinen murrosmaisema</h2>
        <p>
          Valitse ankkuri avataksesi sen päätökset, taustat ja seuraukset tähän näkymään. Nuoli
          näyttää lähteeseen kirjatun yhteyden suunnan.
        </p>
      </header>
      <div className="ms-panel">
        <div className="ms-row">
          <b>Korosta teemaa</b>
          <button onClick={() => setLenses(new Set())}>Poista teemakorostus</button>
        </div>
        <div className="ms-lenses" role="group" aria-label="Murrosmaiseman teemakorostukset">
          {LENSES.map((l) => (
            <button
              key={l.id}
              aria-pressed={lenses.has(l.id)}
              style={{ "--lt": l.tone } as React.CSSProperties}
              onClick={() => toggle(l.id)}
            >
              <span aria-hidden>{l.icon}</span>
              {l.label}
            </button>
          ))}
        </div>
        <p className="ms-note">
          Linssit korostavat olemassa olevia kortteja ja yhteyksiä. Kytkentä perustuu päätösten
          teemoihin ja eksplisiittisiin lähdekorttivastineisiin; muille korteille ei arvata teemaa.
          Kaikki seitsemän ankkuria ja yhteydet säilyvät näkyvissä.
        </p>
      </div>
      <figure className="ms-stage">
        <div
          className="ms-scroll"
          ref={scrollRef}
          tabIndex={0}
          role="region"
          aria-label="Murrosmaiseman kokonaiskuva"
        >
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="group"
            aria-label="Seitsemän ankkuria ja niiden suunnatut yhteydet"
          >
            <defs>
              <marker
                id={`${uid}-overview`}
                markerWidth="9"
                markerHeight="9"
                refX="9"
                refY="4.5"
                orient="auto"
                markerUnits="userSpaceOnUse"
              >
                <path d="M0 0 L9 4.5 L0 9 Z" fill="currentColor" />
              </marker>
            </defs>
            {[1850, 1875, 1900, 1925, 1950, 1975, 2000, 2025].map((year) => (
              <g key={year} className="ms-grid">
                <line x1={x(year)} x2={x(year)} y1={40} y2={H - 30} />
                <text x={x(year)} y={25} textAnchor="middle">
                  {year}
                </text>
                <text x={x(year)} y={H - 8} textAnchor="middle">
                  {year}
                </text>
              </g>
            ))}
            {links.map((link) => {
              const from = anchors.find((a) => a.id === link.from)!,
                to = anchors.find((a) => a.id === link.to)!;
              const dx = to.x - from.x,
                dy = to.y - from.y,
                length = Math.hypot(dx, dy) || 1;
              const tx = to.x - (dx / length) * 23,
                ty = to.y - (dy / length) * 23;
              const bend = from.y === to.y ? -65 : 0;
              const path = `M${from.x},${from.y} C${from.x + dx * 0.4},${from.y + bend} ${tx - dx * 0.4},${ty + bend} ${tx},${ty}`;
              const dim =
                !matchesLens(
                  link.edges.flatMap((e) => [e.from, e.to]),
                  lenses,
                ) ||
                (anchorId && link.from !== anchorId && link.to !== anchorId);
              return (
                <g
                  key={link.id}
                  className={`ms-link${dim ? " dim" : ""}${chosenLink?.id === link.id ? " on" : ""}`}
                >
                  <path className="ms-link-line" d={path} markerEnd={`url(#${uid}-overview)`} />
                  <path
                    className="ms-link-hit"
                    d={path}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ankkuri ${from.n} → ${to.n}: ${link.edges.length} lähderelaatiota`}
                    onClick={() => setSelection({ kind: "link", id: link.id })}
                    onKeyDown={(e) =>
                      activate(e, () => setSelection({ kind: "link", id: link.id }))
                    }
                  >
                    <title>
                      {from.title} → {to.title} · {link.edges.length} lähderelaatiota. Avaa
                      päätekortit.
                    </title>
                  </path>
                </g>
              );
            })}
            {anchors.map((a) => (
              <g
                key={a.id}
                className={`ms-anchor${matchesLens(a.nodes, lenses) ? "" : " dim"}${anchorId === a.id ? " on" : ""}`}
                style={{ "--lt": a.tone } as React.CSSProperties}
                role="button"
                tabIndex={0}
                aria-pressed={anchorId === a.id}
                aria-label={`Ankkuri ${a.n}: ${a.title}, ${a.from}–${a.to}`}
                onClick={() => pickAnchor(a.id)}
                onKeyDown={(e) => activate(e, () => pickAnchor(a.id))}
              >
                <line
                  x1={x(a.from)}
                  x2={x(a.to)}
                  y1={a.y + 24}
                  y2={a.y + 24}
                  className="ms-anchor-span"
                />
                <circle cx={a.x} cy={a.y} r={18} />
                <text x={a.x} y={a.y + 5} textAnchor="middle" className="ms-anchor-number">
                  {a.n}
                </text>
                <text
                  x={Math.max(100, Math.min(W - 110, a.x))}
                  y={a.y + 46}
                  textAnchor="middle"
                  className="ms-anchor-name"
                >
                  {labelLines(a.title).map((line, i) => (
                    <tspan key={i} x={Math.max(100, Math.min(W - 110, a.x))} dy={i ? 14 : 0}>
                      {line}
                    </tspan>
                  ))}
                </text>
                <title>
                  {a.from}–{a.to} · {a.title} · {a.nodes.length} lähdekorttia
                </title>
              </g>
            ))}
          </svg>
        </div>
        <figcaption>
          Kapealla näytöllä vieritä vaakasuunnassa. Vaaka = aika. Ankkurin sijainti ja värillinen
          aikaväli kuvaavat toimituksellista ryhmää. Pystysijainti erottaa otsikot; se ei mittaa
          hyvyyttä tai vaikutusvoimaa. Nuolet niputtavat samoihin ankkureihin kuuluvien korttien
          suorat relaatiot. Nipun alkuperäiset yhteydet avautuvat valitsemalla.
        </figcaption>
      </figure>
      <label className="ms-anchor-picker">
        Avaa ankkuri
        <select
          aria-label="Avaa maiseman ankkuri"
          value={anchorId ?? ""}
          onChange={(e) => {
            setAnchorId(e.target.value || null);
            setSelection(null);
          }}
        >
          <option value="">Kokonaiskuva · kaikki seitsemän ankkuria</option>
          {anchors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.n}. {a.from}–{a.to} · {a.title}
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <section className="ms-expanded" aria-label="Valitun ankkurin yhteydet">
          <div className="ms-row">
            <div>
              <span className="v-kicker">
                Avattu ankkuri {selected.n} · {selected.from}–{selected.to}
              </span>
              <h3>{selected.title}</h3>
            </div>
            <button
              onClick={() => {
                setAnchorId(null);
                setSelection(null);
              }}
            >
              Sulje ankkurin tarkastelu
            </button>
          </div>
          <p>
            <b>Toimituksellinen mekanismitulkinta.</b> {selected.mechanism}
          </p>
          <div className="ms-controls">
            <label>
              Suunta
              <select
                aria-label="Maiseman yhteyksien suunta"
                value={direction}
                onChange={(e) => {
                  setDirection(e.target.value as Direction);
                  setSelection(null);
                }}
              >
                <option value="all">Taustat ja seuraukset</option>
                <option value="incoming">Taustat</option>
                <option value="outgoing">Seuraukset</option>
              </select>
            </label>
            <label>
              Polku
              <select
                aria-label="Maiseman polun pituus"
                value={depth}
                onChange={(e) => {
                  setDepth(Number(e.target.value) as 1 | 2);
                  setSelection(null);
                }}
              >
                <option value={1}>Suorat yhteydet</option>
                <option value={2}>Myös kahden askeleen polut</option>
              </select>
            </label>
            <p>
              {model.edges.length} lähderelaatiota. Kahden askeleen polku seuraa yksittäisiä
              kortteja; ankkurijäsenyys ei muodosta oikopolkua.
            </p>
          </div>
          <div className="ms-role-legend">
            {detail.lanes.map((lane) => (
              <span key={lane.role}>
                <i style={{ background: roleTones[lane.role] }} />
                {roles[lane.role]}
              </span>
            ))}
          </div>
          <div
            className="ms-scroll ms-focus-scroll"
            ref={detailRef}
            role="region"
            tabIndex={0}
            aria-label="Avatun ankkurin korttiaikajana"
          >
            <svg
              viewBox={`0 0 ${W} ${detail.height}`}
              role="group"
              aria-label="Ankkurin lähdekortit ja relaatiot oikeilla vuosillaan"
            >
              <defs>
                <marker
                  id={`${uid}-detail`}
                  markerWidth="8"
                  markerHeight="8"
                  refX="8"
                  refY="4"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
                </marker>
              </defs>
              {Array.from(
                { length: (detail.max - detail.min) / 25 + 1 },
                (_, i) => detail.min + i * 25,
              ).map((year) => (
                <g key={year} className="ms-grid">
                  <line x1={detail.x(year)} x2={detail.x(year)} y1={42} y2={detail.height - 8} />
                  <text x={detail.x(year)} y={25} textAnchor="middle">
                    {year}
                  </text>
                </g>
              ))}
              {detail.lanes.map((lane) => (
                <g key={lane.role}>
                  <rect
                    className="ms-lane"
                    x={0}
                    y={lane.top}
                    width={W}
                    height={lane.height - 3}
                    rx={6}
                  />
                  <text className="ms-role" x={12} y={lane.top + 23}>
                    {roles[lane.role]}
                  </text>
                </g>
              ))}
              {detail.edges.map((e) => {
                const from = detail.positions.get(e.from)!,
                  to = detail.positions.get(e.to)!;
                const dx = to.x - from.x,
                  dy = to.y - from.y,
                  len = Math.hypot(dx, dy) || 1;
                const tx = to.x - (dx / len) * 10,
                  ty = to.y - (dy / len) * 10;
                const bend = from.role === to.role ? -22 : 0;
                const path = `M${from.x},${from.y} C${from.x + dx * 0.4},${from.y + bend} ${tx - dx * 0.4},${ty + bend} ${tx},${ty}`;
                const on =
                  selection?.id === e.id || chosenNode?.id === e.from || chosenNode?.id === e.to;
                return (
                  <g
                    key={e.id}
                    className={`ms-link${matchesLens([e.from, e.to], lenses) ? "" : " dim"}${on ? " on" : ""}`}
                  >
                    <path className="ms-link-line" d={path} markerEnd={`url(#${uid}-detail)`} />
                    <path
                      className="ms-link-hit"
                      d={path}
                      role="button"
                      tabIndex={0}
                      aria-label={`Lähderelaatio: ${edgeName(e)}`}
                      onClick={() => setSelection({ kind: "edge", id: e.id })}
                      onKeyDown={(event) =>
                        activate(event, () => setSelection({ kind: "edge", id: e.id }))
                      }
                    >
                      <title>
                        {edgeName(e)} · {e.type}
                      </title>
                    </path>
                  </g>
                );
              })}
              {detail.nodes.map(({ node, x: px, y: py, role }) => (
                <g
                  key={node.id}
                  style={{ "--node-tone": roleTones[role] } as React.CSSProperties}
                  className={`ms-node${matchesLens([node.id], lenses) ? "" : " dim"}${chosenNode?.id === node.id ? " on" : ""}${isScenario(node) ? " scenario" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${yearOf(node)} ${node.title}${isScenario(node) ? " · skenaario" : ""}`}
                  onClick={() => setSelection({ kind: "node", id: node.id })}
                  onKeyDown={(e) => activate(e, () => setSelection({ kind: "node", id: node.id }))}
                >
                  <circle cx={px} cy={py} r={role === "focus" ? 7 : 5} />
                  <title>
                    {yearOf(node)} · {node.title} · {roles[role]}
                    {isScenario(node) ? " · skenaario" : ""}
                  </title>
                </g>
              ))}
            </svg>
          </div>
          <p className="ms-note">
            Kortit sijoittuvat lähteen alkamisvuoteen, myös ankkurin aikavälin ulkopuolelle.
            Katkokehys = skenaario. Avaa piste tai relaation nuoli tarkistaaksesi tiedot.
          </p>
          <details>
            <summary>Ankkurin kortit tekstinä ({selected.nodes.length})</summary>
            <ul>
              {selected.nodes.map((id) => (
                <li key={id}>{nodeButton(id)}</li>
              ))}
            </ul>
          </details>
          <details>
            <summary>Tarkastelun alkuperäiset relaatiot ({model.edges.length})</summary>
            <ul>
              {model.edges.map((e) => (
                <li key={e.id}>
                  <button onClick={() => setSelection({ kind: "edge", id: e.id })}>
                    {edgeName(e)} · {e.id}
                  </button>
                </li>
              ))}
            </ul>
          </details>
          {detail.undated.length > 0 && (
            <details>
              <summary>Kortit ilman alkamisvuotta ({detail.undated.length})</summary>
              <ul>
                {detail.undated.map(({ node }) => (
                  <li key={node.id}>{nodeButton(node.id)}</li>
                ))}
              </ul>
              <p>Näiden korttien yhteydet ovat relaatioluettelossa; vuosilukua ei arvata.</p>
            </details>
          )}
        </section>
      )}
      {selection && (
        <aside
          ref={evidenceRef}
          className="ms-card"
          aria-label="Maiseman valinnan tiedot"
          aria-live="polite"
        >
          <div className="ms-row">
            <span className="v-kicker">Valinnan lähdetiedot</span>
            <button onClick={() => setSelection(null)}>Sulje tiedot</button>
          </div>
          {chosenNode ? (
            <>
              <h3>{chosenNode.title}</h3>
              <p>
                {yearOf(chosenNode)} ·{" "}
                {roles[model.nodes.find((n) => n.node.id === chosenNode.id)?.role ?? ""] ??
                  "Lähdekortti"}
                {isScenario(chosenNode) ? " · Skenaario / tulevaisuustarkastelu" : ""}
              </p>
              <p>{chosenNode.problem}</p>
              <p>
                <b>Lähteen mekanismitulkinta.</b> {chosenNode.mechanism}
              </p>
              <p>
                <b>Lähteen kuvaama seuraus.</b> {chosenNode.longEffect}
              </p>
              {!nodeLenses(chosenNode.id).size && <p>Teemalinssikytkentää ei ole määritelty.</p>}
              {linkedDecisions(chosenNode.id).map((d) => (
                <article key={d.id}>
                  <h4>
                    {d.aika} · {d.paatos}
                  </h4>
                  <p>Päätösaineiston arvio: {d.arvio}</p>
                  <p>{d.metatarina}</p>
                  {d.lahdelinkki && (
                    <a href={d.lahdelinkki} target="_blank" rel="noreferrer">
                      Päätöksen lähde: {d.lahde || "avaa lähde"}
                    </a>
                  )}
                  <button onClick={() => onExplore(d.id, chosenNode.id)}>
                    Näytä taustat ja seuraukset →
                  </button>
                </article>
              ))}
              <a href={networkSource.url} target="_blank" rel="noreferrer">
                TTT-lähdekortti · {chosenNode.id} ↗
              </a>
            </>
          ) : (
            <>
              <h3>
                {chosenLink
                  ? `Ankkuri ${chosenLink.from.slice(1)} → ${chosenLink.to.slice(1)}: alkuperäiset yhteydet`
                  : "Alkuperäinen lähderelaatio"}
              </h3>
              {chosenEdges.map(evidence)}
            </>
          )}
          <p className="ms-note">
            Vaikutusnäyttöä ja lähteen varmuusarvioita ei ole erikseen varmennettu tässä
            sovelluksessa.
          </p>
        </aside>
      )}
      <details className="ms-connections">
        <summary>Ankkurien väliset yhteydet tekstinä ({links.length} nippua)</summary>
        <ul>
          {links.map((link) => (
            <li key={link.id}>
              <button onClick={() => setSelection({ kind: "link", id: link.id })}>
                Ankkuri {link.from.slice(1)} → {link.to.slice(1)} · {link.edges.length}{" "}
                lähderelaatiota
              </button>
            </li>
          ))}
        </ul>
      </details>
      <p className="ms-note">
        Sama kiinnitetty TTT-verkosto ja seitsemän toimituksellista ankkuria kuin Systeemisessä
        aikajanassa. Puuttuva nuoli tarkoittaa puuttuvaa suoraa lähdeyhteyttä tässä rajauksessa.
        Ryhmittely ei muodosta uutta kausaaliväitettä. Yhteysmääriä ei tulkita vaikutuksen
        voimakkuudeksi.
      </p>
    </section>
  );
}
