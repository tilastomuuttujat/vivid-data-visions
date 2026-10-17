import { useMemo, useState } from "react";
import { ANCHORS } from "./ankkurit-model";
import { networkNode, networkSource } from "./decision-network-model";
import { anchorShares, SHARE_KINDS, type ShareKind } from "./anchor-shares-model";
import "./anchor-shares.css";
const percent = (n: number) => n.toLocaleString("fi-FI", { maximumFractionDigits: 1 }) + " %";
export function AnchorShares({ ids }: { ids: string[] }) {
  const rows = useMemo(
    () => ANCHORS.filter((a) => ids.includes(a.id)).map((a) => anchorShares(a.id)),
    [ids],
  );
  const [picked, setPicked] = useState<{ id: string; kind: ShareKind } | null>(null);
  const [grouped, setGrouped] = useState(false);
  const row = rows.find((r) => r.anchor.id === picked?.id);
  const distribution = row?.distributions.find((d) => d.kind === picked?.kind);
  if (!rows.length) return null;
  return (
    <section className="asp" aria-label="Ankkurien kytkentöjen prosenttijakaumat">
      <header>
        <h3>Kytkentöjen prosenttijakauma</h3>
        <p>
          Mitkä taustat ja jatkokytkennät painottuvat lähdeverkostossa? Jokainen alkuperäinen
          relaatio saa saman painon. Prosentti kertoo osuuden kyseisen ankkurin ja sarakkeen
          kytkennöistä, <b>ei mitattua vaikutusosuutta, todennäköisyyttä tai tekijän tärkeyttä.</b>
        </p>
      </header>
      <div className="asp-modes" role="group" aria-label="Prosenttijakauman ryhmittely">
        <button aria-pressed={!grouped} onClick={() => setGrouped(false)}>
          Yksittäiset tekijät
        </button>
        <button aria-pressed={grouped} onClick={() => setGrouped(true)}>
          Ankkuriryhmät
        </button>
      </div>
      <p className="asp-reading">
        Tekijän palkki käyttää asteikkoa 0–100 %. Näytetään kolme eniten kytkentöjä saanutta
        tekijää; tasatilanteessa järjestys on aakkosellinen. Kaikki tekijät löytyvät avattavista
        tiedoista.
      </p>
      <div className="asp-head" aria-hidden="true">
        <span>Ankkuri</span>
        {SHARE_KINDS.map((k) => (
          <span key={k.id}>
            {k.label}
            <small>{k.sub}</small>
          </span>
        ))}
      </div>
      {rows.map((r) => (
        <article
          key={r.anchor.id}
          className="asp-row"
          aria-label={`Ankkurin ${r.anchor.n} prosenttijakaumat`}
        >
          <h4 style={{ color: r.anchor.tone }}>
            {r.anchor.n}. {r.anchor.title}
          </h4>
          {r.distributions.map((d) => (
            <div key={d.kind} className="asp-cell">
              <span className="asp-mobile-label">
                {SHARE_KINDS.find((k) => k.id === d.kind)!.label}
              </span>
              {d.total ? (
                <>
                  {grouped ? (
                    <>
                      <div
                        className="asp-bar"
                        role="img"
                        aria-label={d.groups
                          .map((g) => `${g.label}: ${percent(g.percent)} (${g.count}/${d.total})`)
                          .join("; ")}
                      >
                        {d.groups.map((g) => (
                          <span
                            key={g.id}
                            style={{ width: `${g.percent}%`, background: g.tone }}
                            title={`${g.label}: ${percent(g.percent)} (${g.count}/${d.total})`}
                          >
                            {g.percent >= 15 ? percent(g.percent) : ""}
                          </span>
                        ))}
                      </div>
                      <p className="asp-dominant">
                        Suurin ryhmä: {d.groups[0]!.label} · {percent(d.groups[0]!.percent)}
                      </p>
                    </>
                  ) : (
                    <div className="asp-factors">
                      {d.factors.slice(0, 3).map((f) => (
                        <div key={f.id} className="asp-factor">
                          <div>
                            <span>{f.label}</span>
                            <b>{percent(f.percent)}</b>
                          </div>
                          <div className="asp-factor-track" aria-hidden="true">
                            <i style={{ width: `${f.percent}%`, background: f.tone }} />
                          </div>
                        </div>
                      ))}
                      {d.factors.length > 3 && (
                        <p>
                          Näytössä 3/{d.factors.length} tekijää; muiden osuus{" "}
                          {percent(d.factors.slice(3).reduce((sum, f) => sum + f.percent, 0))}.
                        </p>
                      )}
                    </div>
                  )}
                  <button
                    aria-expanded={picked?.id === r.anchor.id && picked.kind === d.kind}
                    onClick={() =>
                      setPicked((p) =>
                        p?.id === r.anchor.id && p.kind === d.kind
                          ? null
                          : { id: r.anchor.id, kind: d.kind },
                      )
                    }
                  >
                    Avaa tekijät · {d.total} relaatiota
                    <span className="sr-only">
                      {" "}
                      · ankkuri {r.anchor.n}, {SHARE_KINDS.find((k) => k.id === d.kind)!.label}
                    </span>
                  </button>
                </>
              ) : (
                <p className="asp-empty">Ei kirjattuja kytkentöjä — prosenttia ei lasketa.</p>
              )}
            </div>
          ))}
          <p className="asp-coverage">
            Jakaumien ulkopuolella: {r.internal} ankkurin sisäistä relaatiota;{" "}
            {r.undatedIncoming + r.undatedOutgoing} ajoittamatonta ({r.undatedIncoming} saapuvaa,{" "}
            {r.undatedOutgoing} lähtevää); {r.scenarioIncoming} skenaariosta saapuvaa. Puuttuva
            yhteys ei tarkoita vaikutuksen puuttumista.
          </p>
        </article>
      ))}
      <div className="asp-legend">
        {ANCHORS.map((a) => (
          <span key={a.id}>
            <i style={{ background: a.tone }} />
            {a.n}. {a.title}
          </span>
        ))}
        <span>
          <i style={{ background: "#899aad" }} />
          Muut lähdekortit
        </span>
      </div>
      {row && distribution && (
        <article className="asp-details" aria-label="Prosenttijakauman tekijät">
          <header>
            <h4>
              {row.anchor.n}. {row.anchor.title} ·{" "}
              {SHARE_KINDS.find((k) => k.id === distribution.kind)!.label}
            </h4>
            <button onClick={() => setPicked(null)}>Sulje prosenttijakauman tiedot</button>
          </header>
          <p>
            Nimittäjä: {distribution.total} yksilöllistä lähderelaatiota. Kukin relaatio lasketaan
            kerran tässä jakaumassa. Sama tekijä voi liittyä useaan ankkurin jäsenkorttiin ja saada
            siksi useamman relaation. Lähteen kattavuus vaikuttaa osuuksiin; suurempi osuus ei
            osoita suurempaa yhteiskunnallista vaikutusta.
          </p>
          <div className="asp-table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Lähdekortti / tekijä</th>
                  <th scope="col">Osuus</th>
                  <th scope="col">Relaatiot</th>
                  <th scope="col">Alkuperäiset yhteydet</th>
                </tr>
              </thead>
              <tbody>
                {distribution.factors.map((f) => (
                  <tr key={f.id}>
                    <th scope="row">
                      {f.label}
                      <small>
                        {networkNode(f.id)?.yearStart ?? "Ei ajoitusta"}
                        {distribution.kind === "future" ? " · tulevaisuus / skenaario" : ""}
                      </small>
                    </th>
                    <td>{percent(f.percent)}</td>
                    <td>
                      {f.count}/{distribution.total}
                    </td>
                    <td>
                      <details>
                        <summary>Näytä {f.count} lähderelaatiota</summary>
                        {f.edges.map((e) => (
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
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
      <details className="asp-method">
        <summary>Miten prosentit lasketaan?</summary>
        <p>
          Osuus = ryhmään tai tekijään liittyvien suorien lähderelaatioiden määrä / kaikki saman
          ankkurin ja sarakkeen suorat ulkoiset lähderelaatiot × 100. Kukin sarake muodostaa oman
          100 prosentin kokonaisuutensa; eri sarakkeiden prosentteja ei lasketa yhteen. Pyöristys
          voi muuttaa näkyvää summaa hieman. Sisäiset yhteydet eivät kasvata ulkoisen tekijän
          osuutta.
        </p>
        <p>
          Saapuva suunta kuvaa lähteeseen kirjattua taustakytkentää, ei välttämättä ajallisesti
          aiempaa tapahtumaa. Historiallinen jatkokytkentä päättyy korttiin, jonka alkamisvuosi on
          enintään 2025. Tulevaisuuskytkentä päättyy vuoden 2025 jälkeiseen korttiin tai lähteessä
          skenaarioksi tunnistettuun korttiin. Vuosi 2025 on historiallista aineistoa ja
          skenaarioita erottava kiinteä raja, ei automaattisesti vaihtuva nykyvuosi.
        </p>
        <p>
          Ryhmät ovat seitsemän toimituksellista ankkuria ja niiden ulkopuoliset lähdekortit.
          Yhteyksiä ei täydennetä eikä epäsuoria reittejä lasketa. Relaatiotyyppi tai lähteen
          varmuusarvio ei muodosta numeerista vaikutuspainoa. Kaikki relaatiotyypit ovat mukana:
          myös yhteys- ja täydentymismerkinnät, eivät vain kausaaliväitteet. Näkymä ei ole ennuste.
        </p>
        <a href={networkSource.url} target="_blank" rel="noreferrer">
          Kiinnitetty TTT-lähdeaineisto
        </a>
      </details>
    </section>
  );
}
