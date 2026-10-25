import { useState } from "react";
import inventory from "@/data/research/theme-coverage.json";
const labels: Record<string, string> = {
  observed_candidates: "Havaintoehdokkaita",
  estimate_candidates: "Vain arvioehdokkaita",
  no_historical_candidate_in_scope: "Ei historiallista ehdokasta tässä rajauksessa",
};
export function ThemeCoverage({ onYear }: { onYear: (year: number) => void }) {
  const [theme, setTheme] = useState(4),
    [period, setPeriod] = useState("1850");
  const cell = inventory.cells.find((c) => c.theme_id === theme && c.period_id === period)!;
  const title = inventory.themes.find((t) => t.id === theme)!;
  return (
    <details className="sp-coverage">
      <summary>32 teemaa · missä näyttö kantaa ja mitä pitää täydentää?</summary>
      <h3>Aineiston kytkennät, eivät vaikutusarvosanat</h3>
      <p>
        Kartoitus käsittää 192 teemajaksoa. Niistä {inventory.counts.statuses.observed_candidates}{" "}
        sisältää havaintoehdokkaita ja {inventory.counts.statuses.estimate_candidates} vain
        arvioehdokkaita. Muista {inventory.counts.statuses.no_historical_candidate_in_scope} ei
        löytynyt historiallista havainto- tai arvioehdokasta käytetyillä kytkennöillä. Tämä ei
        tarkoita, ettei tietokannassa tai muissa lähteissä olisi tietoa.
      </p>
      <p>
        Rajaus: julkaistut indikaattorisarjat ja niiden olemassa olevat muuttujakytkennät.
        Tapahtuma-, säädös-, lähde- ja tutkimuskorttien koko aineistoa ei ole arvioitu. Kytkennät
        ovat kontekstia tai välillisiä mittareita; aineiston määrä ei ole näytön vahvuus.
      </p>
      <label>
        Teema{" "}
        <select value={theme} onChange={(e) => setTheme(Number(e.target.value))}>
          {inventory.themes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <div className="sp-years" role="group" aria-label="Kattavuuskartoituksen jaksot">
        {inventory.periods.map((p) => (
          <button
            key={p.id}
            aria-pressed={period === p.id}
            onClick={() => {
              setPeriod(p.id);
              onYear(p.end);
            }}
          >
            {p.start}–{p.end}
          </button>
        ))}
      </div>
      {[4, 15, 26].includes(theme) && (
        <p>
          <a
            href="#sp-education"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("sp-education")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Avaa rajattu koulutuksen, työn ja toimeentulon arvio alempana
          </a>
          . Se ei muuta koko teemajakson kattavuusluokitusta.
        </p>
      )}
      <article aria-live="polite">
        <h4>
          {title.name} · {cell.start}–{cell.end}
        </h4>
        <p>
          <strong>{labels[cell.status]}</strong>. Havaintoehdokkaita {cell.observed_years.length}{" "}
          kalenterivuodelle / {cell.end - cell.start + 1}. Eri sarjojen vuosien unioni ei ole
          yhtenäinen vertailukelpoinen aikasarja.
        </p>
        <p>
          <strong>Tarkistettava kysymys:</strong> {cell.change_assessment.question}
        </p>
        <dl>
          <dt>Mikä kantoi tai heikensi kehitystä?</dt>
          <dd>Vaikutusta ei vielä arvioitu. {cell.channel_assessment.question}</dd>
          <dt>Keihin muutos kohdistui?</dt>
          <dd>{cell.distribution_assessment.question}</dd>
          <dt>Kuinka pitkään vaikutus jatkui?</dt>
          <dd>{cell.duration_assessment.question}</dd>
          <dt>Mitä näyttö osoittaa?</dt>
          <dd>{cell.evidence_assessment.question}</dd>
          <dt>Seuraava työ</dt>
          <dd>{cell.next_step}</dd>
          <dt>Onnistumisten tarkistus</dt>
          <dd>{cell.correction_question}</dd>
          <dt>Vaihtoehtoinen selitys</dt>
          <dd>{cell.alternative_question}</dd>
        </dl>
        <details>
          <summary>
            Katso ehdokassarjat ja alkuperäiset tarkistusluokat ({cell.series.length})
          </summary>
          {cell.series.map((r) => {
            const s = inventory.series_catalog.find((s) => s.series_key === r.series_key)!;
            return (
              <section key={r.series_key}>
                <h5>{s.title}</h5>
                <p>
                  {s.unit} · havaintoja {r.observed}, arvioita {r.estimated}, ennusteita{" "}
                  {r.projected}. Ennusteet eivät täytä historiallista kattavuutta.
                </p>
                <p>
                  Tarkistusluokat: {r.validation.join(", ")}. Tallennettu havainto ei
                  automaattisesti tarkoita riippumattomasti tarkistettua tietoa.
                </p>
                <p>
                  Ryhmät: {r.groups.join(", ")}.{" "}
                  {s.source_url && (
                    <a href={s.source_url} target="_blank" rel="noreferrer">
                      Lähde
                    </a>
                  )}
                </p>
                <p>
                  <code>{r.series_key}</code>
                </p>
              </section>
            );
          })}
          <p>
            Puuttuvat havaintovuodet tässä rajauksessa:{" "}
            {cell.missing_observed_years.join(", ") ||
              "ei puuttuvia kalenterivuosia; vertailukelpoisuus arvioimatta"}
            .
          </p>
        </details>
      </article>
      <details>
        <summary>12 perusteltua jatkotehtävää</summary>
        <p>
          Tehtävät tasapainottavat talouden, hyvinvoinnin, oikeuksien ja ympäristön tarkastelua.
          Järjestys ei ole laskennallinen tärkeysindeksi. Tehtäviä ei merkitä tehdyiksi pelkän
          sarjakytkennän perusteella.
        </p>
        <ol>
          {inventory.priority_tasks.map((t) => (
            <li key={t.theme_id}>
              <strong>{t.title}:</strong> {t.action}
            </li>
          ))}
        </ol>
      </details>
      <p>
        Poimittu {inventory.captured_at.slice(0, 10)}. Historiallinen rajaus 1850–2025.
        Lähdetunniste: <code>{inventory.inputs_sha256}</code>. Nykyinen kartoitus ei vielä anna
        vaikutusten suuntaa tai kokoa eikä kata kaikkia tietokannan aineistoperheitä.
      </p>
    </details>
  );
}
