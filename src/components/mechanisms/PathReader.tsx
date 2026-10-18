import { QUESTIONS, MAIN_PATHS, pathEvent, bridgeEvidence, type MainPath } from "./path-model";
import { eventDecisions, type MechanismEvent } from "./mechanism-model";
import { networkNode, networkSource } from "../murrokset/decision-network-model";
export function PathPicker({
  routeId,
  onRoute,
}: {
  routeId: string | null;
  onRoute: (id: string | null) => void;
}) {
  return (
    <section className="mp-picker" aria-label="Valitse kysymys ja pääreitti">
      <h3>Minkä kehitysreitin haluat ymmärtää?</h3>
      <p>
        Valitse kysymys. Kultainen katkoviiva seuraa valittuja historiallisia solmukohtia
        mekanismien välillä. Se on toimituksellinen lukureitti, ei sellaisenaan todistettu
        vaikutusketju.
      </p>
      <div className="mp-route-options">
        {MAIN_PATHS.map((p, i) => (
          <button key={p.id} aria-pressed={routeId === p.id} onClick={() => onRoute(p.id)}>
            <span>
              Reitti {i + 1} · {p.steps.length} solmua
            </span>
            <b>{p.question}</b>
            <small>{p.summary}</small>
          </button>
        ))}
      </div>
      <button className="mp-reset" aria-pressed={routeId === null} onClick={() => onRoute(null)}>
        Kokonaiskuva ilman pääreittiä
      </button>
    </section>
  );
}
export function PathProgress({
  route,
  eventId,
  onStep,
  onBridge,
}: {
  route: MainPath;
  eventId: string;
  onStep: (index: number) => void;
  onBridge: (index: number) => void;
}) {
  const index = route.steps.findIndex((s) => s.event === eventId);
  return (
    <section className="mp-progress" aria-label="Valitun pääreitin solmukohdat">
      <h3>{route.question}</h3>
      <p>
        Seuraa solmuja järjestyksessä. Silta avaa kysymyksen siitä, miten kaksi solmua liittyy
        toisiinsa. Aikakauden tai reitin ulkopuolisen tapahtuman valinta palauttaa kokonaiskuvan.
      </p>
      <div className="mp-route-steps">
        {route.steps.map((s, i) => (
          <div key={s.event}>
            <button aria-current={index === i ? "step" : undefined} onClick={() => onStep(i)}>
              <b>{i + 1}</b>
              <span>
                {pathEvent(s).year} · {pathEvent(s).title}
              </span>
            </button>
            {i < route.steps.length - 1 && (
              <button className="mp-bridge-button" onClick={() => onBridge(i)}>
                Miten nämä liittyvät? <span className="sr-only">Silta {i + 1}</span> ⇢
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="mp-step-controls">
        <button disabled={index <= 0} onClick={() => onStep(index - 1)}>
          ← Edellinen reittisolmu
        </button>
        <span>
          Solmu {index + 1}/{route.steps.length}
        </span>
        <button
          disabled={index < 0 || index === route.steps.length - 1}
          onClick={() => onStep(index + 1)}
        >
          Seuraava reittisolmu →
        </button>
      </div>
      <details className="mp-feedback">
        <summary>↺ Miten tämän reitin seuraukset voivat muuttaa lähtötilannetta?</summary>
        <p>{route.feedback}</p>
        <small>Tutkittava palautekytkentä, ei tässä aineistossa osoitettu vaikutus.</small>
      </details>
    </section>
  );
}
export function BridgeReader({
  route,
  index,
  onClose,
}: {
  route: MainPath;
  index: number;
  onClose: () => void;
}) {
  const from = route.steps[index]!,
    to = route.steps[index + 1]!,
    source = bridgeEvidence(from, to);
  return (
    <article
      id="mp-bridge-reader"
      className="mp-bridge-reader"
      aria-label="Valitun sillan perustelu"
    >
      <header>
        <h4>Miten {pathEvent(from).title.toLocaleLowerCase("fi")} liittyy seuraavaan solmuun?</h4>
        <button onClick={onClose}>Sulje sillan perustelu</button>
      </header>
      <p>
        <b>
          {pathEvent(from).year} · {pathEvent(from).title}
        </b>{" "}
        ⇢{" "}
        <b>
          {pathEvent(to).year} · {pathEvent(to).title}
        </b>
      </p>
      <span className="mp-badge">Toimituksellinen reittiselitys</span>
      <p>{route.bridges[index]}</p>
      <div className="mp-branch">
        <h4>◇ Mitä muuta olisi voinut tapahtua?</h4>
        <p>{route.alternative}</p>
        <small>
          Tämä on tutkittava haarautumiskysymys. Se ei osoita, että vaihtoehto oli aikanaan
          valmisteltu tai toteuttamiskelpoinen.
        </small>
      </div>
      <h4>Millä perusteella yhteyttä voi arvioida?</h4>
      {source.length ? (
        <>
          <p className="mp-badge">
            Lähdeverkossa kirjattu suora yhteys · {source.length} relaatiota
          </p>
          {source.map((e) => (
            <p key={e.id}>
              <b>
                {networkNode(e.from)?.title} → {networkNode(e.to)?.title}
              </b>
              <br />
              {e.type} · {e.id}
              <br />
              {e.rationale}
            </p>
          ))}
          <a href={networkSource.url} target="_blank" rel="noreferrer">
            Alkuperäinen relaatioaineisto
          </a>
          <p className="mp-note">
            Lähteeseen kirjattu relaatio ei yksin ole riippumaton vaikutustutkimus. Vain päätösten
            tarkkojen vastinkorttien väliset suorat, oikeansuuntaiset relaatiot näytetään tässä.
          </p>
        </>
      ) : (
        <p>
          Valittujen päätösten tarkkojen vastinkorttien väliltä ei löydy suoraa oikeansuuntaista
          lähderelaatiota. Silta on tässä toimituksellinen tutkimuskysymys. Pelkkä ajallinen
          peräkkäisyys ei todista vaikutusta, eikä relaation puuttuminen todista yhteyden
          puuttumista.
        </p>
      )}
    </article>
  );
}
export function NodeQuestions({
  event,
  route,
}: {
  event: MechanismEvent;
  route: MainPath | undefined;
}) {
  const decisions = eventDecisions(event),
    index = route?.steps.findIndex((s) => s.event === event.id) ?? -1;
  const next = route && index >= 0 ? route.steps[index + 1] : undefined;
  return (
    <section className="mp-questions" aria-label="Solmukohdan kuusi tarkistuskysymystä">
      <h4>Tarkista solmukohta samoilla kysymyksillä</h4>
      {QUESTIONS.map((q, i) => (
        <details key={q} open={i === 0 || i === 2}>
          <summary>
            <span>{i + 1}</span>
            {q}
          </summary>
          <div>
            {i === 0 ? (
              <>
                <p>
                  {decisions.length
                    ? "Päätösaineistoon kirjatut tavoitteet:"
                    : "Tässä solmussa tarkastellaan historiallista toimintaympäristöä."}
                </p>
                {decisions.map((d) => (
                  <p key={d.id}>{d.tavoite}</p>
                ))}
                <small>
                  Tavoite ei yksin osoita tarpeen suuruutta tai sitä, mikä poliittinen paine
                  ratkaisi päätöksen.
                </small>
              </>
            ) : i === 1 ? (
              <>
                <p>{event.change}</p>
                <p>
                  Vastuutoimijat, valmistelun erimielisyydet ja toteuttamiskelpoiset vaihtoehdot on
                  tarkistettava alkuperäisistä päätöslähteistä. Niitä ei ole tässä koottu
                  kattavasti.
                </p>
                {route && <p>Tutkittava vaihtoehtokysymys: {route.alternative}</p>}
              </>
            ) : i === 2 ? (
              <>
                <p>{event.opportunity}</p>
                <small>Toimituksellinen tulkinta oletetusta vaikutusmekanismista.</small>
              </>
            ) : i === 3 ? (
              <>
                <p>
                  Tässä solmussa kuvataan päätös tai historiallinen tapahtuma. Näkymä ei sisällä
                  erillistä, päätökselle kohdennettua vaikutusaikasarjaa.
                </p>
                <p>{event.dateNote ?? "Vaikutusten toteutumisviivettä ei ole tässä mitattu."}</p>
                {decisions.map((d) => (
                  <p key={d.id}>
                    <b>Riskinjako päätösaineistossa:</b> {d.riskinjako}
                  </p>
                ))}
                <small>
                  Päätöksen säätämistä tai toteutusta ei tulkita automaattisesti tavoitteiden
                  saavuttamiseksi.
                </small>
              </>
            ) : i === 4 ? (
              <>
                <p>
                  Alkuperäislähteet osoittavat, mihin päätöskuvaus perustuu. Ne eivät sellaisenaan
                  osoita sen yhteiskunnallista nettovaikutusta.
                </p>
                {decisions.map((d) => (
                  <p key={d.id}>{d.vaikutusnaytto}</p>
                ))}
                <p>
                  Reittisillan perustelusta voi erikseen tarkistaa, onko lähdeverkossa kirjattu
                  suora yhteys. Tutkimuksella osoitettua vaikutusta ei merkitä ilman erillistä
                  näyttöä.
                </p>
              </>
            ) : (
              <>
                <p>{event.tension}</p>
                {next ? (
                  <p>
                    Seuraava tarkastelukohta:{" "}
                    <b>
                      {pathEvent(next).year} · {pathEvent(next).title}
                    </b>
                    . Reitin eteneminen on tulkinta, ei todiste siitä, että tämä päätös aiheutti
                    seuraavan.
                  </p>
                ) : (
                  <p>
                    Tämä avaa kysymyksen seuraavan vaiheen mahdollisuuksista ja rajoitteista; se ei
                    ole ennuste.
                  </p>
                )}
                {route && <p>Palautekysymys: {route.feedback}</p>}
              </>
            )}
          </div>
        </details>
      ))}
    </section>
  );
}
