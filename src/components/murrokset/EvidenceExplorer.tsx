import { useId, useState } from "react";
import {
  chartSegments,
  evidence,
  factKind,
  formatValue,
  periodLabel,
  timingLabel,
  type Episode,
  type Metric,
  type Comparison,
} from "./evidence-model";
import "./evidence-explorer.css";

const PHASES = [
  ["pre", "Ennen"],
  ["shock", "Murrosjakso"],
  ["post", "Jälkeen"],
] as const;
const phaseStatus = (s: string) =>
  ({
    complete_window: "Kattava ikkuna",
    partial_window_not_full_mean: "Osittainen ikkuna",
    withheld_method_break: "Määritelmäkatkos · keskiarvo jätetty laskematta",
    no_observations: "Ei havaintoja",
  })[s] ?? s;
function Difference({ label, value }: { label: string; value: Comparison }) {
  return (
    <p>
      <b>{label}: </b>
      {value.status === "descriptive_comparison" ? (
        <>
          {value.baseline_year} → {value.endpoint_year}: {formatValue(value.absolute_change)} sarjan
          yksikköä
          {value.percentage_point_change != null
            ? ` (${formatValue(value.percentage_point_change)} prosenttiyksikköä)`
            : value.relative_percent_change != null
              ? ` (${formatValue(value.relative_percent_change)} %)`
              : ""}
          .
        </>
      ) : value.status === "withheld_method_break" ? (
        "Vertailu jätetty laskematta määritelmäkatkoksen vuoksi."
      ) : (
        "Täsmällinen vertailuvuosi puuttuu; päätepistettä ei siirretty."
      )}
    </p>
  );
}
function MetricView({ metric, episode }: { metric: Metric; episode: Episode }) {
  const points = [...metric.observations].sort((a, b) => a.year - b.year);
  const min = Math.min(...points.map((p) => p.value));
  const max = Math.max(...points.map((p) => p.value));
  const pad = (max - min || Math.abs(max) || 1) * 0.12;
  const x = (v: number) =>
    85 + ((v - episode.pre[0]) / (episode.post[1] - episode.pre[0] || 1)) * 700;
  const y = (v: number) => 205 - ((v - min + pad) / (max - min + 2 * pad)) * 170;
  return (
    <article>
      <h3>{metric.title}</h3>
      <p>
        {metric.group_label} · {metric.unit}
      </p>
      <svg
        viewBox="0 0 860 265"
        role="img"
        aria-label={`${metric.title}: havaintopisteet ${episode.pre[0]}–${episode.post[1]}. Tarkat arvot alla olevassa taulukossa.`}
      >
        <rect
          x={x(episode.shock[0])}
          y="22"
          width={Math.max(5, x(episode.shock[1]) - x(episode.shock[0]))}
          height="193"
          fill="#f4bd4f"
          opacity="0.12"
        />
        {[min, max].map((v, i) => (
          <g key={i}>
            <line x1="85" x2="785" y1={y(v)} y2={y(v)} stroke="currentColor" opacity="0.18" />
            <text x="77" y={y(v) + 4} textAnchor="end">
              {formatValue(v)}
            </text>
          </g>
        ))}
        <path
          d={chartSegments(points, metric.known_break_years, x, y)}
          fill="none"
          stroke="#66d6df"
          strokeWidth="2"
        />
        {points.map((p) => (
          <circle
            key={p.year}
            cx={x(p.year)}
            cy={y(p.value)}
            r="4"
            fill={p.value_kind === "estimate" ? "#f4bd4f" : "#66d6df"}
          >
            <title>
              {p.year}: {formatValue(p.value)} ·{" "}
              {p.value_kind === "estimate" ? "estimaatti" : "havainto"} · {p.validation_status}
            </title>
          </circle>
        ))}
        {[episode.pre[0], episode.shock[0], episode.shock[1], episode.post[1]]
          .filter((v, i, a) => a.indexOf(v) === i)
          .map((year) => (
            <text key={year} x={x(year)} y="240" textAnchor="middle">
              {year}
            </text>
          ))}
      </svg>
      <p className="ev-note">
        Turkoosi: havainto. Keltainen: estimaatti; varjostus: valittu murrosjakso. Viiva katkeaa
        puuttuvan vuoden ja tunnetun määritelmäkatkoksen kohdalla. Pystyakseli mukautuu valittuun
        sarjaan.
      </p>
      <div className="ev-table">
        <table>
          <caption>Ennen–murrosjakso–jälkeen: havaitut vuosiarvot</caption>
          <thead>
            <tr>
              <th>Jakso</th>
              <th>Havaintoja</th>
              <th>Keskiarvo · {metric.unit}</th>
              <th>Kattavuus</th>
            </tr>
          </thead>
          <tbody>
            {PHASES.map(([key, label]) => {
              const p = metric[key];
              return (
                <tr key={key}>
                  <th scope="row">
                    {label} {p.window.join("–")}
                  </th>
                  <td>{p.n}</td>
                  <td>{formatValue(p.mean)}</td>
                  <td>
                    {phaseStatus(p.mean_status)}
                    {p.missing_years.length > 0 && ` · puuttuvat ${p.missing_years.join(", ")}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Difference
        label="Murrosjakson loppu suhteessa lähtövuoteen"
        value={metric.shock_vs_baseline}
      />
      <Difference
        label="Seurannan loppu suhteessa lähtövuoteen"
        value={metric.followup_vs_baseline}
      />
      <details>
        <summary>Havaintoarvot, lähteet ja vertailukelpoisuus</summary>
        <p>{metric.comparability}</p>
        <p>
          Tunnetut katkosvuodet:{" "}
          {metric.known_break_years.join(", ") ||
            "ei kirjattuja; tämä ei takaa täydellistä vertailukelpoisuutta"}
          .
        </p>
        <div className="ev-table">
          <table>
            <caption>Alkuperäinen tarkistusaste säilytetty</caption>
            <thead>
              <tr>
                <th>Vuosi</th>
                <th>Arvo</th>
                <th>Luonne</th>
                <th>Tarkistusaste</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.year}>
                  <th scope="row">{p.year}</th>
                  <td>{formatValue(p.value)}</td>
                  <td>{p.value_kind === "estimate" ? "Estimaatti" : "Havainto"}</td>
                  <td>{p.validation_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul>
          {metric.source_urls.map((url) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noreferrer">
                {url}
              </a>
            </li>
          ))}
        </ul>
        <small>
          Sarjatunnus: {metric.series_key} · ryhmä: {metric.group_key}
        </small>
      </details>
    </article>
  );
}
export function EvidenceExplorer() {
  const uid = useId();
  const [code, setCode] = useState(evidence.episodes[0]!.code);
  const [metricIndex, setMetricIndex] = useState(0);
  const episode = evidence.episodes.find((e) => e.code === code)!;
  const card = evidence.cases.find((c) => c.id === episode.case_id)!;
  const metric = episode.metrics[metricIndex] ?? episode.metrics[0]!;
  const implementations = episode.implementation_ids.map((id) =>
    evidence.implementationRecords.find((r) => r.id === id)!,
  );
  return (
    <section className="ev" aria-label="Murroskohtien näyttö ja päätösten toteutuminen">
      <header>
        <p className="v-kicker">Päätös · toteutus · havaittu kehitys</p>
        <h2>Näyttö ja toteutuminen</h2>
        <p>
          {evidence.counts.episodes} murrosjaksoa · {evidence.counts.comparisons} mittarivertailua ·{" "}
          {evidence.counts.implementationRecords} toimeenpanokokonaisuutta.
        </p>
        <p>
          Vertaa muutosta ennen murrosta ja sen jälkeen. Ajallinen yhteys ei yksin osoita päätöksen
          tai kriisin syyvaikutusta.
        </p>
      </header>
      <div className="ev-controls">
        <label htmlFor={`${uid}-episode`}>
          Murrosjakso
          <select
            id={`${uid}-episode`}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setMetricIndex(0);
            }}
          >
            {evidence.episodes.map((e) => (
              <option key={e.code} value={e.code}>
                {e.title}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${uid}-metric`}>
          Mittari ja väestöryhmä
          <select
            id={`${uid}-metric`}
            value={metricIndex}
            onChange={(e) => setMetricIndex(Number(e.target.value))}
          >
            {episode.metrics.map((m, i) => (
              <option key={`${m.series_key}:${m.group_key}`} value={i}>
                {m.title} · {m.group_label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div aria-live="polite">
        <h3>{episode.title}</h3>
        <p>{episode.selection}</p>
        {episode.followup_right_censored && (
          <p className="ev-alert">
            Seurantaikkuna on vielä kesken. Puuttuva tuleva vuosi ei ole nollahavainto eikä ennuste.
          </p>
        )}
      </div>
      <div className="ev-grid">
        <div className="ev-panel">
          <MetricView metric={metric} episode={episode} />
          {episode.period_evidence.length > 0 && (
            <details>
              <summary>Historialliset jaksohavainnot · ei vuosiarvoja</summary>
              {episode.period_evidence.map((p) => (
                <div key={p.title}>
                  <h4>{p.title}</h4>
                  <p>{p.limitation}</p>
                  <table>
                    <caption>{p.unit} · alkuperäiset jaksot</caption>
                    <thead>
                      <tr>
                        <th>Jakso</th>
                        <th>Arvo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.observations.map((o) => (
                        <tr key={o.period}>
                          <th scope="row">{o.period}</th>
                          <td>{formatValue(o.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </details>
          )}
        </div>
        <aside className="ev-panel">
          <h3>Päätösten ajoitus</h3>
          <p>
            Valikoidut ajankohdat ovat taustatietoa. Kaikki toteutustiedot eivät sijoitu valitun
            seurantaikkunan sisään.
          </p>
          {episode.decision_context.length === 0 ? (
            <p>Jaksolle ei ole kirjattu päätösajankohtia.</p>
          ) : (
            <ol className="ev-events">
              {episode.decision_context.map((e) => (
                <li key={e.event_key}>
                  <b>
                    {e.event_date} · {timingLabel(e.timing_type)}
                  </b>
                  <p>
                    Säädös {e.statute_id}. {e.interpretation}
                  </p>
                  <small>
                    {e.primary_source_pending
                      ? "Alkuperäislähteen varmennus kesken."
                      : e.verification === "stored_event_not_reverified_in_this_batch"
                        ? "Aiemmin tallennettu ajankohta; ei varmennettu uudelleen tässä erässä."
                        : `Tarkistustieto: ${e.verification}`}
                  </small>
                </li>
              ))}
            </ol>
          )}
          <h3>Mitä toteutumisesta tiedetään?</h3>
          {implementations.length === 0 && (
            <p>Tähän jaksoon ei ole liitetty toimeenpanokokonaisuutta.</p>
          )}
          {implementations.map((r) => (
            <details key={r.id} className="ev-record">
              <summary>{r.title}</summary>
              <p>{r.summary}</p>
              <p>
                Säädökset: {r.statute_ids.join(", ")} · tarkistettu {r.checked_on}.
              </p>
              {r.facts.map((f) => (
                <article key={f.id} className="ev-fact">
                  <strong>{factKind(f.fact_kind)}</strong>
                  <p>{periodLabel(f.period)}</p>
                  <p>{f.statement}</p>
                  {f.value != null && (
                    <p>
                      {f.approximate ? "Noin " : ""}
                      {formatValue(f.value)} {f.unit}
                      {f.denominator && ` · nimittäjä: ${f.denominator}`}
                    </p>
                  )}
                  <a href={f.source_url} target="_blank" rel="noreferrer">
                    Lähde
                  </a>
                  <p className="ev-note">
                    {f.validation_status === "source_checked_claim_scope_only"
                      ? "Lähteen väite ja rajaus tarkistettu; ei vahvistettua syyvaikutusta."
                      : f.validation_status}
                  </p>
                </article>
              ))}
              <ul>
                {r.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </details>
          ))}
        </aside>
      </div>
      <details className="ev-panel">
        <summary>Tulkinta, vaihtoehtoiset selitykset ja aineiston rajat</summary>
        <p>{card.summary}</p>
        <h3>Vaihtoehtoiset selitykset</h3>
        <p>{card.alternatives}</p>
        <h3>Vastanäyttö ja arvioinnin rajat</h3>
        <p>{card.counterevidence}</p>
        <p>{card.limits}</p>
        <ul>
          {[...new Set([...episode.limitations, ...episode.missing_dimensions])].map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
        <p>
          Tapauskortin tila: {card.status === "hypothesis" ? "Hypoteesi" : card.status}.
          Mittarivertailun laskentatarkistus ei vahvista tulkintaa syyvaikutukseksi.
        </p>
        <small>
          Tapauskortin tunnus {card.id} · versio {card.revision}.
        </small>
      </details>
      <footer>
        <p>
          Murrosmatriisin aineistoversio{" "}
          {new Date(evidence.source.capturedAt).toLocaleDateString("fi-FI", {
            timeZone: "Europe/Helsinki",
          })}
          . Näkymä toimii tallennetusta aineistosta ilman tietokantayhteyttä.
        </p>
        <details>
          <summary>Aineiston tunnisteet</summary>
          <p>
            {evidence.counts.observations} lähdehavaintoa. Säilytetyt sarja-, ryhmä-, tapaus- ja
            säädöstunnisteet mahdollistavat jäljittämisen.
          </p>
          <code>{evidence.integrity.payloadSha256}</code>
        </details>
      </footer>
    </section>
  );
}
