import { EducationIncome } from "./EducationIncome";
import { EducationAssessment } from "./EducationAssessment";
import { ThemeCoverage } from "./ThemeCoverage";
import { LongView } from "./LongView";
import { Recovery } from "./Recovery";
import { useState } from "react";
import { MainLinks } from "../MainLinks";
import {
  change,
  data,
  displayValue,
  fmt,
  models,
  names,
  parts,
  point,
  segments,
  signed,
  reading,
  smooth,
} from "./model";
import "./selityspolku.css";
import { FiscalChart, FiscalDetails, fiscalPoint } from "./Fiscal";
const x = (year: number) => 60 + (year - 1850) * 4.8;
const ticks = [1850, 1900, 1950, 1985, 2000, 2025, 2050];
const evidence = [
  {
    title: "Useita toisiinsa kytkeytyviä syitä",
    text: "Rahoitusrajoitteiden väljeneminen oli yksi kriisin taustatekijä. Suomen Pankin historiatarkastelu nostaa rinnalle korkean korkotason, institutionaaliset lähtökohdat ja idänkaupan romahduksen. Näiden erillisiä vaikutuksia ei tunnisteta tässä osittelussa.",
    url: "https://publications.bof.fi/items/87ea7e04-cd5d-467e-a39b-f54de007f2a7",
    label: "Tapio Korhonen / Suomen Pankki, 2011",
  },
  {
    title: "Kotitalouden tulo ei ole sama asia kuin tuotanto",
    text: "Tulonjakotilaston historialliset taulukot erottelevat palkka-, yrittäjä- ja omaisuustulot sekä saadut ja maksetut tulonsiirrot. Vuoden 1993 käsitemuutos on huomioitava vertailuissa. Nykyinen reaalitulomalli ei erittele näitä kanavia eikä osoita sosiaaliturvan erillistä vaikutusta.",
    url: "https://doria.fi/bitstream/handle/10024/155216/xtjt_199900_2001_dig.pdf?isAllowed=y&sequence=1",
    label: "Tilastokeskus / Tulonjakotilasto 1999, asetelma 2",
  },
];
export function Selityspolku() {
  const [year, setYear] = useState(1993),
    [step, setStep] = useState(0);
  const selected = models[Math.min(step, 2)]!;
  const prod = change("production_components", year),
    emp = change("age_structure", year),
    income = change("real_income_components", year);
  const age = point("age_structure", year);
  const interpretation = reading(year);
  const fiscal = fiscalPoint(year);
  const selectedParts = step < 3 ? parts(selected.id, year) : [];
  const sum = selectedParts.reduce((s, p) => s + (p.effect ?? 0), 0);
  return (
    <main className="sp-page">
      <nav aria-label="Näkymät">
        <MainLinks exclude="/selityspolku" />
      </nav>
      <header>
        <p className="sp-eyebrow">SUOMEN KEHITYSSUUNNAT · SELITYSPOLKU</p>
        <h1>Suomen suunnat: mikä kantoi, mikä jäi jälkeen?</h1>
        <p>
          Tutki vuosien 1850–2025 murroksia ja tulevaisuuden avoimia kysymyksiä. Avaa sen jälkeen
          laman ja toipumisen laskettu selityspolku. Koko aikajana säilyy näkyvissä.
        </p>
      </header>
      <section className="sp-ruler" aria-label="Koko aikajana 1850–2050">
        <svg
          viewBox="0 0 1080 62"
          role="img"
          aria-label={`1850–2050. Valittu vuosi ${year}. Korostus 1985–2000. Skenaarioalue 2025–2050.`}
        >
          <rect x={x(1985)} y="2" width={x(2000) - x(1985)} height="32" fill="#e6c992" />
          <rect x={x(2025)} y="2" width={x(2050) - x(2025)} height="32" fill="#e9e5df" />
          <line x1="60" x2="1020" y1="32" y2="32" stroke="currentColor" />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={x(t)} x2={x(t)} y1="28" y2="36" stroke="currentColor" />
              <text x={x(t)} y="54" textAnchor="middle">
                {t}
              </text>
            </g>
          ))}
          <line x1={x(year)} x2={x(year)} y1="0" y2="37" stroke="#b44134" strokeWidth="3" />
        </svg>
        <label htmlFor="sp-year">
          Tarkasteluvuosi <strong>{year}</strong>
        </label>
        <input
          id="sp-year"
          type="range"
          min="1850"
          max="2050"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        />
        <div className="sp-years">
          {[1985, 1990, 1993, 2000, 2025, 2050].map((y) => (
            <button key={y} aria-pressed={year === y} onClick={() => setYear(y)}>
              {y}
            </button>
          ))}
        </div>
      </section>
      <LongView onYear={setYear} />
      <ThemeCoverage onYear={setYear} />
      <EducationAssessment onYear={setYear} />
      <EducationIncome onYear={setYear} />
      <Recovery year={year} onYear={setYear} />
      <section className="sp-summary" aria-live="polite">
        <h2>
          {year}:{" "}
          {year > 2025
            ? "Tulevaisuus tarvitsee näkyvät oletukset"
            : prod === null
              ? "Tämän poiminnan laskentatieto puuttuu"
              : (interpretation?.title ?? "Mitä kokonaisuudessa muuttui?")}
        </h2>
        {prod !== null ? (
          <p>
            Vuoteen 1990 verrattuna tuotanto asukasta kohti {signed(prod)} %, työllisten osuus koko
            väestöstä {emp === null ? "ei laskettavissa" : `${signed(emp)} prosenttiyksikköä`} ja
            reaalitulo asukasta kohti {income === null ? "ei laskettavissa" : `${signed(income)} %`}
            . Eri mittareiden muutoksia ei lasketa yhteen.
          </p>
        ) : (
          <p>
            {year > 2025
              ? "Vuosille 2026–2050 ei ole tässä polussa laskettu skenaariokäyriä. Suuntaa ei jatketa huomaamatta ennusteeksi."
              : "Katkos tarkoittaa puuttuvaa laskentapohjaa, ei nollatasoa tai nollavaikutusta. Historiallinen konteksti ei korvaa havaintoja."}
          </p>
        )}
        {fiscal && (
          <p>
            Julkisyhteisöjen tasapaino on {signed(fiscal.balance_pct!)} % BKT:sta; muutos vuodesta
            1990 {signed(fiscal.change_pp!)} prosenttiyksikköä. Avaa vaihe 4 nähdäksesi tulo- ja
            menoerät. Tämä ei ole kolmen muun mallin yhteenlaskettu seuraus.
          </p>
        )}
        {interpretation && (
          <p>
            <strong>{interpretation.text}</strong>
          </p>
        )}
      </section>
      <div className="sp-charts">
        {models.map((m) => {
          const rows = segments(m.id),
            values = rows.flat().map((p) => p.value),
            lo = m.id === "age_structure" ? 30 : Math.floor(Math.min(...values) / 25) * 25,
            hi = m.id === "age_structure" ? 55 : Math.ceil(Math.max(...values) / 25) * 25;
          const y = (v: number) => 110 - ((v - lo) / (hi - lo)) * 90;
          const v = displayValue(m.id, year);
          const reference =
            m.id === "age_structure"
              ? rows.map((seg) =>
                  smooth(
                    seg.map((p) => ({
                      x: x(p.year),
                      y: y(p.value - (point(m.id, p.year)?.effect ?? 0)),
                    })),
                  ),
                )
              : [];
          return (
            <article
              key={m.id}
              className={`sp-chart ${selected.id === m.id && step < 3 ? "sp-active" : ""}`}
            >
              <button className="sp-chart-title" onClick={() => setStep(models.indexOf(m))}>
                {m.title}
              </button>
              <span>
                {m.id === "age_structure" ? "% koko väestöstä" : "Indeksi, 1990 = 100"} ·{" "}
                {v === null ? "ei havaintoa" : fmt(v)}
              </span>
              <svg
                viewBox="0 0 1080 135"
                role="img"
                aria-label={`${m.short}, koko aikajana 1850–2050. ${m.detail}`}
              >
                <rect x={x(1985)} y="10" width={x(2000) - x(1985)} height="100" fill="#f2e4cb" />
                <rect x={x(2025)} y="10" width="120" height="100" fill="#eeeae3" />
                {[lo, (lo + hi) / 2, hi].map((n) => (
                  <g key={n}>
                    <line x1="60" x2="1020" y1={y(n)} y2={y(n)} stroke="#ddd6c9" />
                    <text x="48" y={y(n) + 4} textAnchor="end">
                      {fmt(n)}
                    </text>
                  </g>
                ))}
                {m.id !== "age_structure" && (
                  <line
                    x1={x(1975)}
                    x2={x(2025)}
                    y1={y(100)}
                    y2={y(100)}
                    stroke="#777"
                    strokeDasharray="4 4"
                  />
                )}
                {reference.map((d, i) => (
                  <path key={`r${i}`} d={d} fill="none" stroke="#9e763f" strokeDasharray="4 4" />
                ))}
                {rows.map((seg, i) => (
                  <path
                    key={i}
                    d={smooth(seg.map((p) => ({ x: x(p.year), y: y(p.value) })))}
                    fill="none"
                    stroke={m.color}
                    strokeWidth="2.5"
                  />
                ))}
                <line x1={x(year)} x2={x(year)} y1="10" y2="113" stroke="#b44134" />
                {v !== null && <circle cx={x(year)} cy={y(v)} r="4" fill={m.color} />}
                <text x="65" y="130">
                  1850
                </text>
                <text x="1020" y="130" textAnchor="end">
                  2050
                </text>
              </svg>
              <p>{m.detail}</p>
            </article>
          );
        })}
      </div>
      <FiscalChart year={year} active={step === 3} onOpen={() => setStep(3)} />
      <section className="sp-explain">
        <h2>Avaa yksi vaihe kerrallaan</h2>
        <div className="sp-steps" role="group" aria-label="Selityspolun vaiheet">
          {[...models.map((m) => m.title), "4. Yhteinen vastuu"].map((s, i) => (
            <button key={s} aria-pressed={step === i} onClick={() => setStep(i)}>
              {s}
            </button>
          ))}
        </div>
        <article aria-live="polite">
          <p className="sp-eyebrow">
            {step === 3
              ? "JULKISEN TALOUDEN KIRJANPIDOLLINEN OSITTELU"
              : "LASKENNALLINEN OSITTELU · EI SYYVAIKUTUS"}
          </p>
          <h3>
            {
              [
                "Mistä tuotannon muutos koostuu?",
                "Selittääkö ikärakenne työllisten osuuden muutoksen?",
                "Miksi reaalitulo kulkee eri tahtia kuin tuotanto?",
                "Mistä julkisen tasapainon muutos koostui?",
              ][step]
            }
          </h3>
          {step === 3 ? (
            <FiscalDetails year={year} />
          ) : step === 1 ? (
            <p>
              {age?.effect != null
                ? `Vuoden ${year} ikärakenne-ero vuoden 1987 kiinteään ikäjakaumaan on ${signed(age.effect)} prosenttiyksikköä. ${year === 1993 ? "Se on pieni suhteessa vuoden 1990 jälkeiseen työllisten osuuden pudotukseen ja vastakkaissuuntainen. Ikärakennemalli ei selitä laman työllisyysromahdusta." : "Ero ei mittaa ikäryhmien syyllisyyttä eikä yksittäisen päätöksen vaikutusta."}`
                : "Ikärakenteen laskentapohja kattaa vain vuodet 1987–2024."}
            </p>
          ) : (
            <>
              <p>
                {step === 0
                  ? "Reaalinen BKT / asukas = tuotos / työtunti × työtunnit / työllinen × työlliset / väestö."
                  : "Reaalitulo / asukas = kotitalouksien nimellinen käytettävissä oleva tulo × hintakorjaus × väestömäärän käänteisluku. Nimellinen tulo sisältää jo tulojen, verojen ja tulonsiirtojen yhteisvaikutuksia."}
              </p>
              {selectedParts.length ? (
                <>
                  <ul className="sp-parts">
                    {selectedParts.map((p) => (
                      <li key={p.factor}>
                        <span>{names[p.factor] ?? p.factor}</span>
                        <strong>{signed(p.effect!)} €/asukas</strong>
                      </li>
                    ))}
                  </ul>
                  <p>
                    Yhteensä {signed(sum)} €/asukas suhteessa vuoteen 1990 (
                    {step === 0 ? "vuoden 2015 hinnoin" : "vuoden 2025 rahassa"}). Shapley-osittelu
                    jakaa myös yhteisvaikutukset osatekijöille. Se ei kuvaa maailmaa, jossa valittu
                    tekijä olisi poistettu.
                  </p>
                </>
              ) : (
                <p>Tälle vuodelle ei ole laskettua osittelua.</p>
              )}
            </>
          )}
          <details>
            <summary>Mitä tästä voi päätellä?</summary>
            <p>
              Työllisyyden, tuotannon ja tulojen välillä on yhteyksiä, mutta eri mallien osuuksia ei
              voi ketjuttaa syyvaikutuksiksi. Tuotantomallin työllisyys on kansantalouden tilinpidon
              kotimaista työllisyyttä ja väestö vuosikeskiarvo. Ikärakennemalli käyttää vuoden lopun
              rekisteritietoja. Yhteinen nimittäjä tai käyrien samanaikainen muutos ei todista
              syytä.
            </p>
          </details>
        </article>
      </section>
      <section className="sp-evidence">
        <h2>Mikä saattoi muuttaa suuntaa?</h2>
        <p>
          Nämä ovat lähteistettyjä selityksiä ja tarkistettavia kanavia. Käyrien laskenta ei anna
          niille erillisiä vaikutusprosentteja.
        </p>
        {evidence.map((e) => (
          <article key={e.title}>
            <h3>{e.title}</h3>
            <p>{e.text}</p>
            <a href={e.url} target="_blank" rel="noreferrer">
              {e.label}
            </a>
          </article>
        ))}
      </section>
      <details className="sp-source">
        <summary>Laskentatapa, lähteet ja puuttuvat tiedot</summary>
        <p>
          Staattinen tietokantapoiminta {data.exported_on}. Julkaisu {data.release_id}. Ikämalli
          1987–2024; talousmallit 1975–2025. Vuosien 2024–2025 tilinpitotiedot voivat tarkentua.
          Vuosia 1850–1974 ei ole täytetty keksityillä arvoilla. Skenaarioalue 2025–2050 näkyy
          erikseen; vuosi 2025 voi sisältää historiallisia havaintoja.
        </p>
        <p>
          Käyrät yhdistävät peräkkäiset vuosihavainnot pehmeästi ilman vuosihavaintojen välisiä
          ylityksiä. Niistä ei voi ajoittaa muutosta vuoden sisälle. Eri kuvaajien pystyakselit ja
          mittayksiköt ovat erilliset.
        </p>
        <p>
          <a href="https://pxdata.stat.fi/PxWeb/api/v1/fi/StatFin/tyokay/115w.px">
            Työssäkäynti 115w
          </a>{" "}
          ·{" "}
          <a href="https://pxdata.stat.fi/PxWeb/fi/StatFin/StatFin__vtp/">
            Kansantalouden tilinpito / 15ai
          </a>{" "}
          · Reaalitulomallin tietokantaan tallennetut nimellistulo- ja elinkustannusindeksisarjat.
        </p>
        <p>
          Jäljitettävyys: syöte {data.input_sha256}; laskentakoodi {data.engine_sha256}. Mallit
          eivät erittele yksittäisten politiikkapäätösten syyvaikutuksia.
        </p>
        <p>
          Väestöryhmien tulonjakovaikutus ja päätösten erilliset syyvaikutukset puuttuvat tästä
          laskentapohjasta. Ryhmävalintaa ei siksi esitetä valmiina vaikutusarviona.
        </p>
      </details>
    </main>
  );
}
