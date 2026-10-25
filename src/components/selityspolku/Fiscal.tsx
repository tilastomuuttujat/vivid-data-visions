import { useState } from "react";
import snapshot from "@/data/research/fiscal-model.json";
import { fmt, signed, smooth } from "./model";
export const fiscalData = snapshot;
export function fiscalPoint(year: number) {
  return fiscalData.points.find(
    (p) => p.year === year && p.status === "computed" && p.balance_pct !== null,
  );
}
const x = (year: number) => 60 + (year - 1850) * 4.8;
export function FiscalChart({
  year,
  active,
  onOpen,
}: {
  year: number;
  active: boolean;
  onOpen: () => void;
}) {
  const [flows, setFlows] = useState(false);
  const rows = fiscalData.points.filter((p) => p.status === "computed" && p.balance_pct !== null);
  const p = fiscalPoint(year);
  const lo = flows ? 0 : -15,
    hi = flows ? 75 : 10,
    y = (v: number) => 110 - ((v - lo) / (hi - lo)) * 90;
  const line = (key: "balance_pct" | "revenue_pct" | "expenditure_pct") =>
    smooth(rows.map((p) => ({ x: x(p.year), y: y(p[key]!) })));
  return (
    <article className={`sp-chart ${active ? "sp-active" : ""}`}>
      <button className="sp-chart-title" onClick={onOpen}>
        4. Julkinen tasapaino
      </button>
      <span>
        {p ? `${signed(p.balance_pct!)} % BKT:sta` : "ei laskettua havaintoa"} · julkisyhteisöt
        yhteensä
      </span>
      <div className="sp-fiscal-toggle">
        <label>
          <input type="checkbox" checked={flows} onChange={(e) => setFlows(e.target.checked)} />{" "}
          Näytä tulot ja menot erikseen
        </label>
      </div>
      <svg
        viewBox="0 0 1080 135"
        role="img"
        aria-label={`Julkisyhteisöjen ${flows ? "tulot ja menot" : "ylijäämä tai alijäämä"} suhteessa BKT:hen 1975–2025, aikajanalla 1850–2050. Vuosi ${year}.`}
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
        {!flows && (
          <line
            x1={x(1975)}
            x2={x(2025)}
            y1={y(0)}
            y2={y(0)}
            stroke="#6b675e"
            strokeDasharray="4 4"
          />
        )}
        {flows ? (
          <>
            <path d={line("revenue_pct")} fill="none" stroke="#06716c" strokeWidth="2.5" />
            <path
              d={line("expenditure_pct")}
              fill="none"
              stroke="#b44134"
              strokeWidth="2.5"
              strokeDasharray="6 3"
            />
          </>
        ) : (
          <path d={line("balance_pct")} fill="none" stroke="#315a83" strokeWidth="2.5" />
        )}
        <line x1={x(year)} x2={x(year)} y1="10" y2="113" stroke="#b44134" />
        {p && !flows && <circle cx={x(year)} cy={y(p.balance_pct!)} r="4" fill="#315a83" />}
        <text x="65" y="130">
          1850
        </text>
        <text x="1020" y="130" textAnchor="end">
          2050
        </text>
      </svg>
      <p>
        {flows
          ? "Vihreä yhtenäinen viiva: tulot. Punainen katkoviiva: menot. Molemmat % BKT:sta."
          : "Yhtenäinen viiva: tulot − menot suhteessa BKT:hen. Nollan alla alijäämä, yllä ylijäämä."}{" "}
        S13 sisältää myös työeläkelaitokset ja muut sosiaaliturvarahastot. Ei valtion budjettivaje
        eikä velan muutos.
      </p>
    </article>
  );
}
export function FiscalDetails({ year }: { year: number }) {
  const p = fiscalPoint(year),
    base = fiscalPoint(1990)!;
  if (!p)
    return (
      <p>
        {year > 2025
          ? "Julkisen talouden skenaariota ei ole laskettu vuosille 2026–2050."
          : "Julkisen talouden yhtenäinen laskentapohja kattaa vuodet 1975–2025. Aikaisempia eri tavoin rajattuja historiallisia sarjoja ei ole liitetty tähän käyrään."}
      </p>
    );
  const max = Math.max(0.1, ...p.parts.map((v) => Math.abs(v.value_pp)));
  const parts = [...p.parts].sort((a, b) => Math.abs(b.value_pp) - Math.abs(a.value_pp));
  return (
    <>
      <p>
        Vuonna {year} julkisyhteisöjen tasapaino oli{" "}
        <strong>{signed(p.balance_pct!)} % BKT:sta</strong>. Vuonna 1990 se oli{" "}
        {signed(base.balance_pct!)} %. Muutos:{" "}
        <strong>{signed(p.change_pp!)} prosenttiyksikköä</strong>.
      </p>
      <div className="sp-fiscal-totals">
        <span>
          Tulot <strong>{fmt(p.revenue_pct!)} % BKT:sta</strong>
        </span>
        <span>
          Menot <strong>{fmt(p.expenditure_pct!)} % BKT:sta</strong>
        </span>
        <span>
          Erotus <strong>{signed(p.balance_million_euros! / 1000)} mrd. €</strong>
        </span>
      </div>
      <p>
        Alla erien muutoksen laskennallinen osuus tasapainon muutoksesta suhteessa vuoteen 1990.{" "}
        <strong>Plus vahvistaa ja miinus heikentää rahoitustasapainoa.</strong> Tämä ei arvioi menon
        yhteiskunnallista hyötyä.
      </p>
      <table className="sp-fiscal-table">
        <caption>Tasapainon muutos, prosenttiyksikköä BKT:sta</caption>
        <thead>
          <tr>
            <th scope="col">Erä</th>
            <th scope="col">Osuus muutoksesta</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((v) => (
            <tr key={v.key}>
              <th scope="row">
                {v.label}
                <div className="sp-fiscal-bar" aria-hidden="true">
                  <span
                    style={{
                      left: v.value_pp >= 0 ? "50%" : `${50 - (Math.abs(v.value_pp) / max) * 48}%`,
                      width: `${(Math.abs(v.value_pp) / max) * 48}%`,
                      background: v.value_pp >= 0 ? "#06716c" : "#b44134",
                    }}
                  />
                </div>
              </th>
              <td>{signed(v.value_pp)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Yhteensä</th>
            <td>{signed(p.change_pp!)}</td>
          </tr>
        </tfoot>
      </table>
      <p>
        Rahamääräiset sosiaalietuudet sisältävät myös eläkkeitä. Niiden kasvu ei siis ole
        työttömyyden erillisvaikutus. Palkansaajakorvaukset ja ostot eivät puolestaan mittaa suoraan
        palvelutarvetta tai laatua. Muihin menoihin sisältyy esimerkiksi investointeja ja
        pääomansiirtoja.
      </p>
      <details>
        <summary>Mikä on päätösten ja mikä suhdanteen vaikutusta?</summary>
        <p>
          Verokertymässä sekoittuvat veropohja, verokannat ja maksujen ajoitus. Menoissa sekoittuvat
          tarpeet, etuusehdot, indeksit ja palveluratkaisut. Malli ei nimeä näitä syiksi eikä anna
          yksittäiselle puolueelle tai väestöryhmälle vaikutusosuutta. Niiden erottaminen vaatii
          erilliset veropohjat, sääntömuutokset ja tutkimusasetelman.
        </p>
        <p>
          BKT:n nimittäjävaikutus erotetaan omaksi rivikseen. Erien euromuutokset ja nimittäjän
          muutos jaetaan symmetrisellä kahden tekijän osittelulla; osat täsmäävät kokonaisuuteen.
          Euromäärät ovat käyvin hinnoin, joten osittelussa näkyy myös hintojen muutos. Muut menot
          ja muut tulot ovat nimettyjen erien ulkopuolinen kirjanpidollinen osa, eivät
          tunnistamattoman syyn vaikutus.
        </p>
      </details>
      <details>
        <summary>Lähdeversio ja laskennan tarkistus</summary>
        <p>
          Tilastokeskus <a href={fiscalData.sources[0]!.url}>15ah</a> ja{" "}
          <a href={fiscalData.sources[1]!.url}>15ai</a>, tilastoversio {fiscalData.source_vintage}.
          Julkaisutunniste {fiscalData.release_id}. Vuosien 2024–2025 tiedot ovat ennakollisia.
          Sulautettuja tuloja ja menoja ei summata osasektoreista uudelleen.
        </p>
        <p>
          Tulot − menot tarkistetaan erilliseen B9-sarjaan. Pyöristysero valittuna vuonna{" "}
          {p.source_identity_residual_million ?? 0} miljoonaa euroa. Laskenta käyttää tulojen ja
          menojen erotusta, ei EDP-alijäämää. Kolmen muun mallin rahavirtoja ei summata tähän.
        </p>
      </details>
    </>
  );
}
