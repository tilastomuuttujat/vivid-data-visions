import { useState } from "react";
import framework from "@/data/research/long-view.json";
import evidence from "@/data/murrosmatriisi-evidence.json";

export function LongView({ onYear }: { onYear: (year: number) => void }) {
  const [selected, setSelected] = useState("1976");
  const p = framework.periods.find((p) => p.id === selected);
  const episodes = evidence.episodes.filter((e) => p?.episodes.includes(e.code));
  return (
    <section className="sp-longview" aria-label="Suomen suunnat 1850–2050">
      <p className="sp-eyebrow">KOKONAISKUVA · 1850–2025–2050</p>
      <h2>Miten tuotanto, toimeentulo ja yhteinen vastuu pysyivät toistensa mukana?</h2>
      <p>
        Valitse jakso. Näkymä kokoaa murrosehdokkaat ja näyttää, mitä nykyinen poiminta pystyy
        osoittamaan. Jaksojen rajat ovat tutkimuksen jäsennys, eivät mitattuja käännevuosia.
      </p>
      <div className="sp-periods" role="group" aria-label="Historialliset jaksot ja tulevaisuus">
        {framework.periods.map((period) => (
          <button
            key={period.id}
            aria-pressed={selected === period.id}
            onClick={() => {
              setSelected(period.id);
              onYear(period.end);
            }}
          >
            <strong>
              {period.start}–{period.end}
            </strong>
            <span>{period.title}</span>
          </button>
        ))}
        <button
          aria-pressed={selected === "future"}
          onClick={() => {
            setSelected("future");
            onYear(2050);
          }}
        >
          <strong>2025–2050</strong>
          <span>Ehdolliset tulevaisuudet</span>
        </button>
      </div>
      {p ? (
        <article aria-live="polite">
          <h3>{p.question}</h3>
          <p>
            <strong>Tutkimuksen punainen lanka:</strong> {p.focus}. Tämä on tarkistettava kysymys,
            ei valmis arvio onnistumisesta.
          </p>
          <details>
            <summary>Näyttö ja keskeiset aukot · {episodes.length} murrosehdokasta</summary>
            <h4>Mitattu muutos</h4>
            <p>
              {episodes.length
                ? "Alla olevat tapaukset ja sarjat ovat nykyisestä tietokantapoiminnasta. Sarjojen määrä ei mittaa näytön vahvuutta."
                : "Tälle jaksolle ei ole tähän koosteeseen kytkettyä erillistä murrostapausta. Laman toipumisen neljän mallin vertailu löytyy alempaa."}
            </p>
            {episodes.map((e) => (
              <section key={e.code} className="sp-episode">
                <h4>{e.title}</h4>
                <p>
                  Vertailu: {e.pre.join("–")} → {e.shock.join("–")} → {e.post.join("–")}. Seuranta
                  {e.followup_right_censored
                    ? " on kesken."
                    : " päättyy tapauskohtaiseen jälkijaksoon; pysyvää vaikutusta ei ole osoitettu."}
                </p>
                <ul>
                  {e.metrics.map((m) => (
                    <li key={`${m.series_key}:${m.group_key}`}>
                      <strong>{m.title}</strong> · {m.unit} · {m.observations.length} havaintoa
                      tässä vertailussa. {m.comparability}{" "}
                      {m.source_urls.map((u) => (
                        <a key={u} href={u} target="_blank" rel="noreferrer">
                          Lähde{" "}
                        </a>
                      ))}
                    </li>
                  ))}
                </ul>
                <p>
                  <strong>Puuttuva näyttö:</strong> {e.missing_dimensions.join(" ")}
                </p>
                {e.limitations.map((l, i) => (
                  <p key={i}>{l}</p>
                ))}
              </section>
            ))}
            <h4>Lähteistetyt toteutushavainnot</h4>
            {evidence.implementationRecords
              .filter((r) => episodes.some((e) => e.implementation_ids.includes(r.id)))
              .map((r) => (
                <section key={r.id}>
                  <h4>{r.title}</h4>
                  {r.facts.map((f) => (
                    <p key={f.id}>
                      {f.statement}{" "}
                      <a href={f.source_url} target="_blank" rel="noreferrer">
                        Lähde
                      </a>
                    </p>
                  ))}
                  <p>{r.limitations.join(" ")}</p>
                </section>
              ))}
            <p>
              Toimeenpanohavainto ei yksin osoita yhteiskunnallisen vaikutuksen suuruutta. Sarjojen
              tarkistusluokitus ja lähdeversio säilyvät alkuperäisessä poiminnassa.
            </p>
            <h4>Avoin tulkinta ja seuraava tiedonkeruu</h4>
            <dl>
              <dt>Selvitettävät kanavat</dt>
              <dd>{p.channel}</dd>
              <dt>Ryhmät, joiden erot on tarkistettava</dt>
              <dd>{p.groups}</dd>
              <dt>Vaihtoehtoiset selitykset</dt>
              <dd>{p.alternative}</dd>
              <dt>Ensisijainen täydennystarve</dt>
              <dd>{p.priority_gap}</dd>
            </dl>
            <p>
              Hyödyn tai haitan suuntaa ei päätellä pelkästä sarjan kasvusta. Tavoite, toteuma,
              ryhmäkohtainen vaikutus ja vaikutuksen kesto on arvioitava erikseen.
            </p>
          </details>
        </article>
      ) : (
        <article aria-live="polite">
          <h3>Tulevaisuuden ero syntyy oletuksista</h3>
          <p>
            Vuosille 2026–2050 ei tässä vaiheessa lasketa vaikutuksia. Seuraavat ovat skenaarioiden
            tutkimuskysymyksiä, eivät ennusteita tai paremmuusjärjestys.
          </p>
          <ul>
            <li>
              <strong>Nykyisten rakenteiden jatkuminen:</strong> mitä tapahtuu, jos havaittuihin
              ongelmiin ei tule uusia korjausliikkeitä?
            </li>
            <li>
              <strong>Osallistumisen vahvistuminen:</strong> millä oletuksilla työ, toimeentulo ja
              palvelut tavoittaisivat useammat?
            </li>
            <li>
              <strong>Tuottavuuden kiihtyminen:</strong> miten hyödyt jakautuisivat työn, omistuksen
              ja julkisen rahoituksen välillä?
            </li>
          </ul>
          <p>
            Ennen laskentaa tarvitaan yhteinen lähtövuosi, väestö- ja tuottavuusoletukset,
            päätösvaihtoehdot sekä herkkyystarkastelut. Samoja rahavirtoja ei lasketa eri mallien
            kautta kahdesti.
          </p>
        </article>
      )}
      <details>
        <summary>Kartoituksen rajaus ja jäljitettävyys</summary>
        <p>
          Historiallinen näyttö: murrosmatriisin poiminta {evidence.source.capturedAt}. Tässä
          käytetään vain poiminnan nimettyjä tapauksia, sarjoja ja toteutushavaintoja. Kuuden jakson
          kysymykset ja jatkotehtävät ovat toimituksellinen tutkimuskehys. Kaikkia 32 teemaa tai
          tietokannan kaikkia havaintoja ei ole vielä arvioitu tämän kehyksen kautta. Puuttuva
          kytkentä ei tarkoita puuttuvaa ilmiötä.
        </p>
        <p>Poiminnan tunniste: {evidence.integrity.payloadSha256}.</p>
      </details>
    </section>
  );
}
