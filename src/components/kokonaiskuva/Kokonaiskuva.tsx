import { useId, useState } from "react";
import { MainLinks } from "../MainLinks";
import { ErotusTulot } from "../erotus-tulot/ErotusTulot";
import { eras, eraAt, MIN, MAX } from "./model";
import {
  ageData,
  allocated,
  assess,
  FIRST,
  LAST,
  futures,
  futureProfiles,
  historic,
  profile,
  views,
} from "./age-effect";
import "./kokonaiskuva.css";
const X = (year: number) => 60 + ((year - MIN) / (MAX - MIN)) * 1040;
const Y = (value: number) => 360 - ((value - 30) / 25) * 310;
type Plot = { year: number; actual: number; reference: number };
function curve(rows: Plot[], key: "actual" | "reference", reverse = false) {
  const points = reverse ? [...rows].reverse() : rows;
  return points
    .map((p, i) => {
      if (!i) return `M ${X(p.year)} ${Y(p[key])}`;
      const prev = points[i - 1]!,
        mid = (X(prev.year) + X(p.year)) / 2;
      return `C ${mid} ${Y(prev[key])} ${mid} ${Y(p[key])} ${X(p.year)} ${Y(p[key])}`;
    })
    .join(" ");
}
function area(rows: Plot[]) {
  if (rows.length < 2) return "";
  return `${curve(rows, "actual")} L ${X(rows.at(-1)!.year)} ${Y(rows.at(-1)!.reference)} ${curve(rows, "reference", true).replace(/^M [\d.e+-]+ [\d.e+-]+ /, "")} Z`;
}
const fmt = (n: number) => n.toLocaleString("fi-FI", { maximumFractionDigits: 1 });
const pp = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n))}`;
export function Kokonaiskuva() {
  const [baseYear, setBase] = useState(FIRST),
    [year, setYear] = useState(LAST),
    [viewId, setView] = useState("all");
  const [futureId, setFuture] = useState("fixed"),
    [open, setOpen] = useState(false),
    [drilldown, setDrilldown] = useState(false);
  const uid = useId().replaceAll(":", "");
  const actualRows = historic(FIRST);
  const rows = historic(baseYear),
    base = profile(baseYear),
    projected = futureProfiles(futureId).map((p) => assess(p, base));
  const selected =
    year > LAST ? projected.find((p) => p.year === year) : rows.find((p) => p.year === year);
  const sourceRow = year <= LAST ? ageData.rows.find((r) => r.year === year) : null;
  const baseRate = assess(base, base).actual;
  const era = eraAt(year),
    view = views.find((v) => v.id === viewId)!;
  const selectedPart = selected ? allocated(selected.parts, viewId) : null;
  const groupEffects = selected
    ? views.slice(1).map((v) => ({ ...v, value: allocated(selected.parts, v.id) }))
    : [];
  const maxPart = Math.max(0.1, ...groupEffects.map((v) => Math.abs(v.value)));
  const forecast = futures.find((f) => f.id === futureId)!;
  return (
    <main className="kk-page kk-impact">
      <nav aria-label="Näkymät">
        <MainLinks exclude="/kokonaiskuva" />
      </nav>
      <header className="ki-head">
        <span>EROTUS · KOKONAISKUVA 1850–2050</span>
        <h1>Mitä ikärakenne tekee työllisten osuudelle?</h1>
        <p>
          Valkoinen käyrä näyttää kokonaisuuden. Kultainen näyttää saman vuoden työllisyyden
          vertailuvuoden ikäjakaumalla.{" "}
          <b>Varjostettu väli on ikärakenteen muutoksen laskennallinen vaikutus.</b>
        </p>
      </header>
      <section className="ki-overview" aria-label="Koko aikajana 1850–2050">
        <div className="ki-toolbar">
          <div className="ki-legend">
            <span>━ Työllisten osuus koko väestöstä</span>
            <span>━ Vertailu: vuoden {baseYear} ikäjakauma</span>
          </div>
          <button
            aria-expanded={open}
            aria-controls={`${uid}-controls`}
            onClick={() => setOpen(!open)}
          >
            Näkökulma ja vertailuvuosi ☰
          </button>
        </div>
        <p className="ki-axis">
          % koko väestöstä · ei 15–64-vuotiaiden virallinen työllisyysaste · pystyakseli rajattu
          30–55 prosenttiin
        </p>
        <svg
          viewBox="0 0 1160 440"
          role="img"
          aria-labelledby={`${uid}-title`}
          aria-describedby={`${uid}-desc`}
          onClick={(e) => {
            const box = e.currentTarget.getBoundingClientRect();
            setYear(
              Math.round(
                Math.max(
                  MIN,
                  Math.min(
                    MAX,
                    MIN + ((((e.clientX - box.left) / box.width) * 1160 - 60) / 1040) * (MAX - MIN),
                  ),
                ),
              ),
            );
          }}
        >
          <title id={`${uid}-title`}>
            Toteutunut kokonaisuus ja vertailukäyrä samalla aikajanalla 1850–2050
          </title>
          <desc id={`${uid}-desc`}>
            Laskettu historia {baseYear}–{LAST}. Ennen vuotta {baseYear} vaikutusaluetta ei ole
            laskettu. Vuodet {LAST + 1}–2050 ovat skenaario. Varjostettu erotus näyttää koko
            ikärakenteen laskennallisen vaikutuksen. Ryhmävalinta avaa sen osan vaihtamatta
            kokonaiskäyriä.
          </desc>
          <defs>
            <pattern id={`${uid}-hatch`} width="7" height="7" patternUnits="userSpaceOnUse">
              <path d="M0 7L7 0" stroke="#eeb776" strokeWidth="1.3" opacity=".7" />
            </pattern>
            <linearGradient id={`${uid}-fade`} x1="0" x2="0" y1="0" y2="1">
              <stop stopColor="#eeb776" stopOpacity=".18" />
              <stop offset="1" stopColor="#eeb776" stopOpacity=".03" />
            </linearGradient>
          </defs>
          <rect
            x={X(LAST)}
            y="34"
            width={X(MAX) - X(LAST)}
            height="326"
            fill="#eeb776"
            opacity=".055"
          />
          {[30, 35, 40, 45, 50, 55].map((v) => (
            <g key={v}>
              <path d={`M60 ${Y(v)} H1100`} stroke="#ffffff15" />
              <text x="45" y={Y(v) + 5} textAnchor="end">
                {v}
              </text>
            </g>
          ))}
          {[1850, 1900, 1950, 1987, 2025, 2050].map((v) => (
            <g key={v}>
              <path d={`M${X(v)} 34 V365`} stroke="#ffffff12" />
              <text x={X(v)} y="395" textAnchor="middle">
                {v}
              </text>
            </g>
          ))}
          <path d={area(rows)} fill={`url(#${uid}-fade)`} />
          <path d={area(rows)} fill={`url(#${uid}-hatch)`} />
          <path d={area(projected)} fill={`url(#${uid}-hatch)`} opacity=".3" />
          <path d={curve(rows, "reference")} className="ki-reference" />
          <path d={curve(actualRows, "actual")} className="ki-actual" />
          <path d={curve(projected, "reference")} className="ki-reference ki-projection" />
          <path d={curve(projected, "actual")} className="ki-actual ki-projection" />
          {actualRows.map((p) => (
            <circle key={p.year} cx={X(p.year)} cy={Y(p.actual)} r="1.6" fill="#f5f1e8">
              <title>
                {p.year}: {fmt(p.actual)} %
              </title>
            </circle>
          ))}
          <text x={X((MIN + baseYear) / 2)} y="190" textAnchor="middle" className="ki-gap-title">
            Historiallinen tausta 1850–{baseYear - 1}
          </text>
          <text x={X((MIN + baseYear) / 2)} y="218" textAnchor="middle">
            Tälle jaksolle ei vielä laskettua vaikutusaluetta
          </text>
          <text x={X(2037)} y="24" textAnchor="middle">
            SKENAARIO
          </text>
          <path d={`M${X(year)} 34 V365`} stroke="#80c9c5" strokeDasharray="3 4" />
          {selected && (
            <g>
              <path
                d={`M${X(year)} ${Y(selected.actual)} V${Y(selected.reference)}`}
                stroke="#eeb776"
                strokeWidth="5"
              />
              <circle cx={X(year)} cy={Y(selected.actual)} r="5" fill="#f5f1e8" />
              <circle cx={X(year)} cy={Y(selected.reference)} r="5" fill="#eeb776" />
            </g>
          )}
          <text x={X(year)} y="430" textAnchor="middle" fill="#80c9c5">
            {year}
          </text>
        </svg>
        <div className="ki-cursor">
          <label htmlFor={`${uid}-year`}>
            Tarkasteluvuosi <b>{year}</b>
          </label>
          <input
            id={`${uid}-year`}
            aria-label="Tarkasteluvuosi 1850–2050"
            type="range"
            min={MIN}
            max={MAX}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
        </div>
        <div className="ki-eras" aria-label="Historialliset vaiheet">
          {eras.map((e) => (
            <button
              key={e.start}
              aria-pressed={era === e}
              onClick={() => setYear(e.start === 2025 ? 2035 : Math.floor((e.start + e.end) / 2))}
            >
              {e.label}
            </button>
          ))}
        </div>
        <p className="ki-note">
          Koko aikajana säilyy. Yhtenäiset käyrät: lähdehavaintoihin perustuva laskelma.
          Katkoviivat: näkyvistä oletuksista laskettu tulevaisuus. Varjostus ei ole epävarmuusväli.
        </p>
      </section>
      <section id={`${uid}-controls`} className="ki-controls" hidden={!open}>
        <label>
          Vertailuvuosi
          <select value={baseYear} onChange={(e) => setBase(Number(e.target.value))}>
            {[1987, 1995, 2000, 2010].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Minkä ryhmän osuutta tutkit?
          <select value={viewId} onChange={(e) => setView(e.target.value)}>
            {views.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <p>Ryhmävalinta avaa vaikutuksen osiin. Pääkuva säilyttää koko väestön molemmat käyrät.</p>
      </section>
      <div className="ki-content">
        <article aria-live="polite">
          <span className="ki-kicker">
            {year} ·{" "}
            {year > LAST
              ? "LASKUESIMERKKI"
              : selected
                ? "LÄHDEAINEISTOSTA LASKETTU"
                : "HISTORIALLINEN KONTEKSTI"}
          </span>
          {selected ? (
            <>
              <h2>
                Ikärakenteen muutos{" "}
                {selected.effect < 0
                  ? "painaa osuutta alaspäin"
                  : selected.effect > 0
                    ? "nostaa osuutta"
                    : "ei muuta osuutta"}
                .
              </h2>
              <div className="ki-result">
                <strong>
                  {pp(selected.effect)} <small>prosenttiyksikköä</small>
                </strong>
                <p>
                  {year > LAST ? "Skenaarion" : "Havaittu"} osuus <b>{fmt(selected.actual)} %</b> ·
                  vertailu <b>{fmt(selected.reference)} %</b>
                </p>
              </div>
              <p className="ki-lead">
                Vuoden {baseYear} ikäjakaumalla ja vuoden {year} ikäryhmittäisillä työllisten
                osuuksilla kokonaisosuus olisi laskennallisesti {fmt(selected.reference)} %.{" "}
                {Math.abs(selected.effect) < 0.00001
                  ? "Vertailuvuonna käyrät kohtaavat."
                  : `Erotus ${fmt(Math.abs(selected.effect))} prosenttiyksikköä syntyy ikäosuuksien muuttumisesta, ei siitä, että vertailussa olisi poistettu jokin ihmisryhmä.`}
              </p>
              <section className="ki-meaning">
                <h3>Mitä se merkitsee kokonaisuudelle?</h3>
                <p>
                  Kun työllisten osuus koko väestöstä pienenee, työssä olevia on vähemmän suhteessa
                  koko väestöön. Tämä on yksi tuotannon ja yhteisten tehtävien rahoituksen
                  edellytyksistä. Työtunnit, tuottavuus, palkat ja verotus voivat kuitenkin muuttaa
                  seurauksia olennaisesti.
                </p>
                <p>
                  Vertailu erottaa ikärakenteen siitä, miten hyvin eri-ikäiset työllistyvät. Se ei
                  yksin selitä julkista velkaa, palvelujen tarvetta tai ihmisten hyvinvointia.
                </p>
              </section>
              <section className="ki-reconcile">
                <h3>Mistä koko muutos vuodesta {baseYear} syntyy?</h3>
                <div>
                  <p>
                    <span>Ikärakenne</span>
                    <b>{pp(selected.effect)} pp</b>
                  </p>
                  <p>
                    <span>Työllistyminen ikäryhmissä</span>
                    <b>{pp(selected.reference - baseRate)} pp</b>
                  </p>
                  <p>
                    <span>Kokonaismuutos</span>
                    <b>{pp(selected.actual - baseRate)} pp</b>
                  </p>
                </div>
                <p className="ki-note">
                  Kaksi ensimmäistä osaa summautuvat kokonaismuutokseen. Jako käyttää samaa
                  ilmoitettua vakiointijärjestystä kuin vertailukäyrä.
                </p>
              </section>
              <h3>Mistä varjostettu erotus muodostuu?</h3>
              <p>
                Ryhmien osuudet summautuvat koko vaikutukseen ennen lukujen pyöristämistä. Valinta
                näyttää ryhmän ikäosuuden muutoksen osuuden tässä hajotelmassa.
              </p>
              <div className="ki-parts">
                {groupEffects.map((g) => (
                  <button
                    key={g.id}
                    aria-pressed={viewId === g.id}
                    onClick={() => setView(viewId === g.id ? "all" : g.id)}
                  >
                    <span>{g.label}</span>
                    <span className="ki-part-track">
                      <i
                        style={{
                          width: `${(Math.abs(g.value) / maxPart) * 48}%`,
                          left:
                            g.value >= 0 ? "50%" : `${50 - (Math.abs(g.value) / maxPart) * 48}%`,
                          background: g.value < 0 ? "#eeb776" : "#80c9c5",
                        }}
                      />
                    </span>
                    <b>{pp(g.value)} pp</b>
                  </button>
                ))}
              </div>
              {viewId !== "all" && (
                <section className="ki-selected">
                  <h3>
                    {view.label}: {pp(selectedPart!)} prosenttiyksikköä
                  </h3>
                  <p>
                    Osuus kuvaa ryhmän väestöosuuden muutosta suhteessa vertailuvuoteen ja ryhmän
                    työllisten osuutta suhteessa vertailutasoon. Se ei ole ryhmän aiheuttama vahinko
                    tai hyöty. Muu osa kokonaiserosta on {pp(selected.effect - selectedPart!)}{" "}
                    prosenttiyksikköä.
                  </p>
                </section>
              )}
            </>
          ) : (
            <>
              <h2>{era.title}</h2>
              <p className="ki-lead">{era.whole}</p>
              <p>
                Yhtenäistä ikäryhmittäistä laskenta-aineistoa on tässä poiminnassa vuodesta {FIRST}.{" "}
                {year < FIRST
                  ? "Aikaisemmille vuosille ei esitetä keksittyä vertailukäyrää."
                  : `Valittu vertailuvuosi ${baseYear} on tarkasteluvuoden jälkeen. Valitse aiempi vertailuvuosi.`}
              </p>
              <p>{era.counter}</p>
            </>
          )}
          <details>
            <summary>Miksi tämä erotus kestää tarkastelua?</summary>
            <p>
              Kunkin vuoden työllisten osuus = Σ ikäryhmän väestöosuus × ryhmän työllisten osuus.
              Vertailukäyrässä väestöosuudet ovat vuodelta {baseYear} mutta työllisten osuudet
              tarkasteluvuodelta. Erotus on tämän vakioinnin kirjanpidollinen rakennevaikutus, ei
              tunnistettu kausaalinen vaikutus.
            </p>
            <p>
              Vertailu ei laske uudelleen palkkoja, työpaikkojen määrää, muuttoliikettä, veroja tai
              käyttäytymistä toisessa ikärakenteessa. Ikärakenteen ja työllistymisen muutosten
              vuorovaikutus kohdistuu tässä järjestyksessä rakenneosaan. Vertailuvuoden vaihtaminen
              näyttää herkkyyden valitulle lähtötilanteelle.
            </p>
            <p>
              Ryhmän osuus = (nykyinen väestöosuus − vertailuvuoden väestöosuus) × (nykyinen ryhmän
              työllisten osuus − koko vertailukäyrän työllisten osuus). Summataan lähteen ikäluokat
              valittuihin ryhmiin. Keskitys tekee osista yhteenlaskettavia, koska väestöosuuksien
              muutosten summa on nolla. Tämä on ilmoitettu jakotapa; ryhmäkohtainen jako ei ole
              yksikäsitteinen kausaalinen vastuunjako.
            </p>
            <p>
              Molempien käyrien yksikkö on prosenttia koko väestöstä, kaikki iät. Mittari eroaa
              virallisesta työikäisen väestön työllisyysasteesta ja huomioi myös lapset sekä
              eläkeikäiset nimittäjässä. Samaa henkilöä ei seurata ikäryhmässä ajan yli.
            </p>
            <p>
              Lähteen kaikki 13 ikäluokkaa ovat mukana. Väestö ja työlliset on tarkistettu joka
              vuodelta lähteen koko maan yhteensä-lukuja vasten. Käyrien kaaret ovat esitysmuoto
              lähdevuosien välillä. Hallinnollisen tilaston kattavuus tai menetelmät voivat muuttua;
              pelkkä aineiston sisäinen täsmääminen ei poista tätä rajoitetta.
            </p>
          </details>
          <details>
            <summary>Avaa vuosiluvut ja alkuperäislähde</summary>
            <p>
              <a href={ageData.source.url} target="_blank" rel="noreferrer">
                {ageData.source.title} ↗
              </a>{" "}
              · {ageData.source.scope} · {ageData.source.unit}. Päivitetty {ageData.source.updated},
              poimittu {ageData.source.retrieved}.
            </p>
            <div className="ki-table">
              <table>
                <caption>
                  Käyrien laskenta {baseYear}–{LAST}; prosenttia koko väestöstä, erotus
                  prosenttiyksikköä
                </caption>
                <thead>
                  <tr>
                    <th>Vuosi</th>
                    <th>Lähteen työlliset</th>
                    <th>Lähteen väestö</th>
                    <th>Havaittu %</th>
                    <th>Vertailu %</th>
                    <th>Erotus pp</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => {
                    const r = ageData.rows.find((r) => r.year === p.year)!;
                    return (
                      <tr key={p.year}>
                        <th scope="row">{p.year}</th>
                        <td>{r.totalEmployed.toLocaleString("fi-FI")}</td>
                        <td>{r.totalPopulation.toLocaleString("fi-FI")}</td>
                        <td>{fmt(p.actual)}</td>
                        <td>{fmt(p.reference)}</td>
                        <td>{pp(p.effect)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {sourceRow && (
              <p>
                Valittu vuosi {year}: {sourceRow.totalEmployed.toLocaleString("fi-FI")} työllistä /{" "}
                {sourceRow.totalPopulation.toLocaleString("fi-FI")} asukasta.
              </p>
            )}
            {sourceRow && selected && (
              <details>
                <summary>Ikäluokkien lähtöarvot vuodelta {year}</summary>
                <div className="ki-table">
                  <table>
                    <caption>Kaikki lähteen ikäluokat; vertailuvuosi {baseYear}</caption>
                    <thead>
                      <tr>
                        <th>Ikä</th>
                        <th>Väestö</th>
                        <th>Työlliset</th>
                        <th>Ikäosuus {baseYear} %</th>
                        <th>Ikäosuus {year} %</th>
                        <th>Ryhmän työllisten osuus %</th>
                        <th>Osuus erotuksesta pp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ageData.groups.map((g, i) => (
                        <tr key={g.id}>
                          <th scope="row">{g.label}</th>
                          <td>{sourceRow.population[i]!.toLocaleString("fi-FI")}</td>
                          <td>{sourceRow.employed[i]!.toLocaleString("fi-FI")}</td>
                          <td>{fmt(base.weights[i]! * 100)}</td>
                          <td>
                            {fmt((sourceRow.population[i]! / sourceRow.totalPopulation) * 100)}
                          </td>
                          <td>{fmt((sourceRow.employed[i]! / sourceRow.population[i]!) * 100)}</td>
                          <td>{pp(selected.parts[i]!)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p>
                  Ikäosuudet on laskettu koko väestöstä; ryhmän työllisten osuus oman ikäryhmän
                  väestöstä. Esitysluvut pyöristetään, laskenta käyttää täysiä lähdelukuja.
                </p>
              </details>
            )}
            <p>
              Lähdevastauksen SHA-256: <code>{ageData.source.sha256}</code>. Päivitysskripti ja
              lähdekysely tallennetaan samaan julkaisuun.
            </p>
          </details>
          <details>
            <summary>Historiallinen yhteys: {era.label}</summary>
            <h3>{era.title}</h3>
            <p>{era.whole}</p>
            <ol>
              {era.chain.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <p>{era.counter}</p>
            <p>{era.limit} Historiallinen kuvaus ei korvaa puuttuvaa vaikutuslaskelmaa.</p>
          </details>
        </article>
        <aside>
          <span className="ki-kicker">2025–2050</span>
          <h2>Mihin suunta voi jatkua?</h2>
          <p>Valitse yksi näkyvä oletus. Koko aikajana ja historiallinen laskelma säilyvät.</p>
          {futures.map((f) => (
            <button
              key={f.id}
              aria-pressed={futureId === f.id}
              onClick={() => {
                setFuture(f.id);
                setYear(2050);
              }}
            >
              {f.label}
            </button>
          ))}
          <p>{forecast.description}</p>
          <p className="ki-note">
            Jatkettaessa ikäosuudet rajataan vähintään nollaan ja normalisoidaan summautumaan
            yhteen. Laskuesimerkki ei huomioi syntyvyyden, kuolleisuuden tai muuttoliikkeen
            erillisiä oletuksia eikä ole Tilastokeskuksen väestöennuste.
          </p>
          <hr />
          <h3>Mitä seuraavaksi voi laskea?</h3>
          <p>
            Työllistymisen, työtuntien ja tuottavuuden muutokset vaativat kukin oman hajotelmansa.
            Niitä ei muuteta painokertoimilla tämän käyrän vaikutuksiksi.
          </p>
          <button onClick={() => setDrilldown(!drilldown)} aria-expanded={drilldown}>
            Avaa toimeentulon yksityiskohta ↓
          </button>
        </aside>
      </div>
      <details
        className="ki-drilldown"
        open={drilldown}
        onToggle={(e) => setDrilldown(e.currentTarget.open)}
      >
        <summary>Erillinen esimerkkikotitalouden tulohajotelma</summary>
        <p>
          Syventävä esimerkki ei ole pääkuvan ikärakennevaikutuksen rahamääräinen vastine. Koko
          aikajana säilyy yläpuolella.
        </p>
        {drilldown && <ErotusTulot embedded />}
      </details>
    </main>
  );
}
