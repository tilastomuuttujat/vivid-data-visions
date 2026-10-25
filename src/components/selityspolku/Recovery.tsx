import { actual, change, fmt, models, signed } from "./model";
import { fiscalPoint } from "./Fiscal";

const chapters = [
  { year: 1990, label: "1. Ennen pudotusta" },
  { year: 1993, label: "2. Laman syvyydessä" },
  { year: 2000, label: "3. Toipumisen erot" },
];
function recovery(id: string) {
  const base = actual(id, 1990);
  if (base === null) return null;
  for (let year = 1994; year <= 2000; year++) {
    const value = actual(id, year);
    if (value !== null && value >= base) return year;
  }
  return null;
}
export function Recovery({ year, onYear }: { year: number; onYear: (year: number) => void }) {
  const production = change("production_components", 2000)!;
  const employment = change("age_structure", 2000)!;
  const fiscal = fiscalPoint(2000)!;
  return (
    <section className="sp-recovery" aria-label="Lama ja toipuminen 1985–2000">
      <p className="sp-eyebrow">YKSI MURROS · NELJÄ NÄKÖKULMAA</p>
      <h2>Tuotanto palautui. Työllisten osuus jäi alemmaksi.</h2>
      <p>
        Vuonna 2000 tuotanto asukasta kohti oli {fmt(production)} % vuoden 1990 yläpuolella, mutta
        työllisten osuus koko väestöstä oli {fmt(Math.abs(employment))} prosenttiyksikköä alempi.
        Kasvun ja työn käytön toipuminen olivat eri asioita.
      </p>
      <div className="sp-years" role="group" aria-label="Murroskertomuksen luvut">
        {chapters.map((c) => (
          <button key={c.year} aria-pressed={year === c.year} onClick={() => onYear(c.year)}>
            {c.label} · {c.year}
          </button>
        ))}
      </div>
      <details>
        <summary>Mihin päätelmä perustuu?</summary>
        <div className="sp-recovery-scroll">
          <table>
            <caption>Muutos vuodesta 1990 · eri mittareita ei lasketa yhteen</caption>
            <thead>
              <tr>
                <th scope="col">Mittari</th>
                <th scope="col">1993</th>
                <th scope="col">2000</th>
                <th scope="col">Paluu 1990-tasolle</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id}>
                  <th scope="row">{m.short}</th>
                  {[1993, 2000].map((y) => (
                    <td key={y}>
                      {signed(change(m.id, y)!)} {m.id === "age_structure" ? "%-yks." : "%"}
                    </td>
                  ))}
                  <td>{recovery(m.id) ?? "Ei vuosina 1994–2000"}</td>
                </tr>
              ))}
              <tr>
                <th scope="row">Julkisyhteisöjen tasapaino / BKT</th>
                {[1993, 2000].map((y) => (
                  <td key={y}>{signed(fiscalPoint(y)!.change_pp!)} %-yks.</td>
                ))}
                <td>
                  {Array.from({ length: 7 }, (_, i) => 1994 + i).find(
                    (y) => fiscalPoint(y)!.change_pp! >= 0,
                  ) ?? "Ei vuosina 1994–2000"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Paluu tarkoittaa ensimmäistä havaittua vuotta 1994–2000, jolloin mittari saavutti vuoden
          1990 tason. Se ei tarkoita pysyvää toipumista tai paluuta kriisiä edeltäneelle
          kasvutrendille. Julkinen tasapaino oli vuonna 2000 {signed(fiscal.balance_pct!)} %
          BKT:sta.
        </p>
        <p>
          Työllisten osuus koskee koko väestöä, ei työikäisten työllisyysastetta. Tuotanto ja tulot
          ovat asukaskohtaisia keskiarvoja; niistä ei voi päätellä yksittäisen kotitalouden tai
          väestöryhmän toipumista.
        </p>
      </details>
      <details>
        <summary>Miten muutos välittyi — ja mikä jää avoimeksi?</summary>
        <ol>
          <li>
            <strong>Tuotanto ja työ:</strong> tuotannon osittelu erottaa tuottavuuden, työtunnit
            työllistä kohti ja työllisten suhteen väestöön. Tämä näyttää kasvun laskennalliset
            lähteet.
          </li>
          <li>
            <strong>Työ ja toimeentulo:</strong> reaalitulo sisältää myös verot, tulonsiirrot ja
            muut tulolähteet. Sen eritahtisuus tuotannon kanssa ei yksin osoita sosiaaliturvan
            vaikutuksen suuruutta.
          </li>
          <li>
            <strong>Yhteinen vastuu:</strong> julkisen tasapainon osittelu näyttää tulo- ja
            menoerien sekä BKT-nimittäjän osuudet. Se ei erottele päätöksiä, suhdannetta ja
            palvelutarvetta.
          </li>
        </ol>
        <p>
          Mahdollisia selityksiä ovat työn kysynnän heikkeneminen, tuotannon rakenteen ja
          tuottavuuden muutos sekä väestörakenne. Niitä ei aseteta tämän vertailun perusteella
          syyjärjestykseen. Alla oleva historiallinen lähdeosio auttaa tutkimaan kriisin taustaa;
          neljän mallin osuudet eivät muodosta yhtä syyvaikutusten summaa.
        </p>
      </details>
    </section>
  );
}
