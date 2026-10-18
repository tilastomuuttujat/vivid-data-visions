import { MECHANISMS, eventDecisions, type MechanismEvent } from "./mechanism-model";
import { NodeQuestions } from "./PathReader";
import type { MainPath } from "./path-model";
export function EventReader({
  selected,
  route,
  onExplore,
}: {
  selected: MechanismEvent;
  route?: MainPath | undefined;
  onExplore: (id: string) => void;
}) {
  const decisions = eventDecisions(selected);
  return (
    <article className="mt-detail" aria-label="Valitun murroksen tarina">
      <div className="mt-detail-main">
        <span className="mt-eyebrow">
          {selected.kind === "context" ? "Historiallinen murros" : "Päätös tai uudistuskokonaisuus"}{" "}
          · {selected.year}
        </span>
        <h3>{selected.title}</h3>
        <p className="mt-change">{selected.change}</p>
        {selected.dateNote && <p className="mt-date-note">Ajoitus: {selected.dateNote}</p>}
        <NodeQuestions event={selected} route={route} />
        <p className="mt-editorial">
          Edellä oleva mekanismikuvaus on toimituksellinen tulkinta. Se ei mittaa päätöksen
          nettovaikutusta eikä osoita vaikutuksen suuruutta.
        </p>
      </div>
      <aside className="mt-connections" aria-label="Murrokseen liitetyt mekanismit">
        <h4>Yksi murros, useita näkökulmia</h4>
        {selected.mechanisms.map((id) => {
          const m = MECHANISMS.find((m) => m.id === id)!;
          return (
            <div key={id} style={{ borderColor: m.color }}>
              <b style={{ color: m.color }}>
                {m.icon} {m.n}. {m.title}
              </b>
              <p>{m.question}</p>
            </div>
          );
        })}
        <small>
          Yhteinen tapahtuma kytkee näkökulmat tässä jäsennyksessä. Tämä ei lisää uusia
          kausaalisuhteita lähdeverkostoon.
        </small>
      </aside>
      <div className="mt-evidence">
        <h4>Tarkista päätökset ja lähteet</h4>
        {decisions.length ? (
          decisions.map((d) => (
            <div key={d.id}>
              <span>{d.aika}</span>
              <p>{d.paatos}</p>
              <div>
                <a href={d.lahdelinkki} target="_blank" rel="noreferrer">
                  Alkuperäinen lähde: {d.lahde}
                </a>
                <button onClick={() => onExplore(d.id)}>Avaa päätöskortti {d.id}</button>
              </div>
            </div>
          ))
        ) : (
          <p>
            Tämä on aikajanan historiallinen taustajakso, ei yksittäinen päätös. Tässä valinnassa ei
            ole erillistä päätöskorttikytkentää.
          </p>
        )}
      </div>
    </article>
  );
}
