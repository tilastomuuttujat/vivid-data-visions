import { useState } from "react";
import { ErotusTulot } from "../erotus-tulot/ErotusTulot";
import { MainLinks } from "../MainLinks";
import { evidence } from "../murrokset/evidence-model";
import {
  BASE,
  MIN,
  MAX,
  FUTURE,
  eras,
  eraAt,
  lenses,
  national,
  periodChange,
  project,
  scenarios,
  segments,
} from "./model";
import type { Point } from "./model";
import "./kokonaiskuva.css";
const x = (year: number) => 65 + ((year - MIN) / (MAX - MIN)) * 1000;
const y = (value: number) => 325 - value * 0.7;
const pct = (n: number) =>
  `${n > 0 ? "+" : ""}${n.toLocaleString("fi-FI", { maximumFractionDigits: 1 })} %`;
function path(points: Point[]) {
  return points
    .map((p, i) => {
      if (!i) return `M${x(p.year)},${y(p.value)}`;
      const prev = points[i - 1]!,
        mid = (x(prev.year) + x(p.year)) / 2;
      return `C${mid},${y(prev.value)} ${mid},${y(p.value)} ${x(p.year)},${y(p.value)}`;
    })
    .join(" ");
}
export function Kokonaiskuva() {
  const [year, setYear] = useState(2024);
  const [lensId, setLens] = useState("all");
  const [scenarioId, setScenario] = useState("shared");
  const [controls, setControls] = useState(false);
  const [drilldown, setDrilldown] = useState(false);
  const era = eraAt(year),
    lens = lenses.find((l) => l.id === lensId)!,
    scenario = scenarios.find((s) => s.id === scenarioId)!;
  const episodes = evidence.episodes.filter((e) => era.episodes.includes(e.code));
  const start = era.start >= 1995 ? 2007 : Math.max(BASE, era.start),
    end = Math.min(FUTURE, era.end);
  const changes = national.map((s) => periodChange(s.points, start, end));
  const projected = national.map((s, i) => project(s.points.at(-1)!, scenario.growth[i]!));
  const factor = projected[1]!.at(-1)!.value / national[1]!.points.at(-1)!.value - 1;
  return (
    <main className="kk-page">
      <nav aria-label="Näkymät">
        <MainLinks exclude="/kokonaiskuva" />
      </nav>
      <header className="kk-head">
        <span>SUOMEN KEHITYSKAARI · 1850–2050</span>
        <h1>Miten kasvu kantaa yhteiskuntaa?</h1>
        <p>
          Tuotanto luo mahdollisuuksia. Työ, tulonjako ja yhteiset palvelut ratkaisevat, miten ne
          välittyvät ihmisten elämään.
        </p>
      </header>
      <section className="kk-overview" aria-label="Koko aikajana 1850–2050">
        <div className="kk-chart-top">
          <div className="kk-legend">
            {national.map((s) => (
              <span key={s.key} style={{ color: s.color }}>
                ━ {s.label}
              </span>
            ))}
          </div>
          <button
            onClick={() => setControls(!controls)}
            aria-expanded={controls}
            aria-controls="kk-controls"
          >
            {controls ? "Sulje näkökulmat" : "Valitse näkökulma"} ☰
          </button>
        </div>
        <p className="kk-axis-note">
          Reaalinen kehitys · {BASE} = 100 · molemmat asukasta kohti · ei hyvinvointi-indeksi
        </p>
        <svg
          viewBox="0 0 1130 395"
          role="img"
          aria-labelledby="kk-title"
          aria-describedby="kk-desc"
          onClick={(e) => {
            const box = e.currentTarget.getBoundingClientRect();
            const px = ((e.clientX - box.left) / box.width) * 1130;
            setYear(
              Math.round(Math.max(MIN, Math.min(MAX, MIN + ((px - 65) / 1000) * (MAX - MIN)))),
            );
          }}
        >
          <title id="kk-title">Suomen tuotanto ja kotitalouksien reaalitulo 1850–2050</title>
          <desc id="kk-desc">
            Yhteinen aikajana pysyy aina vuosissa 1850–2050. Tuotantohavaintoja vuodesta 1861,
            kotitalouksien reaalitulohavaintoja vuodesta 1975; puuttuvia vuosia ei yhdistetä.
            Historiallinen aineisto päättyy vuoteen 2025. Sen jälkeen katkoviivat ovat valitun
            skenaarion laskuesimerkkejä.
          </desc>
          <rect
            x={x(FUTURE)}
            y="20"
            width={x(MAX) - x(FUTURE)}
            height="305"
            fill="#eab875"
            opacity=".07"
          />
          <rect
            x={x(era.start)}
            y="20"
            width={Math.max(2, x(era.end) - x(era.start))}
            height="305"
            fill="#fff"
            opacity=".035"
          />
          {[0, 100, 200, 300, 400].map((v) => (
            <g key={v}>
              <path d={`M65 ${y(v)} H1065`} stroke="#ffffff15" />
              <text x="50" y={y(v) + 5} textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          {[1850, 1900, 1950, 2000, 2025, 2050].map((v) => (
            <g key={v}>
              <path d={`M${x(v)} 20 V330`} stroke="#ffffff15" />
              <text x={x(v)} y="354" textAnchor="middle">
                {v}
              </text>
            </g>
          ))}
          {national.map((s, i) => (
            <g key={s.key}>
              {segments(s.points).map((seg, j) => (
                <g key={j}>
                  <path d={path(seg)} stroke={s.color} className="kk-line" />
                  {seg.map((p) => (
                    <circle key={p.year} cx={x(p.year)} cy={y(p.value)} r="2" fill={s.color}>
                      <title>
                        {p.year}: {p.value.toFixed(1)} ({BASE}=100)
                      </title>
                    </circle>
                  ))}
                </g>
              ))}
              <path
                d={path(projected[i]!)}
                stroke={s.color}
                className="kk-line"
                strokeDasharray="6 6"
              />
            </g>
          ))}
          <path d={`M${x(year)} 20 V330`} stroke="#83c8c6" strokeWidth="1.5" />
          <text x={x(year)} y="385" textAnchor="middle" className="kk-cursor">
            {year}
          </text>
          <text x={x(1889)} y="308" textAnchor="middle">
            aineistoaukko
          </text>
          <text x={x(1949)} y="308" textAnchor="middle">
            aineistoaukko
          </text>
          <text x={x(2037)} y="35" textAnchor="middle">
            LASKUESIMERKKI
          </text>
        </svg>
        <div className="kk-time">
          <label htmlFor="kk-year">
            Tarkasteluvuosi <b>{year}</b>
          </label>
          <input
            id="kk-year"
            aria-label="Tarkasteluvuosi 1850–2050"
            type="range"
            min={MIN}
            max={MAX}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
        <div className="kk-eras" aria-label="Kehitysvaiheet">
          {eras.map((e) => (
            <button
              key={e.start}
              aria-pressed={e === era}
              onClick={() =>
                setYear(e.start === FUTURE ? FUTURE : Math.floor((e.start + e.end) / 2))
              }
            >
              {e.label}
            </button>
          ))}
        </div>
        <p className="kk-small">
          Yhtenäinen viiva: lähteen vuosihavainnot ja niiden välinen kaari. Katkos: aineisto
          puuttuu. Katkoviiva: oletettu tulevaisuus. Vuoden 2025 lähdeluvut voivat tarkentua.
        </p>
      </section>
      <section
        id="kk-controls"
        className="kk-controls"
        hidden={!controls}
        aria-label="Näkökulman valinta"
      >
        <h2>Mistä asemasta katsot kokonaisuutta?</h2>
        <div>
          {lenses.map((l) => (
            <button key={l.id} aria-pressed={lensId === l.id} onClick={() => setLens(l.id)}>
              {l.label}
            </button>
          ))}
        </div>
        <p>
          Näkökulma vaihtaa kysymykset ja vaikutuksen välittymisen. Se ei muuta kansallisia käyriä
          ryhmäkohtaisiksi mittauksiksi.
        </p>
      </section>
      <div className="kk-content">
        <article className="kk-story" aria-live="polite">
          <span className="kk-kicker">
            {era.label} · {lens.label}
          </span>
          <h2>{era.title}</h2>
          <p className="kk-lead">{era.whole}</p>
          <section className="kk-reading">
            <h3>Mitä kokonaiskäyrät kertovat?</h3>
            {year >= FUTURE ? (
              <>
                <p>
                  {scenario.text} Vuoteen 2050 mennessä kotitalouksien reaalitulo asukasta kohti
                  muuttuu tällä oletuksella <b>{pct(factor * 100)}</b>.
                </p>
                <p>
                  Kasvuprosentti kertautuu 25 vuotta. Se näyttää oletuksen kokonaisseuraamuksen
                  reaalitulolle, ei tietyn päätöksen vaikutusta.
                </p>
              </>
            ) : changes.every((c) => c !== null) && end > start ? (
              <>
                <p>
                  Vuosina {start}–{end} tuotanto asukasta kohti muuttui <b>{pct(changes[0]!)}</b> ja
                  kotitalouksien reaalitulo asukasta kohti <b>{pct(changes[1]!)}</b>.
                </p>
                <p>
                  {changes[1]! > changes[0]!
                    ? "Kotitalouksien tulokehitys on tässä vertailussa tuotantoa vahvempaa. Kasvun hidastuminen ei siis siirry tuloihin yksi yhteen."
                    : "Tuotannon kasvu ja kotitalouksien tulokehitys eroavat tässä vertailussa. Ero ohjaa kysymään, mitkä kanavat välittivät tai vaimensivat muutosta."}{" "}
                  Indeksieroa ei voi tulkita menetetyiksi euroiksi.
                </p>
              </>
            ) : (
              <p>
                Tämän vaiheen molempia käyriä kattavaa vertailua ei aineistosta voi tehdä.
                Historiallinen selityspolku antaa kontekstin; puuttuvaa tulokäyrää ei korvata
                arviolla.
              </p>
            )}
          </section>
          <h3 className="kk-question">{lens.question}</h3>
          <p>{lens.exposure}</p>
          <p className="kk-small">Selityspolku · mekanismitulkinta, ei laskettu nettovaikutus.</p>
          <ol className="kk-chain" aria-label="Vaikutuksen välittyminen kokonaisuuteen">
            {era.chain.map((step, i) => (
              <li key={step}>
                <span>
                  {String(i + 1).padStart(2, "0")} · {lens.channels[i]}
                </span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
          <section className="kk-return">
            <h3>Miten vaikutus palaa kokonaisuuteen?</h3>
            <p>
              {era.chain[3]}. Tämä paluuyhteys on syy tarkastella tuotannon rinnalla toimeentuloa ja
              osallistumista.
            </p>
            <p>
              <b>Vastavoima:</b> {era.counter}
            </p>
          </section>
          <details className="kk-method">
            <summary>Mihin tulkinta perustuu ja mitä se ei vielä osoita?</summary>
            <p>{era.limit}</p>
            <p>
              Selityspolku on toimituksellinen mekanismitulkinta. Alla oleva tapausaineisto ankkuroi
              ajanjaksoa; se ei sellaisenaan todista jokaista nuolta tai väestöryhmän
              nettovaikutusta. Vaikutusten suuruutta, viivettä ja vastakkaisia vaikutuksia ei ole
              yhdistetty kausaaliseksi kokonaismalliksi.
            </p>
            <p>
              Kotitalouksien käytettävissä oleva nettotulo sisältää tulonsiirtojen ja verotuksen
              vaikutusta; julkiset luontoismuotoiset palvelut eivät sisälly siihen kattavasti. BKT
              on tuotannon bruttomitta, joten käyrien erotus ei ole kansantalouden tilinpidon
              jakautumislaskelma. Reaalisarjat käyttävät eri hintakäsitteitä.
            </p>
            <p>
              Mahdollisia vaihtoehtoisia selityksiä ovat kansainvälinen suhdanne, väestörakenne,
              omaisuustulot, tulonsiirrot, verotus ja hintakehitys. Niiden keskinäiset osuudet eivät
              ratkea näistä kahdesta käyrästä.
            </p>
            <p>
              Vaiherajat ovat lukemista ohjaavia toimituksellisia valintoja. Käyrät eivät määrää
              niitä tilastollisesti. Kotitalousryhmän nykyistä rakennetta ei projisoida samanlaisena
              koko historiaan.
            </p>
          </details>
          <details className="kk-evidence">
            <summary>Avaa ajanjakson aineisto ja lähteet ({episodes.length} tapausta)</summary>
            {episodes.length ? (
              episodes.map((e) => (
                <section key={e.code}>
                  <h3>{e.title}</h3>
                  <p>{e.selection}</p>
                  <p>{e.limitations.join(" ")}</p>
                  <ul>
                    {e.metrics.map((m) => (
                      <li key={`${m.series_key}-${m.group_key}`}>
                        <b>{m.title}</b> · {m.unit} · {m.observations.length} havaintoa.{" "}
                        {m.source_urls.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noreferrer">
                            Lähde ↗{" "}
                          </a>
                        ))}
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            ) : (
              <p>
                Tulevaisuuden laskuesimerkillä ei ole toteumahavaintoja. Oletukset näkyvät
                skenaariovalinnassa.
              </p>
            )}
          </details>
          <details>
            <summary>Kansallisten käyrien tarkat luvut ja määritelmät</summary>
            <p>
              Sama vertailuvuosi {BASE} = 100. Indeksointi näyttää suhteellisen muutoksen; se ei tee
              eri käsitteistä samoja. Käyrien lähdepoiminta: {evidence.source.capturedAt}.
            </p>
            {national.map((s) => (
              <section key={s.key}>
                <h3>{s.label}</h3>
                <p>
                  {s.source.title} · {s.source.unit}.{" "}
                  <a href={s.source.source_url} target="_blank" rel="noreferrer">
                    Alkuperäislähde ↗
                  </a>
                </p>
                <div className="kk-table">
                  <table>
                    <caption>{s.label}: lähteessä olevat vuodet</caption>
                    <thead>
                      <tr>
                        <th>Vuosi</th>
                        <th>Indeksi {BASE}=100</th>
                        <th>Lähteen arvo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.points.map((p) => (
                        <tr key={p.year}>
                          <th scope="row">{p.year}</th>
                          <td>{p.value.toLocaleString("fi-FI", { maximumFractionDigits: 2 })}</td>
                          <td>
                            {s.rawPoints
                              .find((r) => r.year === p.year)!
                              .value.toLocaleString("fi-FI", { maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </details>
        </article>
        <aside className="kk-aside">
          <span className="kk-kicker">2025 → 2050</span>
          <h2>Mitä jos kasvu välittyy eri tavoin?</h2>
          <p>Kaikki vaihtoehdot näkyvät samalla täydellä aikajanalla. Valitse yksi oletuspari.</p>
          {scenarios.map((s) => (
            <button
              key={s.id}
              aria-pressed={s.id === scenarioId}
              onClick={() => {
                setScenario(s.id);
                setYear(FUTURE);
              }}
            >
              {s.label}
            </button>
          ))}
          <p>{scenario.text}</p>
          <p className="kk-small">
            Oletukset on valittu havainnollistamiseen. Ne eivät ole lähteestä saatu ennuste eivätkä
            suositeltujen toimien vaikuttavuusarvio. Kumpikaan käyrä ei kuvaa julkisen talouden
            tasapainoa.
          </p>
          <hr />
          <h3>Kun tarvitset yksityiskohdan</h3>
          <p>
            Kokonaiskuvasta voi jatkaa kotitalouden tuloihin. Koko aikajana säilyy näkyvissä myös
            yksityiskohtaa avatessa.
          </p>
          <button onClick={() => setDrilldown(true)}>Avaa tulojen hajotelma alempana ↓</button>
          <p className="kk-small">
            Erillinen esimerkkikotitalouksien laskelma; ei yllä olevien kansallisten käyrien
            ryhmäkohtainen jako.
          </p>
        </aside>
      </div>
      <details
        className="kk-drilldown"
        open={drilldown}
        onToggle={(e) => setDrilldown(e.currentTarget.open)}
      >
        <summary>Yksityiskohta: esimerkkikotitalouden tulot</summary>
        <p>
          Seuraava laskelma syventää yhtä toimeentulon kanavaa. Se ei hajota kansallista käyrää
          väestöryhmiin. Täysi aikajana säilyy yläpuolella.
        </p>
        {drilldown && <ErotusTulot embedded />}
      </details>
    </main>
  );
}
