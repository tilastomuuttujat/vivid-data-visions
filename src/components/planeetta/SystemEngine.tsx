import { revealAnalysis } from "./reveal-analysis";
import { useState } from "react";

type Block = {
  id: string;
  n: string;
  title: string;
  input: string;
  tension: string;
  lag: string;
  theme: string; // ThemeGroup id, johon evidenssi sijoittuu
  anchor?: string; // tarkempi ankkuri ryhmän sisällä
};

const BLOCKS: Block[] = [
  {
    id: "paamaa",
    n: "01",
    title: "Pääoma & omistus",
    input:
      "Metsä- ja metalliteollisuus, suuryritysten kasvu ja valtion omistuspolitiikka loivat kansallisen arvonmuodostuksen ytimen.",
    tension:
      "Omistus keskittyy ja arvo karkaa ulkomaille — kotimainen tuotantopohja ei enää sidosta hyvinvointia koko maahan.",
    lag: "1990-luvun omistusjärjestelyt näkyvät 2010-luvulla teollisuuden kaventumisena ja työpaikkojen menetyksinä.",
    theme: "teema-teollisuus",
    anchor: "timeline-productivity",
  },
  {
    id: "tyo",
    n: "02",
    title: "Työ & osaaminen",
    input:
      "Teollinen arvo muuntui työpaikoiksi ja koulutusjärjestelmä tuotti osaamista massamittakaavassa.",
    tension:
      "Työn tuottavuuden äärimmäinen optimointi jättää osan väestöstä ja alueista ulos — käyttämätön potentiaali kasaantuu.",
    lag: "1970-luvun rakennepolitiikan voitto kääntyy 2000-luvulla syrjäytymisen ja osaamispulan kustannukseksi.",
    theme: "teema-tyo",
    anchor: "timeline-work-opportunity",
  },
  {
    id: "asuminen",
    n: "03",
    title: "Asuminen & varallisuus",
    input:
      "Työmarkkinoiden tulot ja luottolaajennus ohjautuivat asuntovarallisuuteen kasvukeskuksiin.",
    tension:
      "Asuntohintojen eriytyminen jakaa varallisuuden ja sitoo perheet paikkoihin, joissa työtä ei enää ole.",
    lag: "1980-luvun rahoitusmarkkinoiden vapautus näkyy 2020-luvulla asumiskustannusten ja alueellisen eriytymisen lukkona.",
    theme: "teema-tyo",
    anchor: "timeline-housing",
  },
  {
    id: "hoiva",
    n: "04",
    title: "Hoiva, perheet & talous",
    input:
      "Universaali hyvinvointivaltio ja perhepolitiikka mahdollistivat korkean syntyvyyden ja naisten työnteon.",
    tension:
      "Syntyvyys sakkaa ja hoivatarve kasvaa samalla kun veropohja kapeenee — hoivapommi rakentuu hiljaa.",
    lag: "1990-luvun leikkauspöydän valinnat palautuvat 2020-luvulla hoivakriisinä ja kuntien velkataakkana.",
    theme: "teema-tyo",
    anchor: "timeline-care",
  },
  {
    id: "lait",
    n: "05",
    title: "Lait & päätöksenteko",
    input:
      "Verotulot ja budjettivalta rahoittivat rakenteet, ja lainsäädäntö sementoi kulloisenkin mallin paikalleen.",
    tension:
      "Eilisen voittajaratkaisu kirjoitetaan laiksi — ja muuttuu toimeenpanolukoksi, kun maailma on jo ehtinyt muuttua.",
    lag: "Jokaisen aikakauden suuri ratkaisu palaa 20–30 vuoden viiveellä seuraavan aikakauden ongelmana.",
    theme: "teema-aikajana",
    anchor: "timeline-historical",
  },
];

const W = 720,
  H = 460,
  CX = W / 2,
  CY = H / 2,
  R = 158;

function pos(i: number) {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / BLOCKS.length;
  return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
}

/** Systeemin kytkentämoottori: viiden lohkon kehä, klikkaus sytyttää virrat ja viiveet. */
export function SystemEngine() {
  const [sel, setSel] = useState(0);
  const b = BLOCKS[sel]!;

  const goToEvidence = () => {
    revealAnalysis(b.theme, b.anchor);
  };

  return (
    <section className="engine" aria-label="Systeemin kytkentämoottori">
      <div className="engine-grid">
        <div className="engine-diagram">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Suomi-koneen viiden lohkon kehä">
            <defs>
              <marker
                id="eng-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0 0L10 5L0 10z" fill="currentColor" />
              </marker>
            </defs>
            {BLOCKS.map((_, i) => {
              const a = pos(i),
                c = pos((i + 1) % BLOCKS.length);
              const mx = (a.x + c.x) / 2,
                my = (a.y + c.y) / 2;
              const qx = mx + (mx - CX) * 0.34,
                qy = my + (my - CY) * 0.34;
              const active = i === sel;
              return (
                <path
                  key={i}
                  d={`M${a.x} ${a.y} Q${qx} ${qy} ${c.x} ${c.y}`}
                  className={`engine-arc${active ? " is-active" : ""}`}
                  markerEnd="url(#eng-arrow)"
                />
              );
            })}
            <text x={CX} y={CY - 8} textAnchor="middle" className="engine-core-t">
              Suomi-kone
            </text>
            <text x={CX} y={CY + 14} textAnchor="middle" className="engine-core-s">
              viiden lohkon kehä · 1860–2050
            </text>
            {BLOCKS.map((blk, i) => {
              const p = pos(i),
                active = i === sel;
              return (
                <g
                  key={blk.id}
                  className={`engine-node${active ? " is-active" : ""}`}
                  onClick={() => setSel(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSel(i)}
                  aria-label={blk.title}
                >
                  <circle cx={p.x} cy={p.y} r={active ? 46 : 40} />
                  <text x={p.x} y={p.y - 4} textAnchor="middle" className="engine-node-n">
                    {blk.n}
                  </text>
                  <text x={p.x} y={p.y + 14} textAnchor="middle" className="engine-node-t">
                    {blk.title.split(" & ").map((w, j) => (
                      <tspan key={j} x={p.x} dy={j ? 13 : 0}>
                        {w}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="engine-panel" key={b.id}>
          <p className="v-kicker">
            {b.n} · {b.title}
          </p>
          <dl>
            <div>
              <dt>Syöte — mistä arvo virtaa</dt>
              <dd>{b.input}</dd>
            </div>
            <div>
              <dt>Jännite — missä kone yskiää</dt>
              <dd>{b.tension}</dd>
            </div>
            <div>
              <dt>Viive — mihin lasku siirtyy</dt>
              <dd>{b.lag}</dd>
            </div>
          </dl>
          <button className="engine-evidence" onClick={goToEvidence}>
            Näytä evidenssi laboratoriossa ↓
          </button>
        </div>
      </div>
    </section>
  );
}
