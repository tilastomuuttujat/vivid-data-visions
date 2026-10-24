import data from "../planeetta/household-example-data.json";
import { useId, useState } from "react";
import { MainLinks } from "../MainLinks";
import { contribution, curve, decompose, factors, series, vintages } from "./model";
import type { Factor } from "./model";
import "./tulot.css";
const euro = (n: number) => new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 0 }).format(n);
const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${euro(Math.abs(n))}`;
export function ErotusTulot({ embedded = false }: { embedded?: boolean } = {}) {
  const Container = embedded ? "section" : "main";
  const [vintageId, setVintage] = useState("2025");
  const [profileId, setProfile] = useState("single-parent");
  const [factor, setFactor] = useState<Factor>("transfers");
  const [baseYear, setBase] = useState(2023);
  const id = useId().replaceAll(":", "");
  const vintage = vintages.find((v) => v.id === vintageId)!;
  const profile = vintage.profiles.find((p) => p.id === profileId)!;
  const years = profile.points.filter((p) => p.year >= 2022).map((p) => p.year);
  const base = profile.points.find((p) => p.year === baseYear)!;
  const rows = series(profile.points, baseYear, factor);
  const last = rows.at(-1)!;
  const parts = decompose(base, last);
  const selected = factors.find((f) => f.id === factor)!;
  const values = rows.flatMap((p) => [p.net, p.comparison]);
  const lo = Math.min(...values),
    hi = Math.max(...values),
    pad = Math.max(30, (hi - lo) * 0.2);
  const x = (year: number) => 85 + ((year - baseYear) / (last.year - baseYear)) * 820;
  const y = (value: number) => 330 - ((value - lo + pad) / (hi - lo + 2 * pad)) * 270;
  const actual = rows.map((p) => ({ x: x(p.year), y: y(p.net) }));
  const comparison = rows.map((p) => ({ x: x(p.year), y: y(p.comparison) }));
  const area = `${curve(actual)} L ${comparison.at(-1)!.x} ${comparison.at(-1)!.y} ${curve([...comparison].reverse()).replace(/^M [\d.e+-]+ [\d.e+-]+ /, "")} Z`;
  const biggest = [...parts]
    .filter((p) => p.id !== "rounding")
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0]!;
  return (
    <Container className="et-page">
      {!embedded && (
        <nav aria-label="Näkymät">
          <MainLinks exclude="/erotus-tulot" />
        </nav>
      )}
      <header>
        <span className="et-kicker">EROTUS / TULOJEN RAKENNE</span>
        <h1>Mistä muutos syntyy?</h1>
        <p>Yksi kotitalous. Yksi kokonaisuus. Näkyvä ero euroina.</p>
      </header>
      <div className="et-layout">
        <aside aria-label="Tarkastelun rajaus">
          <label>
            Kenen näkökulma?
            <select value={profileId} onChange={(e) => setProfile(e.target.value)}>
              {vintage.profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <p>
            {profile.description} Kyse on kuvitteellisesta esimerkkikotitaloudesta, ei väestöryhmän
            keskiarvosta.
          </p>
          <label>
            Mikä osa?
            <select value={factor} onChange={(e) => setFactor(e.target.value as Factor)}>
              {factors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <p>{selected.detail}.</p>
          <label>
            Vertailuvuosi
            <select value={baseYear} onChange={(e) => setBase(Number(e.target.value))}>
              {years.slice(0, -1).map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </label>
          <label>
            Lähteen laskentaversio
            <select
              value={vintageId}
              onChange={(e) => {
                setVintage(e.target.value);
                setBase(2023);
              }}
            >
              {vintages.map((v) => (
                <option key={v.id} value={v.id}>
                  Labore {v.id}
                </option>
              ))}
            </select>
          </label>
        </aside>
        <section className="et-main" aria-label="Erotusanalyysi">
          <h2>{profile.name}</h2>
          <p>
            Käytettävissä olevat nimellistulot · €/kk · {baseYear}–{last.year}
          </p>
          <div className="et-legend">
            <span>━ Lähteen nettotulo</span>
            <span>┄ Vertailu: {selected.label.toLocaleLowerCase("fi")} ennallaan</span>
          </div>
          <svg
            viewBox="0 0 1000 400"
            role="img"
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-desc`}
          >
            <title id={`${id}-title`}>
              Nettotulo ja vertailu, jossa valittu osa säilyy vuoden {baseYear} euromäärässä
            </title>
            <desc id={`${id}-desc`}>
              Vuonna {last.year} nettotulo {euro(last.net)} euroa kuukaudessa, vertailu{" "}
              {euro(last.comparison)}. Erotus {signed(last.contribution)} euroa. Vuodesta{" "}
              {vintage.forecastFrom} alkaen lähteen ennustetta. Tarkat arvot taulukossa.
            </desc>
            <defs>
              <pattern id={`${id}-hatch`} width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M0 8L8 0" stroke="#efbc74" strokeWidth="1" opacity=".4" />
              </pattern>
            </defs>
            {vintage.forecastFrom <= last.year && (
              <rect
                x={x(Math.max(baseYear, vintage.forecastFrom))}
                y="45"
                width={905 - x(Math.max(baseYear, vintage.forecastFrom))}
                height="300"
                fill="#fff"
                opacity=".035"
              />
            )}
            {[lo - pad, (lo + hi) / 2, hi + pad].map((n) => (
              <g key={n}>
                <path d={`M85 ${y(n)} H905`} stroke="#ffffff20" />
                <text x="70" y={y(n) + 5} textAnchor="end">
                  {euro(n)}
                </text>
              </g>
            ))}
            <path d={area} fill={`url(#${id}-hatch)`} />
            <path d={curve(comparison)} className="et-comparison" />
            {rows.slice(1).map((p, i) => (
              <path
                key={p.year}
                d={curve([actual[i]!, actual[i + 1]!])}
                className="et-actual"
                strokeDasharray={p.year >= vintage.forecastFrom ? "8 5" : undefined}
              />
            ))}
            {rows.map((p, i) => (
              <g key={p.year}>
                <circle cx={x(p.year)} cy={y(p.net)} r="5" fill="#f3f0e8" />
                <circle cx={x(p.year)} cy={y(p.comparison)} r="4" fill="#efbc74" />
                <text x={x(p.year)} y="375" textAnchor="middle">
                  {p.year}
                  {p.year >= vintage.forecastFrom ? "*" : ""}
                </text>
              </g>
            ))}
          </svg>
          {profile.id === "earnings-unemployed" && (
            <p className="et-caption">{vintage.earningsNote}</p>
          )}
          <p className="et-caption">
            Pisteet ovat lähteen mallilukuja; kaaret vain yhdistävät ne. Pystyakseli on rajattu
            tulotason ympärille. * Lähteen julkaisuhetken ennuste vuodesta {vintage.forecastFrom}{" "}
            alkaen, ei jälkikäteen vahvistettu toteuma.
          </p>
          <article className="et-finding">
            <span>VALITUN OSAN OSUUS MUUTOKSESTA</span>
            <strong>{signed(last.contribution)} €/kk</strong>
            <p>
              {selected.label}: muutos{" "}
              {last.contribution < 0
                ? "pienentää"
                : last.contribution > 0
                  ? "kasvattaa"
                  : "ei muuta"}{" "}
              nettotuloa vertailuvuoteen nähden. Nettotulojen kokonaismuutos on{" "}
              {signed(last.net - base.net)} €/kk.
            </p>
            <p>
              Suurin euromääräinen osatekijä on {biggest.label.toLocaleLowerCase("fi")} (
              {signed(biggest.value)} €/kk). Muut osat voivat vahvistaa tai kompensoida sitä.
            </p>
          </article>
          <h3>Kokonaisuus auki</h3>
          <p>
            {euro(base.net)} €/kk ({baseYear}) → {euro(last.net)} €/kk ({last.year})
          </p>
          <div className="et-parts">
            {parts.map((p) => (
              <button
                key={p.id}
                disabled={p.id === "rounding"}
                aria-pressed={p.id === factor}
                onClick={() => setFactor(p.id as Factor)}
              >
                <span>{p.label}</span>
                <b>{signed(p.value)} €/kk</b>
              </button>
            ))}
          </div>
          <details>
            <summary>Mitä erotus osoittaa — ja miten se lasketaan?</summary>
            <p>
              Nettotulo = bruttotulo + muut etuudet − verot ja maksut + lähteen pyöristysero. Osien
              muutosten summa vastaa täsmälleen nettotulon muutosta. Veronalainen päiväraha sisältyy
              tässä lähteen bruttotuloon, joten kaikki etuudet eivät ole ”Muut etuudet” -kohdassa.
            </p>
            <p>
              Vertailukäyrä = lähteen nettotulo − valitun osan allekirjoitettu muutos
              vertailuvuodesta. Muiden osien euromäärät pidetään lähteen mukaisina. Tämä on
              kirjanpidollinen hajotelma: veroja tai etuuksia ei lasketa uudelleen muuttuneille
              tuloille. Se ei ennusta vaihtoehtoista maailmaa.
            </p>
            <p>
              Veromäärän kasvu voi johtua tulojen kasvusta ilman verotuksen kiristystä. Etuuden
              muutos voi johtua säännöistä, indekseistä tai mallioletuksista. Tulos ei yksin
              tunnista poliittisen päätöksen kausaalista vaikutusta, rahoittajaa tai toisen
              väestöryhmän vastuuta. Kotitalouksia ei summata kansantaloudeksi ilman väestöpainoja.
            </p>
            <p>
              Nimellistulo ei mittaa ostovoimaa: inflaatio, asumiskulut, julkiset palvelut ja
              käyttäytymisvaikutukset puuttuvat tästä hajotelmasta. Ei luottamusvälejä: lähde kuvaa
              malliperheitä, ei otosestimaatteja.
            </p>
            {profile.id === "earnings-unemployed" && <p>{vintage.earningsNote}</p>}
          </details>
          <details>
            <summary>Tarkat luvut ja lähde</summary>
            <div className="et-table">
              <table>
                <caption>€/kk. Ennustevuodet merkitty tähdellä.</caption>
                <thead>
                  <tr>
                    <th>Vuosi</th>
                    <th>Brutto</th>
                    <th>Muut etuudet</th>
                    <th>Verot ja maksut</th>
                    <th>Netto</th>
                    <th>Vertailu</th>
                    <th>Erotus</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.year}>
                      <th scope="row">
                        {p.year}
                        {p.year >= vintage.forecastFrom ? "*" : ""}
                      </th>
                      <td>{euro(p.gross)}</td>
                      <td>{euro(p.transfers)}</td>
                      <td>{euro(p.taxes)}</td>
                      <td>{euro(p.net)}</td>
                      <td>{euro(p.comparison)}</td>
                      <td>{signed(contribution(base, p, factor))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              <a href={vintage.url} target="_blank" rel="noreferrer">
                Labore: Esimerkkiperheet {vintage.id}, s. {profile.page}
              </a>{" "}
              · julkaistu {vintage.published}, laskettu {vintage.calculated}.{" "}
              <a href={vintage.web} target="_blank" rel="noreferrer">
                Menetelmät ja tulkinta
              </a>
              .
            </p>
            <p>
              Repon aineistopoiminta: {data.retrieved}. Laskentaversioita ei yhdistetä samaksi
              aikasarjaksi.
            </p>
          </details>
        </section>
      </div>
    </Container>
  );
}
