import { useId, useState } from "react";
import { Link } from "@tanstack/react-router";
import { DECISIONS } from "./murrokset-model";
import {
  decisionMappings,
  edgesFor,
  isScenario,
  linkedDecisions,
  networkNode,
  networkSource,
  otherNode,
  relatedAnalyses,
  type Direction,
  type NetworkEdge,
} from "./decision-network-model";
import "./decision-network.css";

const classLabels: Record<string, string> = {
  rakenne: "Rakenteellinen yhteys",
  kaari: "Kehityskaari",
  tulkinta: "Analyyttinen tulkinta",
  tapahtuma: "Tapahtumayhteys",
};
const typeLabels: Record<string, string> = {
  enabled: "Mahdollisti",
  supported: "Tuki",
  created_capacity_for: "Loi toimintakykyä",
  accelerated: "Kiihdytti",
  created_pressure_for: "Loi muutospainetta",
  evolved_into: "Kehittyi osaksi",
  contributed_to: "Myötävaikutti",
  replaced_by: "Korvautui",
  triggered: "Laukaisi",
  complemented_by: "Täydentyi",
  created_reform_pressure: "Loi uudistuspainetta",
  coexisted_with: "Esiintyi rinnakkain",
  structural_precursor: "Rakenteellinen edeltäjä",
  integrates: "Kokoaa osakseen",
  caused: "Aiheutti (lähteen väite)",
  coincided_with: "Ajoittui yhteen",
  same_process_as: "Osa samaa prosessia",
  may_produce: "Saattaa tuottaa",
};
type View = "interpretation" | "comparison" | "data";
const views: { id: View; label: string }[] = [
  { id: "interpretation", label: "Tulkinta" },
  { id: "comparison", label: "Vertailu" },
  { id: "data", label: "Aineisto" },
];

export function DecisionNetwork({
  decisionId,
  onDecision,
}: {
  decisionId: string;
  onDecision: (id: string) => void;
}) {
  const uid = useId();
  const decision = DECISIONS.find((d) => d.id === decisionId)!;
  const mapping = decisionMappings[decisionId];
  const [focus, setFocus] = useState(mapping?.nodes[0] ?? "");
  const [history, setHistory] = useState<string[]>([]);
  const [view, setView] = useState<View>("interpretation");
  const [direction, setDirection] = useState<Direction>("all");
  const node = networkNode(focus);
  const incoming = edgesFor(focus, "incoming");
  const outgoing = edgesFor(focus, "outgoing");
  const edges = edgesFor(focus, direction);
  const navigate = (id: string) => {
    if (id === focus) return;
    setHistory([...history, focus]);
    setFocus(id);
  };
  const relationCard = (edge: NetworkEdge) => {
    const other = otherNode(edge, focus);
    return (
      <li key={edge.id} className="dn-edge">
        <button className="dn-node-button" onClick={() => navigate(other.id)}>
          <span>
            {other.yearStart ?? "Ajankohta avoin"}
            {isScenario(other) ? " · Skenaario / tulevaisuustarkastelu" : ""}
          </span>
          <strong>{other.title}</strong>
          <small>Tutki tämän solmun yhteyksiä →</small>
        </button>
        <p>
          <b>{typeLabels[edge.type] ?? "Lähteen kuvaama yhteys"}.</b>{" "}
          {edge.rationale || "Perustelu puuttuu lähteestä."}
        </p>
        <p className="dn-meta">
          {classLabels[edge.relationClass] ?? edge.relationClass} · Lähteen varmuusarvio:{" "}
          {edge.confidence}
        </p>
        <p className="dn-limit">Vaikutusnäyttö: ei erikseen varmennettu tässä sovelluksessa.</p>
        <a href={networkSource.url} target="_blank" rel="noreferrer">
          Relaation lähde: TTT · {edge.id}
        </a>
      </li>
    );
  };

  return (
    <section className="dn" id="m-verkosto" aria-labelledby={`${uid}-title`}>
      <p className="v-kicker">Päätösverkosto · taustat ja seuraukset</p>
      <h2 id={`${uid}-title`}>Mihin päätös liittyy — ja mitä siitä seurasi?</h2>
      <p>
        Seuraa lähteeseen kirjattuja saapuvia ja lähteviä yhteyksiä. Nuoli kertoo relaation suunnan;
        yhteys voi olla esimerkiksi rinnakkaiskehitystä eikä yksin osoita syy-yhteyttä.
      </p>
      <label htmlFor={`${uid}-decision`}>Aikajanan päätös</label>
      <select
        id={`${uid}-decision`}
        value={decisionId}
        onChange={(e) => onDecision(e.target.value)}
      >
        {DECISIONS.map((d) => (
          <option key={d.id} value={d.id}>
            {d.aika} · {d.paatos}
            {decisionMappings[d.id] ? "" : " · ei verkostovastinetta"}
          </option>
        ))}
      </select>
      <p className="dn-origin">
        <b>Lähtöpäätös:</b> {decision.aika} · {decision.paatos}
      </p>
      {decision.lahdelinkki && (
        <a href={decision.lahdelinkki} target="_blank" rel="noreferrer">
          Lähtöpäätöksen lähde: {decision.lahde || "avaa lähde"}
        </a>
      )}
      <p className="dn-limit">
        Verkoston perustelut ovat TTT-aineiston toimituksellisia tulkintoja. Lähteen varmuusarvio ei
        ole tämän sovelluksen riippumaton näytön arvio.
      </p>
      {!mapping || !node ? (
        <div className="dn-empty" role="status">
          <h3>Tälle päätökselle ei ole vielä tarkistettua verkostovastinetta.</h3>
          <p>
            Yhteyksiä ei päätellä yhteisestä vuosiluvusta tai samankaltaisesta otsikosta. Päätöksen
            lähde ja laboratorion tausta-analyysit ovat silti käytettävissä.
          </p>
        </div>
      ) : (
        <>
          <p>
            <b>
              {mapping.match === "decision"
                ? "Päätösvastine"
                : "Aiheyhteys, ei täsmällinen päätösvastine"}
              .
            </b>{" "}
            {mapping.basis}
          </p>
          {mapping.nodes.length > 1 && (
            <div className="dn-controls" role="group" aria-label="Lähtöpäätöksen verkostokortit">
              {mapping.nodes.map((id) => (
                <button key={id} aria-pressed={focus === id} onClick={() => navigate(id)}>
                  {networkNode(id)!.title}
                </button>
              ))}
            </div>
          )}
          <div className="dn-controls" role="group" aria-label="Verkoston näyttötila">
            {views.map((v) => (
              <button key={v.id} aria-pressed={view === v.id} onClick={() => setView(v.id)}>
                {v.label}
              </button>
            ))}
          </div>
          <div className="dn-controls" role="group" aria-label="Relaatioiden suunta">
            {(
              [
                { id: "all", label: "Kaikki yhteydet" },
                { id: "incoming", label: `Taustat (${incoming.length})` },
                { id: "outgoing", label: `Seuraukset (${outgoing.length})` },
              ] as const
            ).map((d) => (
              <button
                key={d.id}
                aria-pressed={direction === d.id}
                onClick={() => setDirection(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="dn-navigation">
            <button
              disabled={!history.length}
              onClick={() => {
                setFocus(history.at(-1)!);
                setHistory(history.slice(0, -1));
              }}
            >
              ← Edellinen solmu
            </button>
            <button
              disabled={focus === mapping.nodes[0]}
              onClick={() => {
                setFocus(mapping.nodes[0]!);
                setHistory([]);
              }}
            >
              Palaa lähtöpäätökseen
            </button>
          </div>
          <article className="dn-focus" aria-live="polite">
            <p className="v-kicker">
              Tarkasteltava verkostosolmu · {node.yearStart ?? "Ajankohta avoin"}
              {isScenario(node) ? " · Skenaario / tulevaisuustarkastelu" : ""}
            </p>
            <h3>{node.title}</h3>
            {view === "interpretation" && (
              <dl>
                <dt>Lähteessä kuvattu ongelma</dt>
                <dd>{node.problem || "Ei kuvausta."}</dd>
                <dt>Lähteen mekanismitulkinta</dt>
                <dd>{node.mechanism || "Ei kuvausta."}</dd>
                <dt>Lähteen pitkän vaikutuksen tulkinta</dt>
                <dd>{node.longEffect || "Ei kuvausta."}</dd>
              </dl>
            )}
            {linkedDecisions(focus)
              .filter((d) => d.id !== decisionId)
              .map((d) => (
                <button key={d.id} onClick={() => onDecision(d.id)}>
                  Avaa aikajanan päätös: {d.aika} · {d.paatos}
                </button>
              ))}
          </article>
          {edges.length === 0 && (
            <p role="status">
              Valitussa suunnassa ei ole kirjattuja yhteyksiä. Tämä ei osoita vaikutusten
              puuttumista.
            </p>
          )}
          {view === "interpretation" && (
            <div className="dn-branches">
              {direction !== "outgoing" && (
                <div>
                  <h3>Taustat → {node.title}</h3>
                  <ul aria-label="Saapuvat relaatiot">{incoming.map(relationCard)}</ul>
                </div>
              )}
              {direction !== "incoming" && (
                <div>
                  <h3>{node.title} → Seuraukset</h3>
                  <ul aria-label="Lähtevät relaatiot">{outgoing.map(relationCard)}</ul>
                </div>
              )}
            </div>
          )}
          {view === "comparison" && (
            <div className="dn-table">
              <table>
                <caption>{node.title}: relaatiot ja niiden epävarmuus</caption>
                <thead>
                  <tr>
                    <th>Suunta</th>
                    <th>Yhteys</th>
                    <th>Perustelu</th>
                    <th>Lähteen varmuusarvio</th>
                  </tr>
                </thead>
                <tbody>
                  {edges.map((e) => (
                    <tr key={e.id}>
                      <td>{e.to === focus ? "Saapuva" : "Lähtevä"}</td>
                      <th scope="row">
                        <button onClick={() => navigate(otherNode(e, focus).id)}>
                          {networkNode(e.from)!.title} → {networkNode(e.to)!.title}
                        </button>
                      </th>
                      <td>
                        {e.rationale || "Perustelu puuttuu."}
                        <small>{classLabels[e.relationClass] ?? e.relationClass}</small>
                      </td>
                      <td>
                        {e.confidence}
                        <small>Vaikutusnäyttö varmistamatta</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {view === "data" && (
            <div className="dn-data">
              <h3>Alkuperä ja lähdeviitteet</h3>
              <p>TTT-aineiston tila: {networkSource.status}</p>
              <p>
                Verkostokortin lähdeviitteet alkuperäisaineistossa; niiden sisältöä ei ole
                tarkistettu tässä integraatiossa:
              </p>
              {node.sources.length ? (
                <ul>
                  {node.sources.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              ) : (
                <p>Kortin lähdeviitteet puuttuvat.</p>
              )}
              <p>
                Relaatioille on kirjattu perustelu ja varmuusarvio, mutta aineisto ei sisällä
                erillisiä relaatioiden tutkimuslähteitä.
              </p>
              <a href={networkSource.url} target="_blank" rel="noreferrer">
                Avaa versioitu alkuperäisaineisto
              </a>
              <dl>
                <dt>Solmutunniste</dt>
                <dd>{node.id}</dd>
                <dt>Lähdeversio</dt>
                <dd>{networkSource.commit}</dd>
                <dt>Aineisto haettu</dt>
                <dd>{networkSource.retrieved}</dd>
              </dl>
              <details>
                <summary>Valittujen relaatioiden alkuperäiset kentät ({edges.length})</summary>
                <pre>{JSON.stringify(edges, null, 2)}</pre>
              </details>
            </div>
          )}
        </>
      )}
      <nav className="dn-analysis" aria-label="Lähtöpäätöksen tausta-analyysit">
        <b>Vertaa lähtöpäätöstä laboratorion havaintoihin:</b>
        {relatedAnalyses(decisionId).map((a) => (
          <Link key={a.hash} to="/laboratorio" hash={a.hash}>
            {a.label} →
          </Link>
        ))}
      </nav>
      <p className="dn-limit">
        Näytössä ei lasketa painepisteitä tai automaattista evidenssiluokkaa. Vain
        alkuperäisaineiston relaatiot piirretään; uusia yhteyksiä ei muodosteta puuttuvien tilalle.
      </p>
    </section>
  );
}
