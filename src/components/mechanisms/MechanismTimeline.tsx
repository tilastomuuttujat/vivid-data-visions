import { useRef, useState, type CSSProperties } from "react";
import { ERAS, MECHANISMS, EVENTS, eraOf } from "./mechanism-model";
import { LANDSCAPE, CURRENTS, eraEvents, eraWidth, landmarkEvents } from "./landscape-model";
import { MAIN_PATHS } from "./path-model";
import { PathProgress, BridgeReader } from "./PathReader";
import { EventReader } from "./EventReader";
import { MechanismExplorer } from "./MechanismExplorer";
import "./mechanism.css";
import "./landscape.css";

type View =
  | { level: "landscape" }
  | { level: "era"; era: number }
  | { level: "event"; era: number; event: string }
  | { level: "atlas"; era: number };
export function MechanismTimeline({ onExplore }: { onExplore: (id: string) => void }) {
  const [view, setView] = useState<View>({ level: "landscape" });
  const [routeId, setRouteId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [bridge, setBridge] = useState<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const route = MAIN_PATHS.find((p) => p.id === routeId);
  const index = view.level === "landscape" ? 0 : view.era;
  const era = ERAS[index]!;
  const land = LANDSCAPE[index]!;
  const go = (next: View) => {
    setView(next);
    setTimeout(() => heading.current?.focus(), 0);
  };
  const overview = () => {
    setRouteId(null);
    setBridge(null);
    go({ level: "landscape" });
  };
  const openEra = (i: number) => {
    setRouteId(null);
    setBridge(null);
    go({ level: "era", era: i });
  };
  const openEvent = (id: string) => {
    const event = EVENTS.find((e) => e.id === id)!;
    go({ level: "event", era: eraOf(event.year), event: id });
  };
  const routeStep = (i: number) => {
    setStep(i);
    setBridge(null);
  };
  return (
    <section className="mt sl" aria-label="Yhteiskunnan maisema 1850–2025">
      <nav className="sl-breadcrumb" aria-label="Kartan tarkkuustaso">
        <button onClick={overview} aria-current={view.level === "landscape" ? "page" : undefined}>
          1 · Kokonaiskuva
        </button>
        {view.level !== "landscape" && (
          <>
            <span aria-hidden="true">/</span>
            <button
              onClick={() => openEra(index)}
              aria-current={view.level === "era" ? "page" : undefined}
            >
              2 · {era.from}–{era.to}
            </button>
          </>
        )}
        {view.level === "event" && (
          <>
            <span aria-hidden="true">/</span>
            <span aria-current="page">3 · Päätös ja näyttö</span>
          </>
        )}
        {view.level === "atlas" && (
          <>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Mekanismien aikajana</span>
          </>
        )}
      </nav>
      <header className="sl-header">
        <span className="mt-eyebrow">
          {view.level === "landscape"
            ? "Suomi 1850–2025 · kokonaiskuva"
            : view.level === "era"
              ? "Tarkenna aikakauteen"
              : view.level === "event"
                ? "Porautuminen · päätös ja näyttö"
                : "Laaja tutkimisnäkymä"}
        </span>
        <h2 ref={heading} tabIndex={-1}>
          {view.level === "landscape"
            ? "Miten tähän päädyttiin?"
            : view.level === "era"
              ? era.title
              : view.level === "event"
                ? EVENTS.find((e) => e.id === view.event)!.title
                : "Seitsemän mekanismia samalla aikajanalla"}
        </h2>
        <p>
          {view.level === "landscape"
            ? "Omista instituutioista yhteisiin mahdollisuuksiin, kansainvälisiin riippuvuuksiin ja uudistumisen tarpeeseen. Valitse kartalta aikakausi ja katso, miten muutos tapahtui."
            : view.level === "era"
              ? era.lead
              : view.level === "event"
                ? "Tarkista, mitä valittiin, miten ratkaisun ajateltiin toimivan ja mitä sen vaikutuksista tiedetään."
                : "Tässä voit tarkastella kaikkia tapahtumia, mekanismeja ja pääreittejä rinnakkain."}
        </p>
      </header>
      {view.level === "landscape" && (
        <>
          <div className="sl-map" role="group" aria-label="Seitsemän kehitysvaiheen yleiskartta">
            <div className="sl-map-label">
              <span>SUURET KEHITYSVAIHEET</span>
              <span>
                1850 <span aria-hidden="true">⟶</span> 2025
              </span>
            </div>
            <div className="sl-regions">
              {ERAS.map((e, i) => (
                <button
                  key={e.from}
                  className="sl-region"
                  style={
                    {
                      "--sl-color": LANDSCAPE[i]!.color,
                      "--sl-width": eraWidth(i),
                    } as CSSProperties
                  }
                  onClick={() => openEra(i)}
                  aria-label={`Tarkenna aikakauteen ${e.from}–${e.to}: ${e.title}`}
                >
                  <span className="sl-year">
                    {e.from}–{e.to}
                  </span>
                  <strong>{LANDSCAPE[i]!.title}</strong>
                  <span className="sl-region-currents">
                    {LANDSCAPE[i]!.currents.map((c, j) => (
                      <span key={c} style={{ "--sl-stream": CURRENTS[j]!.color } as CSSProperties}>
                        {c}
                      </span>
                    ))}
                  </span>
                  <span className="sl-open">
                    Tutki vaihetta <span aria-hidden="true">↗</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="sl-map-key">
              {CURRENTS.map((c) => (
                <span key={c.title}>
                  <i style={{ background: c.color }} />
                  {c.title}
                </span>
              ))}
            </div>
          </div>
          <div className="sl-takeaway">
            <span aria-hidden="true">↳</span>
            <p>
              <b>Rakentaminen, laajentaminen ja sopeutuminen limittyvät.</b> Oikeudet, osaaminen ja
              yhteinen turva avaavat mahdollisuuksia. Samalla työn, väestön ja ulkoisten
              riippuvuuksien muutokset synnyttävät uusia ristiriitoja.
            </p>
          </div>
          <p className="sl-note">
            Kartan leveydet kuvaavat aikakausien kestoa. Värit erottavat vaiheita ja teemoja.
            Jäsennys on tulkinta, ei mitattu kehitysindeksi tai osoitettu syyketju.
          </p>
          <details className="sl-method">
            <summary>Miten karttaa luetaan?</summary>
            <p>
              Yleiskartta tiivistää seitsemän mekanismin tarkastelun kolmeen toistuvaan teemaan.
              Valitse aikakausi nähdäksesi sen mahdollisuudet, ristiriidat ja keskeiset solmukohdat.
              Avaa vasta sen jälkeen yksittäinen päätös tai pidempi kehitysreitti. Vaiheiden rajat
              ovat jäsennyksen apuvälineitä; muutokset eivät ala tai pääty kaikkialla samana vuonna.
            </p>
          </details>
        </>
      )}
      {view.level === "era" && (
        <>
          <nav className="sl-era-strip" aria-label="Vaihda tarkasteltavaa aikakautta">
            {ERAS.map((e, i) => (
              <button
                key={e.from}
                onClick={() => openEra(i)}
                aria-current={i === index ? "step" : undefined}
              >
                {e.from}
                <span>{LANDSCAPE[i]!.title}</span>
              </button>
            ))}
          </nav>
          <div className="sl-era-currents" aria-label="Aikakauden kolme suurta teemaa">
            {CURRENTS.map((c, j) => (
              <div key={c.title} style={{ borderColor: c.color }}>
                <small>{c.question}</small>
                <b>{land.currents[j]}</b>
              </div>
            ))}
          </div>
          <div className="sl-explanation">
            <div>
              <span>01 · Mahdollisuus</span>
              <h3>Mitä tämä avasi?</h3>
              <p>{era.gain}</p>
            </div>
            <div>
              <span>02 · Ristiriita</span>
              <h3>Mikä jäi ratkaisematta?</h3>
              <p>{era.tension}</p>
            </div>
            <div>
              <span>03 · Jatkuvuus</span>
              <h3>Mitä seuraava vaihe peri?</h3>
              <p>{era.inheritance}</p>
            </div>
          </div>
          <section className="sl-landmarks" aria-label="Aikakauden keskeiset solmukohdat">
            <h3>Minkä ratkaisujen ja murrosten kautta?</h3>
            <p>Avaa solmukohta, kun haluat nähdä päätökset ja niiden perustelut.</p>
            <div className="sl-node-row">
              {landmarkEvents(index).map((e) => (
                <button key={e.id} onClick={() => openEvent(e.id)}>
                  <small>
                    {e.year} · {e.kind === "context" ? "Murros" : "Ratkaisu"}
                  </small>
                  <b>{e.title}</b>
                  <span>{e.change}</span>
                  <em>Tarkista päätös ja näyttö ↗</em>
                </button>
              ))}
            </div>
            <details className="sl-more">
              <summary>
                Muut tämän aikakauden solmukohdat (
                {eraEvents(index).filter((e) => !land.nodes.some((id) => id === e.id)).length})
              </summary>
              <div className="sl-event-list">
                {eraEvents(index)
                  .filter((e) => !land.nodes.some((id) => id === e.id))
                  .map((e) => (
                    <button key={e.id} onClick={() => openEvent(e.id)}>
                      {e.year} · {e.title} ↗
                    </button>
                  ))}
              </div>
            </details>
          </section>
          <details className="sl-more">
            <summary>Miten vaihe liittyy pidempiin kehitysreitteihin?</summary>
            <p>
              Valitse yksi kysymys. Reitti on toimituksellinen lukutapa; siltojen perustelut
              avautuvat erikseen.
            </p>
            <div className="sl-route-picker">
              {MAIN_PATHS.filter((p) =>
                p.steps.some((s) => eraOf(EVENTS.find((e) => e.id === s.event)!.year) === index),
              ).map((p) => (
                <button
                  key={p.id}
                  aria-pressed={routeId === p.id}
                  onClick={() => {
                    setRouteId(p.id);
                    setBridge(null);
                    setStep(
                      Math.max(
                        0,
                        p.steps.findIndex(
                          (s) => eraOf(EVENTS.find((e) => e.id === s.event)!.year) === index,
                        ),
                      ),
                    );
                  }}
                >
                  {p.question} <span aria-hidden="true">⟶</span>
                </button>
              ))}
            </div>
            {route && (
              <div className="sl-route">
                <PathProgress
                  route={route}
                  eventId={route.steps[step]!.event}
                  onStep={routeStep}
                  onBridge={(i) => {
                    setStep(i + 1);
                    setBridge(i);
                  }}
                />
                <button className="sl-primary" onClick={() => openEvent(route.steps[step]!.event)}>
                  Avaa valitun solmukohdan päätös ja näyttö ↗
                </button>
                {bridge !== null && (
                  <BridgeReader route={route} index={bridge} onClose={() => setBridge(null)} />
                )}
              </div>
            )}
          </details>
          <details className="sl-more">
            <summary>Miten seitsemän mekanismia näkyvät tässä vaiheessa?</summary>
            <div className="sl-mechanisms">
              {MECHANISMS.map((m) => (
                <div key={m.id} style={{ borderColor: m.color }}>
                  <b>
                    {m.n}. {m.short}
                  </b>
                  <span>{m.states[index]}</span>
                </div>
              ))}
            </div>
            <button onClick={() => go({ level: "atlas", era: index })}>
              Avaa kaikkien mekanismien aikajana ↗
            </button>
          </details>
          <nav className="sl-next" aria-label="Etene aikakausissa">
            <button disabled={index === 0} onClick={() => openEra(index - 1)}>
              ← Edellinen vaihe
            </button>
            <button onClick={overview}>Palaa kokonaiskuvaan</button>
            <button disabled={index === 6} onClick={() => openEra(index + 1)}>
              Seuraava vaihe →
            </button>
          </nav>
        </>
      )}
      {view.level === "event" && (
        <>
          <button className="sl-back" onClick={() => go({ level: "era", era: index })}>
            ← Takaisin aikakauden kokonaisuuteen
          </button>
          <EventReader
            selected={EVENTS.find((e) => e.id === view.event)!}
            route={route?.steps.some((s) => s.event === view.event) ? route : undefined}
            onExplore={onExplore}
          />
        </>
      )}
      {view.level === "atlas" && (
        <>
          <button className="sl-back" onClick={() => go({ level: "era", era: index })}>
            ← Takaisin aikakauden kokonaisuuteen
          </button>
          <MechanismExplorer onExplore={onExplore} initialEra={index} />
        </>
      )}
    </section>
  );
}
