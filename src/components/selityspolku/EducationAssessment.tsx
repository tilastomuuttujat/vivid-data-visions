import { useState } from "react";
import assessment from "@/data/research/education-assessment.json";
import { fmt, smooth } from "./model";
const x = (year: number) => 60 + (year - 1850) * 4.8;
function observedPath(points: { year: number; value: number }[], y: (v: number) => number) {
  const segments: { x: number; y: number }[][] = [];
  points.forEach((p, i) => {
    if (i === 0 || p.year !== points[i - 1]!.year + 1) segments.push([]);
    segments[segments.length - 1]!.push({ x: x(p.year), y: y(p.value) });
  });
  return segments.map((s) => smooth(s)).join(" ");
}
export function EducationAssessment({ onYear }: { onYear: (year: number) => void }) {
  const [modern, setModern] = useState(false);
  const groups = [
    ["FI|education=3_4", "Toinen aste / erikoisammattitutkinto", "#06716c"],
    ["FI|education=5_6", "Alin tai alempi korkea-aste", "#574a9a"],
    ["FI|education=7_8", "Ylempi korkea-aste / tutkijakoulutus", "#a45e13"],
    ["FI|education=9_X", "Ei perusasteen jälkeistä tutkintoa / tuntematon", "#b44134"],
  ];
  const early = assessment.early_changes;
  const curves = modern
    ? groups.map(([key, label, color]) => ({
        label: label!,
        color: color!,
        points: assessment.employment_rates
          .filter((r) => r.group_key === key)
          .map((r) => ({ year: r.year, value: r.value })),
      }))
    : early.map((r, i) => ({
        label: i === 0 ? "Oppikoulujen oppilaat" : "Korkeakoulujen kirjoissa olevat opiskelijat",
        color: i === 0 ? "#06716c" : "#574a9a",
        points: assessment.historical_points
          .filter((p) => p.series_key === r.series_key && p.group_key === r.group_key)
          .map((p) => ({ year: p.year, value: p.value })),
      }));
  const hi = modern ? 100 : 150000,
    y = (value: number) => 135 - (value / hi) * 110;
  return (
    <section id="sp-education" className="sp-education" aria-label="Koulutus, työ ja toimeentulo">
      <p className="sp-eyebrow">ENSIMMÄINEN SISÄLLÖLLINEN ARVIO · TEEMAT 4, 15 JA 26</p>
      <h2>Koulutus avasi mahdollisuuksia. Työhön pääsy ei ole pelkkä tutkintokysymys.</h2>
      <p>
        Koulutuksen laajeneminen näkyy opiskelijamäärissä. Peruskoulu-uudistuksesta on erillistä
        tutkimusnäyttöä mahdollisuuksien tasaantumisesta. Nykyisten koulutusryhmien työllisyyserot
        puolestaan ovat kuvailevia: ne eivät sellaisinaan mittaa tutkinnon vaikutusta.
      </p>
      <div className="sp-years" role="group" aria-label="Koulutusarvion vertailut">
        <button
          aria-pressed={!modern}
          onClick={() => {
            setModern(false);
            onYear(1975);
          }}
        >
          1946–1975 · laajeneminen
        </button>
        <button
          aria-pressed={modern}
          onClick={() => {
            setModern(true);
            onYear(2024);
          }}
        >
          1995–2025 · työ ja koulutus
        </button>
      </div>
      <h3>
        {modern
          ? "Työllisten osuus koulutusryhmän 18–64-vuotiaista"
          : "Koulutus laajeni kahdessa erillisessä historiallisessa sarjassa"}
      </h3>
      <svg
        viewBox="0 0 1080 170"
        role="img"
        aria-label={
          modern
            ? "Koulutusryhmien työllisten osuudet 1995–2024; koko aikajana 1850–2050"
            : "Opiskelijamäärät 1946–1956 ja 1961–1975; koko aikajana 1850–2050"
        }
      >
        <rect x={x(2025)} y="15" width={x(2050) - x(2025)} height="120" fill="#eeeae3" />
        {[0, hi / 2, hi].map((v) => (
          <g key={v}>
            <line x1="60" x2="1020" y1={y(v)} y2={y(v)} stroke="#d7d1c6" />
            <text x="48" y={y(v) + 4} textAnchor="end">
              {fmt(v)}
            </text>
          </g>
        ))}
        {curves.flatMap((c) =>
          c.points.map((p) => (
            <circle
              key={`${c.label}:${p.year}`}
              cx={x(p.year)}
              cy={y(p.value)}
              r="2"
              fill={c.color}
            />
          )),
        )}
        {curves.map((c) => (
          <path
            key={c.label}
            d={observedPath(c.points, y)}
            stroke={c.color}
            strokeWidth="3"
            fill="none"
          />
        ))}
        {[1850, 1900, 1950, 1975, 2000, 2025, 2050].map((t) => (
          <text key={t} x={x(t)} y="160" textAnchor="middle">
            {t}
          </text>
        ))}
      </svg>
      <ul className="sp-education-legend">
        {curves.map((c) => (
          <li key={c.label}>
            <span style={{ background: c.color }} />
            {c.label}
          </li>
        ))}
      </ul>
      <p>
        {modern
          ? "Osuus on työlliset / saman koulutusryhmän väestö, ei työllisten osuus työvoimasta. Ei ikävakiointia. Vuoden 2025 työllisyystieto puuttuu tästä poiminnasta."
          : "Henkilömääriä, ei ikäluokan osallistumisosuuksia. Oppikoulu ja korkeakoulu ovat eri koulutusmuotoja. Sarjoja ei yhdistetä; vuodet ilman havaintoja jäävät tyhjiksi."}
      </p>
      <details>
        <summary>Avaa havainto, vaikutusnäyttö ja epävarmuus</summary>
        <h3>1. Mitä aineistossa muuttui?</h3>
        <ul>
          {early.map((r) => (
            <li key={r.series_key}>
              {r.start}–{r.end}: {r.start_value.toLocaleString("fi-FI")} →{" "}
              {r.end_value.toLocaleString("fi-FI")} opiskelijaa ({fmt(r.change_percent)} %).
              Laskettu saman historiallisen lähdesarjan päätepisteistä.
            </li>
          ))}
        </ul>
        <p>
          Kasvu voi kuvata koulutusmahdollisuuksien lisäksi ikäluokkien kokoa, opintojen kestoa ja
          kirjaamiskäytäntöjä. Se ei yksin mittaa koulutuksen laatua tai työn tarpeisiin
          vastaamista.
        </p>
        <h3>2. Mikä uudistuksessa vaikutti?</h3>
        {assessment.studies.map((s) => (
          <article key={s.id}>
            <h4>{s.title}</h4>
            <p>{s.finding}</p>
            <p>
              <strong>Asetelma:</strong> {s.design} {s.population}
            </p>
            <p>
              <strong>Oletukset ja rajat:</strong> {s.assumptions} {s.limits}
            </p>
            <p>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.authors} · {s.version}
              </a>{" "}
              · {s.locator}
            </p>
          </article>
        ))}
        <p>
          Uudistus toteutui 1972–1977 eli ylittää tarkastelujakson rajan. Vuonna 2000 mitattu
          ansiotulos on pitkän seurannan havainto, ei vuoden 1975 toteuma. Julkaistua
          vaikutusestimaattia ei ole laskettu uudelleen tässä palvelussa.
        </p>
        <h3>3. Keitä nykyinen koulutus–työ-yhteys koskee?</h3>
        <div className="sp-recovery-scroll">
          <table>
            <caption>Työllisten osuus 18–64-vuotiaista koulutusryhmittäin, %</caption>
            <thead>
              <tr>
                <th>Koulutusryhmä</th>
                <th>1995</th>
                <th>2024</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(([key, label]) => (
                <tr key={key}>
                  <th scope="row">{label}</th>
                  {[1995, 2024].map((year) => (
                    <td key={year}>
                      {fmt(
                        assessment.employment_rates.find(
                          (r) => r.year === year && r.group_key === key,
                        )!.value,
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {assessment.conclusion.descriptive_only} Tuntematon tutkinto on samassa ryhmässä
          perusasteen kanssa. Ulkomailla hankittujen tutkintojen puuttuminen rekisteristä voi
          vaikuttaa ryhmävertailuun.
        </p>
        <details>
          <summary>Alue-erot vuonna 2024</summary>
          <p>
            Sama ikäraja ja osuuslaskenta, mutta väestöjä ei ikä- tai toimialavakioida. Taulukko ei
            ole alueiden koulutuspolitiikan paremmuusjärjestys.
          </p>
          <div className="sp-recovery-scroll">
            <table>
              <thead>
                <tr>
                  <th>Alue ja koulutusryhmä</th>
                  <th>Työllisiä, %</th>
                </tr>
              </thead>
              <tbody>
                {assessment.employment_rates
                  .filter(
                    (r) =>
                      r.year === 2024 &&
                      !r.group_key.startsWith("FI|") &&
                      !r.group_key.endsWith("=SSS"),
                  )
                  .map((r) => (
                    <tr key={r.group_key}>
                      <th scope="row">{r.group_label}</th>
                      <td>{fmt(r.value)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
        <h3>4. Mihin päätelmä päättyy?</h3>
        <p>{assessment.conclusion.not_identified}</p>
        <p>{assessment.conclusion.future}</p>
        <h3>Lähteet ja laskennan rajat</h3>
        <p>
          Poiminta {assessment.captured_at.slice(0, 10)}. {assessment.checks.input_rows} lähderiviä;{" "}
          {assessment.checks.placement_ratios_checked} valmistuneiden työllisyysosuutta täsmää
          osoittajaansa ja nimittäjäänsä lähteen kokonaisprosentin pyöristystarkkuudella (±0,5
          prosenttiyksikköä). Tämä on laskennan tarkistus, ei riippumaton alkuperäislähteen
          tarkistus.
        </p>
        {assessment.source_series.map((s) => (
          <p key={s.series_key}>
            <a href={s.source_url ?? undefined} target="_blank" rel="noreferrer">
              {s.title}
            </a>{" "}
            · {s.unit}
          </p>
        ))}
        <p>
          <a
            href="https://stat.fi/fi/dokumentaatio/tilastojen-dokumentaatio/vkour"
            target="_blank"
            rel="noreferrer"
          >
            Tilastokeskuksen koulutusrakennetilaston dokumentaatio
          </a>
          : ulkomaisten tutkintojen rekisterikattavuus on huomioitava.
        </p>
        <p>
          Lähderivien alkuperäiset tarkistusluokat säilyvät syötetiedostossa. Historiallisia
          vuosikirjoja ei tarkistettu uudelleen tässä erässä. Lähdetunniste:{" "}
          <code>{assessment.input_sha256}</code>.
        </p>
      </details>
    </section>
  );
}
