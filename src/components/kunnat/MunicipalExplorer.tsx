import { useMemo, useState } from "react";
import {
  municipalData as data,
  pairKey,
  passes,
  observations,
  dataCSV,
  correlationsCSV,
  type Municipality,
  type Pair,
} from "./municipal-model";
import "./municipal.css";
const fmt = (n: number, digits = 2) => n.toLocaleString("fi-FI", { maximumFractionDigits: digits });
const prob = (n: number) => (n === 0 ? "≈ 0" : n < 0.001 ? n.toExponential(2) : fmt(n, 4));
function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Scatter({
  rows,
  a,
  b,
  selected,
  onSelect,
}: {
  rows: Municipality[];
  a: number;
  b: number;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const points = observations(rows, a, b),
    xs = points.map((r) => r.values[a]!),
    ys = points.map((r) => r.values[b]!);
  if (!points.length) return <p>Ei yhteisiä havaintoja.</p>;
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const x = (v: number) => 65 + ((v - minX) / (maxX - minX || 1)) * 510,
    y = (v: number) => 260 - ((v - minY) / (maxY - minY || 1)) * 220;
  return (
    <svg
      className="km-scatter"
      viewBox="0 0 640 315"
      role="img"
      aria-label={`Kuntahavainnot: ${data.indicators[a]!.label} ja ${data.indicators[b]!.label}`}
    >
      <line x1="65" x2="580" y1="260" y2="260" />
      <line x1="65" x2="65" y1="35" y2="260" />
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <text x={65 + t * 510} y="280" textAnchor="middle">
            {fmt(minX + t * (maxX - minX))}
          </text>
          <text x="59" y={264 - t * 220} textAnchor="end">
            {fmt(minY + t * (maxY - minY))}
          </text>
        </g>
      ))}
      {points.map((row) => (
        <circle
          key={row.id}
          cx={x(row.values[a]!)}
          cy={y(row.values[b]!)}
          r={selected === row.id ? 6 : 3.5}
          className={selected === row.id ? "selected" : ""}
          onClick={() => onSelect(row.id)}
        >
          <title>
            {row.name}: {fmt(row.values[a]!)} / {fmt(row.values[b]!)}
          </title>
        </circle>
      ))}
      <text x="320" y="308" textAnchor="middle">
        X: {data.indicators[a]!.unit} · Y: {data.indicators[b]!.unit}
      </text>
    </svg>
  );
}
export function MunicipalExplorer() {
  const [year, setYear] = useState(2023),
    [method, setMethod] = useState("spearman"),
    [adjusted, setAdjusted] = useState(false),
    [mixed, setMixed] = useState(false);
  const [minimum, setMinimum] = useState(0.4),
    [q, setQ] = useState(0.05),
    [correction, setCorrection] = useState<"qBY" | "qBH">("qBY"),
    [structural, setStructural] = useState(false);
  const [selected, setSelected] = useState<[number, number]>([9, 19]),
    [municipality, setMunicipality] = useState<string | null>(null),
    [search, setSearch] = useState("");
  const snapshot = data.snapshots.find((s) => s.year === year)!;
  const family = snapshot.families.find(
    (f) => f.method === method && f.adjusted === adjusted && f.mixed === mixed,
  )!;
  const map = useMemo(() => new Map(family.pairs.map((p) => [pairKey(p.a, p.b), p])), [family]);
  const indices = useMemo(
    () =>
      Array.from({ length: mixed ? 25 : 24 }, (_, i) => i).filter(
        (i) => !adjusted || ![0, 1, 3].includes(i),
      ),
    [mixed, adjusted],
  );
  const a = indices.includes(selected[0]) ? selected[0] : indices[0]!,
    b =
      indices.includes(selected[1]) && selected[1] !== a
        ? selected[1]
        : indices.find((i) => i !== a)!;
  const pair = map.get(pairKey(a, b));
  const ia = data.indicators[a]!,
    ib = data.indicators[b]!;
  const candidates = family.pairs
    .filter((p) => passes(p, minimum, q, correction, structural))
    .sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
  const eligible = observations(snapshot.rows, a, b, adjusted);
  const selectedRow = snapshot.rows.find((r) => r.id === municipality);
  const source = (id: string) => data.sources.find((s) => s.id === id)!;
  const pick = (p: Pair) => {
    setSelected([p.a, p.b]);
    setMunicipality(null);
  };
  return (
    <section className="km" aria-label="Kuntien indikaattorien yhteydet">
      <header>
        <span className="v-kicker">Empiirinen kerros · Tilastokeskus</span>
        <h2>Kuntien yhteydet</h2>
        <p>
          Mitkä ilmiöt esiintyvät samoissa kunnissa? Tutki 24 vuosittaista indikaattoria ja
          erillistä vaalimuuttujaa. Jokainen kunta saa saman painon. Yhteys ei osoita
          vaikutussuuntaa tai syy-seuraussuhdetta.
        </p>
      </header>
      <div className="km-notice">
        <b>Seulonta, ei kausaalinen näyttö.</b> p- ja q-arvot olettavat toisistaan riippumattomia
        havaintoja; kuntien alueellista riippuvuutta ei ole korjattu. Kunnat ovat kokonaisjoukko,
        eivät satunnaisotos. Raja-arvot auttavat löytämään tutkittavia yhteyksiä.
      </div>
      <div className="km-controls">
        <label>
          Vertailuvuosi
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {data.snapshots.map((s) => (
              <option key={s.year}>{s.year}</option>
            ))}
          </select>
        </label>
        <label>
          Korrelaatio
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="spearman">Spearman · järjestysluvut</option>
            <option value="pearson">Pearson · lineaarinen</option>
          </select>
        </label>
        <label>
          Monen testin korjaus
          <select
            value={correction}
            onChange={(e) => setCorrection(e.target.value as "qBY" | "qBH")}
          >
            <option value="qBY">BY · sallii testien riippuvuuden</option>
            <option value="qBH">BH · tiukemmat riippuvuusoletukset</option>
          </select>
        </label>
        <label>
          Yhteyden vähimmäisvoimakkuus |r|
          <select value={minimum} onChange={(e) => setMinimum(Number(e.target.value))}>
            {[0, 0.2, 0.4, 0.6, 0.8].map((v) => (
              <option key={v} value={v}>
                {fmt(v)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Seulontaraja q
          <select value={q} onChange={(e) => setQ(Number(e.target.value))}>
            {[0.01, 0.05, 0.1, 1].map((v) => (
              <option key={v} value={v}>
                {fmt(v)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="km-options">
        <label>
          <input
            type="checkbox"
            checked={adjusted}
            onChange={(e) => setAdjusted(e.target.checked)}
          />{" "}
          Vakioi kuntakoko, ikärakenne ja taajama-aste
        </label>
        <label>
          <input type="checkbox" checked={mixed} onChange={(e) => setMixed(e.target.checked)} />{" "}
          Lisää kuntavaalit 2025 (eri havaintovuosi; Ahvenanmaa puuttuu)
        </label>
        <label>
          <input
            type="checkbox"
            checked={structural}
            onChange={(e) => setStructural(e.target.checked)}
          />{" "}
          Sisällytä määritelmällisesti sidoksissa olevat parit seulontaan
        </label>
      </div>
      {adjusted && (
        <p className="km-note">
          Vakiointi: log(väkiluku), yli 64-vuotiaiden osuus ja taajama-aste. Kontrollimuuttujat
          poistuvat matriisista. Spearmanissa myös kontrollit muunnetaan järjestysluvuiksi.
          Vakiointi ei poista kaikkia sekoittavia tekijöitä.
        </p>
      )}
      <p role="status">
        {snapshot.rows.length} kuntaa · {indices.length} muuttujaa · {family.tests} testattavaa
        paria · {candidates.length} paria seulaan. Puuttuvat arvot jätetään pois parikohtaisesti.
      </p>
      {snapshot.coverage.some((n, i) => i < 24 && n === 0) && (
        <p className="km-notice">
          Vuodelta {year} ei ole havaintoja:{" "}
          {data.indicators
            .filter((_, i) => i < 24 && snapshot.coverage[i] === 0)
            .map((i) => i.label)
            .join(", ")}
          . Näille pareille ei lasketa korrelaatioita. Vuosi 2023 tarjoaa kattavamman vertailun.
        </p>
      )}
      <div className="km-grid">
        <div>
          <h3>Yhteyksien matriisi</h3>
          <p className="km-note">
            Turkoosi = positiivinen, violetti = negatiivinen. Himmeä solu ei läpäise nykyistä
            seulaa. Myös himmeän solun voi avata. Numerot vastaavat alla olevaa muuttujaluetteloa.
          </p>
          <div
            className="km-matrix-scroll"
            tabIndex={0}
            role="region"
            aria-label="Vieritettävä korrelaatiomatriisi"
          >
            <table className="km-matrix">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  {indices.map((i) => (
                    <th key={i} scope="col" title={data.indicators[i]!.label}>
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {indices.map((i) => (
                  <tr key={i}>
                    <th scope="row" title={data.indicators[i]!.label}>
                      {i + 1}
                    </th>
                    {indices.map((j) => {
                      const p = map.get(pairKey(i, j));
                      return (
                        <td key={j}>
                          {i === j ? (
                            <span className="km-diagonal">—</span>
                          ) : p ? (
                            <button
                              style={{
                                background: p.r >= 0 ? "#176c67" : "#654590",
                                opacity: passes(p, minimum, q, correction, structural) ? 1 : 0.28,
                              }}
                              className={pairKey(i, j) === pairKey(a, b) ? "on" : ""}
                              aria-pressed={pairKey(i, j) === pairKey(a, b)}
                              aria-label={`${data.indicators[i]!.label} ja ${data.indicators[j]!.label}: ${fmt(p.r)}`}
                              onClick={() => {
                                setSelected([i, j]);
                                setMunicipality(null);
                              }}
                            >
                              {fmt(p.r, 1)}
                            </button>
                          ) : (
                            <span title="Ei riittävästi havaintoja tai vaihtelua">·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details>
            <summary>Muuttujat ja kattavuus</summary>
            <ol className="km-indicators">
              {data.indicators.map((ind, i) => (
                <li key={ind.id}>
                  <b>{ind.label}</b> · {ind.unit} · {ind.group} · {snapshot.coverage[i]}/
                  {snapshot.rows.length} kuntaa · vuosi {ind.fixedYear ?? year}
                  {ind.formula && (
                    <small>
                      Laskettu: {ind.formula}. {ind.note}
                    </small>
                  )}
                </li>
              ))}
            </ol>
          </details>
          <h3>Voimakkaimmat seulaan osuvat yhteydet</h3>
          {!candidates.length && (
            <p>Ei osumia. Muuta rajoja tai tarkastele matriisin yksittäisiä pareja.</p>
          )}
          <div className="km-candidates">
            {candidates.slice(0, 12).map((p) => (
              <button key={pairKey(p.a, p.b)} onClick={() => pick(p)}>
                <span>
                  {data.indicators[p.a]!.label} ↔ {data.indicators[p.b]!.label}
                </span>
                <b>
                  {p.r > 0 ? "+" : ""}
                  {fmt(p.r)}
                </b>
              </button>
            ))}
          </div>
        </div>
        <article id="km-pair" className="km-detail" aria-label="Valitun muuttujaparin tiedot">
          <h3>Tarkista yhteys</h3>
          <label>
            X-muuttuja
            <select value={a} onChange={(e) => setSelected([Number(e.target.value), b])}>
              {indices
                .filter((i) => i !== b)
                .map((i) => (
                  <option key={i} value={i}>
                    {i + 1}. {data.indicators[i]!.label}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Y-muuttuja
            <select value={b} onChange={(e) => setSelected([a, Number(e.target.value)])}>
              {indices
                .filter((i) => i !== a)
                .map((i) => (
                  <option key={i} value={i}>
                    {i + 1}. {data.indicators[i]!.label}
                  </option>
                ))}
            </select>
          </label>
          <p>
            <b>X:</b> {ia.label} ({ia.unit}; {ia.fixedYear ?? year})<br />
            <b>Y:</b> {ib.label} ({ib.unit}; {ib.fixedYear ?? year})
          </p>
          {pair ? (
            <>
              <div className="km-metrics">
                <span>
                  {adjusted ? "Vakioitu r" : "r"} <b>{fmt(pair.r, 3)}</b>
                </span>
                <span>
                  n <b>{pair.n}</b>
                </span>
                <span>
                  p <b>{prob(pair.p)}</b>
                </span>
                <span>
                  q ({correction === "qBY" ? "BY" : "BH"}) <b>{prob(pair[correction])}</b>
                </span>
              </div>
              {pair.structural && <p className="km-notice">{pair.structural}</p>}
              <p>
                {passes(pair, minimum, q, correction, structural)
                  ? "Läpäisee nykyisen seulan."
                  : "Ei läpäise nykyistä seulaa."}{" "}
                Tämä ei ole näyttö kausaalisuudesta.
              </p>
            </>
          ) : (
            <p>Parille ei voitu laskea korrelaatiota: liian vähän havaintoja tai vaihtelua.</p>
          )}
          <h4>Alkuperäiset kuntahavainnot</h4>
          {adjusted && (
            <p className="km-note">
              Hajontakuvio näyttää alkuperäiset arvot, ei vakioinnin residuaaleja. Yllä oleva
              kerroin on vakioitu.
            </p>
          )}
          <Scatter rows={eligible} a={a} b={b} selected={municipality} onSelect={setMunicipality} />
          <label>
            Tarkastele kuntaa
            <select
              value={municipality ?? ""}
              onChange={(e) => setMunicipality(e.target.value || null)}
            >
              <option value="">Valitse kunta</option>
              {eligible.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
          {selectedRow && (
            <p>
              <b>{selectedRow.name}</b>: X{" "}
              {selectedRow.values[a] == null ? "puuttuu" : fmt(selectedRow.values[a]!)} · Y{" "}
              {selectedRow.values[b] == null ? "puuttuu" : fmt(selectedRow.values[b]!)}
            </p>
          )}
          <label>
            Hae kuntahavaintoja
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kunnan nimi"
            />
          </label>
          <div className="km-observations">
            <table>
              <thead>
                <tr>
                  <th>Kunta</th>
                  <th>X</th>
                  <th>Y</th>
                </tr>
              </thead>
              <tbody>
                {eligible
                  .filter((r) =>
                    r.name.toLocaleLowerCase("fi").includes(search.toLocaleLowerCase("fi")),
                  )
                  .map((row) => (
                    <tr key={row.id}>
                      <th scope="row">
                        <button onClick={() => setMunicipality(row.id)}>{row.name}</button>
                      </th>
                      <td>{fmt(row.values[a]!)}</td>
                      <td>{fmt(row.values[b]!)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="km-note">
            Puuttuvia tai vakioinnin vuoksi pois jääviä kuntia:{" "}
            {snapshot.rows.length - eligible.length}. Arvoja ei täydennetä nolliksi.
          </p>
          <p>
            <a href={source(ia.source).url} target="_blank" rel="noreferrer">
              X:n lähdetaulukko
            </a>{" "}
            ·{" "}
            <a href={source(ib.source).url} target="_blank" rel="noreferrer">
              Y:n lähdetaulukko
            </a>
          </p>
          <details>
            <summary>Valitun parin alkuperäiset määrittelyt</summary>
            {[ia, ib].map((ind) => (
              <p key={ind.id}>
                <b>{ind.sourceLabel}</b>
                <br />
                Koodi {ind.code}. {ind.formula ? `Johdettu: ${ind.formula}.` : "Suora lähdearvo."}{" "}
                {ind.note}
              </p>
            ))}
          </details>
        </article>
      </div>
      <details className="km-method">
        <summary>Aineisto, laskenta ja tulkinnan rajat</summary>
        <p>{data.method}</p>
        <p>
          {data.geography} Samat tunnukset eivät takaa osakuntaliitosten täydellistä
          vertailukelpoisuutta; lähteiden aluejakovuodet säilytetään metatiedoissa. Valitut kaksi
          lähivuotta vähentävät pitkien aikasarjojen luokitusongelmia.
        </p>
        <p>
          Toimialaosuudet, sisäkkäiset koulutusosuudet ja osa työmarkkina- sekä asumismittareista
          ovat määritelmällisesti sidoksissa. Niiden tunnistetut parit merkitään ja jätetään
          oletuksena seulasta pois. Merkintä ei kata kaikkia mahdollisia yhteisiä nimittäjiä.
          Negatiivinen korrelaatio ei tarkoita huonoa eikä positiivinen hyvää.
        </p>
        <p>
          p-arvojen t-approksimaatio on Spearmanille ja vakioiduille järjestyskorrelaatioille
          likimääräinen. Monen testin korjaus ei korjaa havaintojen alueellista riippuvuutta. Vuosia
          ei yhdistetä yhdeksi havaintojoukoksi. Vaalimuuttujan lisääminen muodostaa oman
          testiperheensä.
        </p>
        <p>
          Poimittu {data.retrieved}. Alkuperäiset API-kyselyt ja vastaukset sekä toistettava
          laskenta ovat repositorin scripts/data/municipal-sources-kansiossa.
        </p>
        <ul>
          {data.sources.map((s) => (
            <li key={s.id}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>{" "}
              · päivitetty {s.updated?.slice(0, 10) ?? "ei ilmoitettu"}
            </li>
          ))}
        </ul>
      </details>
      <div className="km-downloads">
        <button onClick={() => download(`kuntahavainnot-${year}.csv`, dataCSV(snapshot))}>
          Lataa kuntahavainnot CSV
        </button>
        <button
          onClick={() =>
            download(
              `kuntakorrelaatiot-${year}-${method}${adjusted ? "-vakioitu" : ""}.csv`,
              correlationsCSV(snapshot, family),
            )
          }
        >
          Lataa kaikki tämän testiperheen korrelaatiot CSV
        </button>
      </div>
    </section>
  );
}
