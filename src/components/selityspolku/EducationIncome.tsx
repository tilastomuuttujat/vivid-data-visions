import { useState } from "react";
import data from "@/data/research/education-income.json";
import { fmt, smooth } from "./model";
const x = (year: number) => 60 + (year - 1850) * 4.8;
const groups = [
  { code: "78", label: "Ylempi korkea-aste / tutkijakoulutus", color: "#574a9a" },
  { code: "9", label: "Ei perusasteen jälkeistä tutkintoa / tuntematon", color: "#b44134" },
];
const incomeLabels: Record<string, string> = {
  SSS: "Yhteensä",
  "3": "Toinen aste",
  "456": "Alin/alempi korkea-aste ja erikoisammattikoulutusaste",
  "78": "Ylempi korkea-aste / tutkijakoulutus",
  "9": "Ei perusasteen jälkeistä tutkintoa / tuntematon",
};
function incomeValue(
  education: string,
  year: number,
  measure = "tjt-ekvikturaha_med",
  age = "18-64",
  sex = "SSS",
) {
  return (
    data.income.find(
      (r) =>
        r.education === education &&
        r.year === year &&
        r.measure === measure &&
        r.age === age &&
        r.sex === sex,
    )?.value ?? null
  );
}
export function EducationIncome({ onYear }: { onYear: (year: number) => void }) {
  const [age, setAge] = useState("18-64"),
    [sex, setSex] = useState("SSS"),
    [wageAge, setWageAge] = useState("SSS"),
    [field, setField] = useState("SSS");
  const first = data.ratios[0]!,
    last = data.ratios[data.ratios.length - 1]!;
  return (
    <section
      id="sp-education-income"
      className="sp-education"
      aria-label="Koulutus ja toimeentulo 2010–2024"
    >
      <p className="sp-eyebrow">TÄYDENTÄVÄ TULOTARKASTELU · HAVAITTU ERO, EI VAIKUTUSOSUUS</p>
      <h2>Näiden koulutusryhmien toimeentuloero kasvoi.</h2>
      <p>
        Ylemmän korkea-asteen tai tutkijakoulutuksen suorittaneiden 18–64-vuotiaiden mediaanitulo
        oli vuonna {first.year} {fmt(first.ratio)}-kertainen ja vuonna {last.year} {fmt(last.ratio)}
        -kertainen suhteessa ryhmään, jolla ei ollut perusasteen jälkeistä tutkintoa tai tutkinto
        oli tuntematon. Tulo tarkoittaa tässä asuntokunnan rahatuloa kulutusyksikköä kohti, ei
        henkilön palkkaa.
      </p>
      <p>
        Vuoden 2024 rahassa mediaani muuttui 2010–2024 ylemmän koulutuksen ryhmässä{" "}
        {fmt(100 * (incomeValue("78", 2024)! / incomeValue("78", 2010)! - 1))} % ja
        perusasteen/tuntemattoman tutkinnon ryhmässä{" "}
        {fmt(100 * (incomeValue("9", 2024)! / incomeValue("9", 2010)! - 1))} %. Suhteellisen eron
        kasvu ei siis tässä tarkoita kummankin ryhmän toimeentulon paranemista.
      </p>
      <button onClick={() => onYear(2024)}>Tarkastele vuotta 2024 koko aikajanalla</button>
      {[
        {
          kind: "income",
          title: "Kotitalouden toimeentulo · mediaani, €/vuosi vuoden 2024 rahassa",
          hi: 60000,
        },
        {
          kind: "employment",
          title: "Työllisten osuus saman koulutusryhmän 18–64-vuotiaista · %",
          hi: 100,
        },
      ].map((chart) => {
        const y = (value: number) => 115 - (value / chart.hi) * 90;
        return (
          <article key={chart.kind}>
            <h3>{chart.title}</h3>
            <svg
              viewBox="0 0 1080 150"
              role="img"
              aria-label={`${chart.title}. Havaintoja 2010–2024, koko aikajana 1850–2050.`}
            >
              <rect x={x(2025)} y="15" width="120" height="100" fill="#eeeae3" />
              {[0, chart.hi / 2, chart.hi].map((v) => (
                <g key={v}>
                  <line x1="60" x2="1020" y1={y(v)} y2={y(v)} stroke="#d7d1c6" />
                  <text x="48" y={y(v) + 4} textAnchor="end">
                    {fmt(v)}
                  </text>
                </g>
              ))}
              {groups.map((g) => {
                const points =
                  chart.kind === "income"
                    ? data.income
                        .filter(
                          (r) =>
                            r.education === g.code &&
                            r.measure === "tjt-ekvikturaha_med" &&
                            r.age === "18-64" &&
                            r.sex === "SSS",
                        )
                        .map((r) => ({ year: r.year, value: r.value }))
                    : data.employment
                        .filter((r) => r.education === g.code)
                        .map((r) => ({ year: r.year, value: r.value }));
                const segments: { x: number; y: number }[][] = [];
                let prev: number | null = null;
                points.forEach((p) => {
                  if (p.value === null) {
                    prev = null;
                    return;
                  }
                  if (prev === null || p.year !== prev + 1) segments.push([]);
                  segments[segments.length - 1]!.push({ x: x(p.year), y: y(p.value) });
                  prev = p.year;
                });
                return (
                  <path
                    key={g.code}
                    d={segments.map((s) => smooth(s)).join(" ")}
                    stroke={g.color}
                    fill="none"
                    strokeWidth="3"
                  />
                );
              })}
              {[1850, 1900, 1950, 2000, 2025, 2050].map((t) => (
                <text key={t} x={x(t)} y="140" textAnchor="middle">
                  {t}
                </text>
              ))}
            </svg>
          </article>
        );
      })}
      <ul className="sp-education-legend">
        {groups.map((g) => (
          <li key={g.code}>
            <span style={{ background: g.color }} />
            {g.label}
          </li>
        ))}
      </ul>
      <p>
        Työ ja toimeentulo näkyvät rinnakkain eri yksiköissä. Käyrien perusteella ei jaeta tuloeroa
        koulutuksen, työttömyyden tai palkan aiheuttamiin osuuksiin.
      </p>
      <details>
        <summary>Mistä tulot muodostuvat — ja mitä ei voi erotella?</summary>
        <p>{data.notes.channels}</p>
        <p>{data.notes.decomposition}</p>
        <h3>Kolme erillistä tulokäsitettä vuonna 2024</h3>
        <label>
          Henkilön ikä{" "}
          <select value={age} onChange={(e) => setAge(e.target.value)}>
            {["18-64", "25-34", "35-49", "50-64"].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label>
          Sukupuoli{" "}
          <select value={sex} onChange={(e) => setSex(e.target.value)}>
            <option value="SSS">Yhteensä</option>
            <option value="1">Miehet</option>
            <option value="2">Naiset</option>
          </select>
        </label>
        <div className="sp-recovery-scroll">
          <table>
            <caption>
              Mediaanit €/vuosi · eri henkilöjoukkojen mediaaneja ei vähennetä toisistaan
              vaikutusosuuksiksi
            </caption>
            <thead>
              <tr>
                <th>Koulutus</th>
                <th>Asuntokunnan tulo / kulutusyksikkö</th>
                <th>Henkilökohtainen käytettävissä oleva rahatulo</th>
                <th>Henkilökohtainen tuotannontekijätulo</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(incomeLabels).map(([code, label]) => (
                <tr key={code}>
                  <th scope="row">{label}</th>
                  {["tjt-ekvikturaha_med", "hkturaha_med", "htuotektu_med"].map((measure) => (
                    <td key={measure}>
                      {incomeValue(code, 2024, measure, age, sex) === null
                        ? "ei julkaistua tietoa"
                        : fmt(incomeValue(code, 2024, measure, age, sex)!)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Henkilökohtaiseen käytettävissä olevaan rahatuloon ei ole jaettu kotitalouskohtaisia
          tuloeriä. Tuotannontekijätulo ei ole palkkamittari. Ryhmien erot voivat kuvata myös ikää,
          koulutusalaa, terveyttä, perherakennetta ja valikoitumista.
        </p>
        <h3>Kokoaikaisten palkansaajien palkkataso vuonna 2024</h3>
        <p>
          Erillinen poikkileikkaus: bruttokuukausiansio, ei koko koulutusryhmän toimeentulo.
          Kokonaisansio voi sisältää eri työaikoja ja korvauksia. Tästä ei lasketa tuntipalkan tai
          työajan vaikutusosuutta.
        </p>
        <label>
          Palkansaajan ikä{" "}
          <select value={wageAge} onChange={(e) => setWageAge(e.target.value)}>
            <option value="SSS">Kaikki iät</option>
            {["25-29", "30-34", "35-39", "40-44", "45-49", "50-54", "55-59", "60-64"].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label>
          Koulutusala{" "}
          <select value={field} onChange={(e) => setField(e.target.value)}>
            <option value="SSS">Kaikki alat</option>
            <option value="07">Tekniikan alat</option>
            <option value="09">Terveys- ja hyvinvointialat</option>
          </select>
        </label>
        <p>
          Sukupuolivalinta yllä koskee myös palkkataulukkoa. Ikä- ja koulutusalavalinnat ovat
          rajauksia, eivät tilastollinen vakiointi.
        </p>
        <div className="sp-recovery-scroll">
          <table>
            <caption>Kokoaikaisten palkansaajien ansiot, €/kk · 2024</caption>
            <thead>
              <tr>
                <th>Koulutusaste</th>
                <th>Lukumäärä</th>
                <th>Mediaani</th>
                <th>Keskiarvo</th>
              </tr>
            </thead>
            <tbody>
              {["SSS", "3", "4", "5", "6", "7", "8", "9_X"].map((code) => {
                const labels: Record<string, string> = {
                  SSS: "Yhteensä",
                  "3": "Toinen aste",
                  "4": "Erikoisammattikoulutusaste",
                  "5": "Alin korkea-aste",
                  "6": "Alempi korkeakouluaste",
                  "7": "Ylempi korkeakouluaste",
                  "8": "Tutkijakoulutusaste",
                  "9_X": "Ei perusasteen jälkeistä tutkintoa / tuntematon",
                };
                return (
                  <tr key={code}>
                    <th scope="row">{labels[code]}</th>
                    {["koko_psaaja_lkm", "koko_psaaja_kans_med", "koko_psaaja_kans_ka"].map(
                      (measure) => {
                        const r = data.wages.find(
                          (r) =>
                            r.education === code &&
                            r.age === wageAge &&
                            r.sex === sex &&
                            r.field === field &&
                            r.measure === measure,
                        );
                        return (
                          <td key={measure}>
                            {r?.value == null ? "ei julkaistua tietoa" : fmt(r.value)}
                          </td>
                        );
                      },
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p>
          Palkkarakenteen uudistus katkaisi vertailun vuoteen 2023.{" "}
          <a
            href="https://stat.fi/fi/julkaisu/cmht1opdr346i07vxwurx6clc"
            target="_blank"
            rel="noreferrer"
          >
            Tilastokeskuksen menetelmämuutos
          </a>
          . Ryhmämediaaneja ei yhdistetä laskemalla niiden keskiarvo.
        </p>
        <h3>Johtopäätöksen rajat</h3>
        <p>
          Tuloryhmien mediaanisuhteen kasvu on havaittu ero muuttuvissa ryhmissä. Se ei seuraa
          samoja henkilöitä eikä osoita, mikä osa erosta johtui työn saamisesta, työajasta, palkasta
          tai koulutuksesta.
        </p>
        <p>
          {data.notes.classification} {data.notes.universes}
        </p>
        <p>{data.notes.time}</p>
        <h3>Lähdetarkistus</h3>
        <p>
          Poimittu {data.retrieved_on}. {data.checks.source_cells} lähdesolua, joista{" "}
          {data.checks.suppressed_or_missing_cells} puuttuu tai on suojattu. Puuttuvia ei muuteta
          nolliksi. {data.checks.database_cells_independently_matched} aiemmin tallennettua tulo- ja
          väestölukua täsmää nykyiseen rajapintaan. Työllisyys käyttää edellisen arvion
          lähdeversiota.
        </p>
        {data.sources.map((s) => (
          <p key={s.name}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.name === "income" ? "Tulonjakotilasto 14k5" : "Palkkarakenne 15aw"}
            </a>{" "}
            · vastaustunniste <code>{s.response_sha256}</code>
          </p>
        ))}
      </details>
    </section>
  );
}
