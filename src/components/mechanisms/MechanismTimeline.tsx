import { useId, useMemo, useRef, useState } from "react";
import {
  MECHANISMS,
  ERAS,
  EVENTS,
  eraOf,
  eventDecisions,
  eventMarkers,
  timelineX,
  type MechanismId,
} from "./mechanism-model";
import { MAIN_PATHS, pathPosition, bridgePath } from "./path-model";
import { PathPicker, PathProgress, BridgeReader, NodeQuestions } from "./PathReader";
import "./mechanism.css";
const W = 1460,
  H = 900,
  TOP = 115,
  ROW = 106;
export function MechanismTimeline({ onExplore }: { onExplore: (id: string) => void }) {
  const [era, setEra] = useState(0),
    [eventId, setEventId] = useState("school"),
    [focus, setFocus] = useState<MechanismId | null>(null);
  const [routeId, setRouteId] = useState<string | null>(null);
  const [bridge, setBridge] = useState<number | null>(null);
  const route = MAIN_PATHS.find((p) => p.id === routeId);
  const selected = EVENTS.find((e) => e.id === eventId)!;
  const chapter = ERAS[era]!;
  const decisions = useMemo(() => eventDecisions(selected), [selected]);
  const uid = useId().replace(/:/g, "");
  const scroll = useRef<HTMLDivElement>(null),
    detail = useRef<HTMLElement>(null);
  const choose = (id: string) => {
    const event = EVENTS.find((e) => e.id === id)!;
    if (route && !route.steps.some((s) => s.event === id)) setRouteId(null);
    setBridge(null);
    setEventId(id);
    setEra(eraOf(event.year));
  };
  const chooseEra = (index: number) => {
    setRouteId(null);
    setBridge(null);
    setEra(index);
    const event = EVENTS.find((e) => eraOf(e.year) === index)!;
    setEventId(event.id);
    if (scroll.current)
      scroll.current.scrollLeft = Math.max(
        0,
        ((timelineX(ERAS[index]!.from) - 230) * scroll.current.scrollWidth) / W,
      );
  };
  const chooseRoute = (id: string | null) => {
    setRouteId(id);
    setBridge(null);
    setFocus(null);
    const target = MAIN_PATHS.find((p) => p.id === id)?.steps[0];
    if (target) {
      const event = EVENTS.find((e) => e.id === target.event)!;
      setEventId(event.id);
      setEra(eraOf(event.year));
    }
    if (scroll.current)
      scroll.current.scrollLeft = target
        ? Math.max(0, ((pathPosition(target).x - 230) * scroll.current.scrollWidth) / W)
        : 0;
  };
  const chooseStep = (index: number) => {
    if (route?.steps[index]) {
      const step = route.steps[index]!;
      choose(step.event);
      if (scroll.current)
        scroll.current.scrollLeft = Math.max(
          0,
          ((pathPosition(step).x - 230) * scroll.current.scrollWidth) / W,
        );
    }
  };
  const chooseBridge = (index: number) => {
    chooseStep(index + 1);
    setBridge(index);
  };
  const events = EVENTS.filter((e) => eraOf(e.year) === era);
  return (
    <section className="mt" aria-label="Seitsemän yhteiskunnan kehityspolkua">
      <header className="mt-hero">
        <span className="v-kicker">1850–2025 · seitsemän pysyvää näkökulmaa</span>
        <h2>Miten yhteiskunta muuttuu?</h2>
        <p>
          Seuraa samoja seitsemää mekanismia läpi historian. Yksi tapahtuma voi muuttaa useaa
          mekanismia: koulutus liittyy työhön, työ toimeentuloon ja toimeentulo yhteiseen
          luottamukseen.
        </p>
        <div className="mt-reading-key">
          <span>
            <i /> Piste = valittu tapahtuma
          </span>
          <span>│ Vuosiviiva = sama ajankohta kaikilla riveillä</span>
          <span>Väri = mekanismi, ei onnistumisen arvosana</span>
        </div>
      </header>
      <PathPicker routeId={routeId} onRoute={chooseRoute} />
      {route && (
        <PathProgress route={route} eventId={eventId} onStep={chooseStep} onBridge={chooseBridge} />
      )}
      {route && bridge !== null && (
        <BridgeReader route={route} index={bridge} onClose={() => setBridge(null)} />
      )}
      <nav className="mt-chapters" aria-label="Valitse aikakausi">
        {ERAS.map((e, i) => (
          <button
            key={e.from}
            aria-current={era === i ? "step" : undefined}
            onClick={() => chooseEra(i)}
          >
            <small>
              {e.from}–{e.to}
            </small>
            <b>
              {i + 1}. {e.title}
            </b>
            <span className="mt-chapter-line" style={{ opacity: era === i ? 1 : 0.25 }} />
          </button>
        ))}
      </nav>
      <article className="mt-chapter">
        <div>
          <span className="mt-eyebrow">
            Luku {era + 1}/7 · {chapter.from}–{chapter.to}
          </span>
          <h3>{chapter.title}</h3>
          <p>{chapter.lead}</p>
        </div>
        <div className="mt-chapter-lenses">
          <p>
            <b>Mahdollisuus</b>
            {chapter.gain}
          </p>
          <p>
            <b>Ristiriita</b>
            {chapter.tension}
          </p>
          <p>
            <b>Perintö seuraavalle vaiheelle</b>
            {chapter.inheritance}
          </p>
        </div>
        <div className="mt-step">
          <button disabled={era === 0} onClick={() => chooseEra(era - 1)}>
            ← Edellinen aikakausi
          </button>
          <button disabled={era === 6} onClick={() => chooseEra(era + 1)}>
            Seuraava aikakausi →
          </button>
        </div>
      </article>
      <div className="mt-chart-heading">
        <div>
          <h3>Seitsemän polkua, yksi aika-akseli</h3>
          <p>
            Rivien sanat tiivistävät aikakausien teemoja. Pisteen valinta korostaa samaa tapahtumaa
            kaikilla siihen liitetyillä riveillä. Ryhmittely on toimituksellinen tulkinta.
          </p>
        </div>
        <button
          onClick={() => {
            setFocus(null);
            if (scroll.current) scroll.current.scrollLeft = 0;
          }}
        >
          Näytä kaikki polut
        </button>
      </div>
      <div
        className="mt-scroll"
        ref={scroll}
        tabIndex={0}
        role="region"
        aria-label="Vieritettävä kehityspolkujen aikajana 1850–2025"
      >
        <div className="mt-canvas">
          <div className="mt-labels">
            {MECHANISMS.map((m, i) => (
              <button
                key={m.id}
                style={
                  {
                    top: `${((TOP + i * ROW) / H) * 100}%`,
                    height: `${(ROW / H) * 100}%`,
                    "--mt-tone": m.color,
                  } as React.CSSProperties
                }
                aria-pressed={focus === m.id}
                onClick={() => setFocus((f) => (f === m.id ? null : m.id))}
              >
                <span>
                  {m.icon} {m.n}.
                </span>
                <b>{m.short}</b>
                <small>{m.question}</small>
              </button>
            ))}
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            role="group"
            aria-label="Valittavat historialliset tapahtumat seitsemällä mekanismirivillä"
          >
            <defs>
              <pattern
                id={`${uid}-hatch`}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <line x1="0" y1="0" x2="0" y2="6" stroke="#ffffff" strokeOpacity=".07" />
              </pattern>
            </defs>
            {ERAS.map((e, i) => (
              <g key={e.from} className="mt-era-band">
                <rect
                  x={timelineX(e.from)}
                  y={TOP}
                  width={timelineX(e.to) - timelineX(e.from)}
                  height={ROW * 7}
                  fill={era === i ? "#243b4c" : "#152432"}
                  opacity={era === i ? 0.8 : 0.35}
                />
                <line
                  x1={timelineX(e.from)}
                  x2={timelineX(e.from)}
                  y1="65"
                  y2={TOP + ROW * 7}
                  stroke="#a1b6c4"
                  strokeDasharray="3 6"
                  opacity=".35"
                />
                <text x={timelineX(e.from) + 5} y="38">
                  {e.from}
                </text>
                <text x={(timelineX(e.from) + timelineX(e.to)) / 2} y="65" textAnchor="middle">
                  {i + 1}
                </text>
              </g>
            ))}
            <text x={timelineX(2025)} y="38" textAnchor="end" className="mt-end-year">
              2025
            </text>
            <line
              className="mt-selection-line"
              x1={timelineX(selected.year)}
              x2={timelineX(selected.year)}
              y1="75"
              y2={TOP + ROW * 7}
            />
            <text
              className="mt-selection-year"
              x={Math.max(250, Math.min(1395, timelineX(selected.year)))}
              y="100"
              textAnchor="middle"
            >
              {selected.year}
            </text>
            {route && (
              <g
                className="mp-route-lines"
                aria-label="Valitun kysymyksen toimituksellinen lukureitti"
              >
                {route.steps.slice(0, -1).map((step, i) => (
                  <g key={i}>
                    <path
                      d={bridgePath(step, route.steps[i + 1]!)}
                      className={`mp-route-line${bridge === i ? " selected" : ""}`}
                    />
                    <path
                      d={bridgePath(step, route.steps[i + 1]!)}
                      className="mp-route-hit"
                      role="button"
                      tabIndex={0}
                      aria-label={`Avaa reittisilta ${i + 1}: ${route.bridges[i]}`}
                      onClick={() => chooseBridge(i)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          chooseBridge(i);
                        }
                      }}
                    />
                  </g>
                ))}
              </g>
            )}
            {MECHANISMS.map((m, i) => {
              const top = TOP + i * ROW,
                related = selected.mechanisms.includes(m.id);
              return (
                <g
                  key={m.id}
                  className={`mt-track${focus && focus !== m.id ? " dim" : ""}${related ? " related" : ""}`}
                  data-mechanism={m.id}
                >
                  <rect
                    x="230"
                    y={top + 2}
                    width="1190"
                    height={ROW - 5}
                    fill={related ? m.color : "#758699"}
                    opacity={related ? 0.08 : 0.025}
                  />
                  <rect
                    x="230"
                    y={top + 2}
                    width="1190"
                    height={ROW - 5}
                    fill={`url(#${uid}-hatch)`}
                  />
                  <line
                    x1="230"
                    x2="1420"
                    y1={top + ROW - 3}
                    y2={top + ROW - 3}
                    stroke="#667e90"
                    opacity=".25"
                  />
                  {ERAS.map((e, j) => (
                    <text
                      key={e.from}
                      x={(timelineX(e.from) + timelineX(e.to)) / 2}
                      y={top + 27}
                      textAnchor="middle"
                      fill={m.color}
                      className="mt-state"
                      opacity={era === j ? 1 : 0.55}
                    >
                      {m.states[j]}
                    </text>
                  ))}
                  <line
                    x1="230"
                    x2="1420"
                    y1={top + 63}
                    y2={top + 63}
                    stroke={m.color}
                    opacity=".35"
                  />
                  {eventMarkers(m.id).map(({ event, x, lane }) => {
                    const on = event.id === eventId;
                    return (
                      <g
                        key={event.id}
                        role="button"
                        tabIndex={0}
                        data-event={event.id}
                        aria-label={`${event.year}: ${event.title} · ${m.title}`}
                        aria-pressed={on}
                        className={`mt-event${route && !route.steps.some((s) => s.event === event.id) ? " mp-off-route" : ""}${on ? " on" : ""}${event.kind === "context" ? " context" : ""}`}
                        onClick={() => choose(event.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            choose(event.id);
                          }
                        }}
                      >
                        <line
                          x1={x}
                          x2={x}
                          y1={top + 63}
                          y2={top + 48 + lane * 15}
                          stroke={m.color}
                          opacity=".5"
                        />
                        <circle
                          cx={x}
                          cy={top + 48 + lane * 15}
                          r={on ? 10 : 6}
                          fill={on ? m.color : "#132533"}
                          stroke={m.color}
                          strokeWidth={on ? 3 : 2}
                        />
                        {on && <circle cx={x} cy={top + 48 + lane * 15} r="3" fill="#102433" />}
                        <title>
                          {event.year} · {event.title} ·{" "}
                          {event.kind === "context" ? "Historiallinen murros" : "Päätös / uudistus"}
                        </title>
                      </g>
                    );
                  })}
                </g>
              );
            })}
            {route && (
              <g className="mp-route-numbers" aria-hidden="true">
                {route.steps.map((step, i) => {
                  const p = pathPosition(step);
                  return (
                    <g key={step.event}>
                      <circle cx={p.x} cy={p.y + 19} r="8" />
                      <text x={p.x} y={p.y + 22} textAnchor="middle">
                        {i + 1}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>
        </div>
      </div>
      <div className="mt-selection-summary" role="status">
        <span>
          <b>
            {selected.year} · {selected.title}
          </b>
          <small>
            {selected.mechanisms
              .map((id) => MECHANISMS.find((m) => m.id === id)!.short)
              .join(" · ")}
          </small>
        </span>
        <button
          onClick={() =>
            detail.current?.scrollIntoView({
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth",
              block: "start",
            })
          }
        >
          Lue valinnan tarina ↓
        </button>
        {route && bridge !== null && (
          <button
            onClick={() =>
              document
                .getElementById("mp-bridge-reader")
                ?.scrollIntoView({
                  behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                    ? "auto"
                    : "smooth",
                  block: "start",
                })
            }
          >
            Lue sillan perustelu ↑
          </button>
        )}
      </div>
      <div className="mt-events" role="group" aria-label="Aikakauden tapahtumat">
        {events.map((e) => (
          <button key={e.id} aria-pressed={e.id === eventId} onClick={() => choose(e.id)}>
            <small>{e.year}</small>
            {e.title}
          </button>
        ))}
      </div>
      <article ref={detail} className="mt-detail" aria-label="Valitun murroksen tarina">
        <div className="mt-detail-main">
          <span className="mt-eyebrow">
            {selected.kind === "context"
              ? "Historiallinen murros"
              : "Päätös tai uudistuskokonaisuus"}{" "}
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
              Tämä on aikajanan historiallinen taustajakso, ei yksittäinen päätös. Tässä valinnassa
              ei ole erillistä päätöskorttikytkentää.
            </p>
          )}
        </div>
      </article>
      <details className="mt-method">
        <summary>Miksi nämä seitsemän mekanismia?</summary>
        <p>
          Valta ja oikeudet määrittävät toimintaehtoja. Ihmisten kyvykkyydet mahdollistavat
          osallistumisen ja tuotannon. Työ ja tuotanto luovat toimeentuloa. Omistus ja riskinjako
          määrittävät voimavarojen jakautumista. Väestö ja hoiva ylläpitävät jatkuvuutta. Energia ja
          luonto asettavat aineelliset ehdot. Kansainvälinen asema tuo mahdollisuuksia ja
          rajoitteita.
        </p>
        <p>
          Seitsemän riviä ja aikakausien sanalliset tilakuvaukset ovat analyyttinen valinta, eivät
          aineistosta laskettuja järjestelmäpisteitä. Sama tapahtuma voi kuulua useaan mekanismiin.
          Pisteiden koko ilmaisee valintaa, ei vaikutusvoimaa. Katkokehä erottaa historiallisen
          taustamurroksen päätöksestä. Tyhjät kohdat eivät tarkoita, ettei kyseisenä aikana
          tapahtunut muutoksia.
        </p>
        <p>
          Arvioi jokaista vaihetta kolmesta näkökulmasta: mitä toimintakykyä syntyi, miten hyödyt ja
          riskit jakautuivat sekä kestikö ratkaisu aikaa ja häiriöitä. Valikoitu aikajana ei ole
          tyhjentävä historia. Päätöskorteissa on erikseen lähteet ja arvioiden rajat; tulkinta ei
          korvaa vaikutustutkimusta.
        </p>
      </details>
    </section>
  );
}
