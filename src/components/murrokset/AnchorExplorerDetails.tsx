import { ANCHORS } from "./ankkurit-model";
import {
  linkedDecisions,
  networkNode,
  networkSource,
  isScenario,
  type NetworkEdge,
} from "./decision-network-model";

export function AnchorExplorerDetails({
  nodeId,
  edge,
  anchorId,
  onNode,
  onClose,
}: {
  nodeId: string | null;
  edge: NetworkEdge | undefined;
  anchorId: string | null;
  onNode: (id: string) => void;
  onClose: () => void;
}) {
  const node = nodeId ? networkNode(nodeId) : undefined;
  const anchor = ANCHORS.find((a) => a.id === anchorId);
  if (!edge && !node && !anchor) return null;
  const year = (id: string) => {
    const n = networkNode(id)!;
    return n.yearStart == null
      ? "Ajankohta avoin"
      : `${n.yearStart}${n.yearEnd != null && n.yearEnd !== n.yearStart ? `–${n.yearEnd}` : ""}`;
  };
  return (
    <aside
      className="ae-inspector"
      aria-label={
        edge
          ? "Yhteisen kuvaajan relaatiotiedot"
          : node
            ? "Valitun kortin tiedot"
            : "Korostetun ankkurin tulkinta"
      }
      aria-live="polite"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      }}
    >
      <div className="ae-panel-head">
        <span>Valinnan tiedot</span>
        <button onClick={onClose}>Sulje valinnan tiedot</button>
      </div>
      {edge ? (
        <>
          <small>{anchor ? `Ankkurin ${anchor.n} kaaristo` : "Lähderelaatio"}</small>
          <h3>
            {networkNode(edge.from)!.title} → {networkNode(edge.to)!.title}
          </h3>
          <div className="ae-endpoints">
            {[edge.from, edge.to].map((id, i) => (
              <button key={`${i}-${id}`} onClick={() => onNode(id)}>
                {i ? "Seuraava kortti" : "Lähtökortti"}: {year(id)} · {networkNode(id)!.title}
              </button>
            ))}
          </div>
          <p>{edge.rationale || "Perustelu puuttuu lähteestä."}</p>
          <p>
            {edge.type} · {edge.relationClass} · lähteen varmuusarvio: {edge.confidence}
          </p>
          <a href={networkSource.url} target="_blank" rel="noreferrer">
            TTT-lähde · {edge.id} ↗
          </a>
        </>
      ) : node ? (
        <>
          <small>
            {year(node.id)}
            {isScenario(node) ? " · Skenaario / tulevaisuustarkastelu" : ""}
          </small>
          <h3>{node.title}</h3>
          <p>{node.problem}</p>
          <p>
            <b>Lähteen mekanismitulkinta.</b> {node.mechanism}
          </p>
          <p>
            <b>Lähteen kuvaama seuraus.</b> {node.longEffect}
          </p>
          {linkedDecisions(node.id).map((d) => (
            <article key={d.id}>
              <h4>
                {d.aika} · {d.paatos}
              </h4>
              <p>{d.metatarina}</p>
              {d.lahdelinkki && (
                <a href={d.lahdelinkki} target="_blank" rel="noreferrer">
                  Päätöksen lähde: {d.lahde || "avaa lähde"}
                </a>
              )}
            </article>
          ))}
          <a href={networkSource.url} target="_blank" rel="noreferrer">
            TTT-lähdekortti · {node.id} ↗
          </a>
        </>
      ) : anchor ? (
        <>
          <h3>
            {anchor.n}. {anchor.title}
          </h3>
          <p>
            <b>Toimituksellinen mekanismitulkinta.</b> {anchor.mechanism}
          </p>
          <p>
            <b>Nykytilan tulkinta.</b> {anchor.now}
          </p>
          <h4>Valitse yksittäinen lähdekortti</h4>
          {anchor.nodes.map((id) => (
            <button key={id} className="ae-source-choice" onClick={() => onNode(id)}>
              {year(id)} · {networkNode(id)!.title}
            </button>
          ))}
        </>
      ) : null}
      <p className="ae-caution">
        Vaikutusnäyttöä ja lähteen varmuusarvioita ei ole erikseen varmennettu. Korostettu reitti on
        lähdeverkoston yhteys, ei osoitettu vaikutuksen suuruus.
      </p>
    </aside>
  );
}
