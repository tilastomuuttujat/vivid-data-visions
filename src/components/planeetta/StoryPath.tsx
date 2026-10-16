import { revealAnalysis } from "./reveal-analysis";
import { useState } from "react";

type Act = {
  n: string;
  span: string;
  title: string;
  thesis: string;
  body: string;
  evidence: { label: string; theme: string; anchor?: string }[];
};

const ACTS: Act[] = [
  {
    n: "I",
    span: "1860–1950",
    title: "Pohjan valaminen",
    thesis: "Valtio luo tyhjästä omistuksen, teollisuuden ja perusrakenteet.",
    body: "Autonomian aikana Suomi rakentaa kansallisen talouden perustan: metsäteollisuus, koulutuslaitos ja valtion ohjaama industrialisaatio. Ratkaisut ovat onnistuneita — ja juuri siksi ne sementoituvat rakenteiksi, joita myöhemmät sukupolvet perivät muuttamattomina.",
    evidence: [
      { label: "Rakenteelliset valinnat", theme: "teema-aikajana" },
      { label: "Omistuksen pitkä polku", theme: "teema-teollisuus" },
    ],
  },
  {
    n: "II",
    span: "1960–1980",
    title: "Suuri lupaus ja optimointi",
    thesis: "Maaltamuutto, peruskoulu ja universaali hyvinvointivaltio — kone käy täysillä.",
    body: "Suomi tekee kahdessa vuosikymmenessä muutoksen, joka muualla vei sukupolvia. Teollinen rakennepolitiikka, sopimusyhteiskunta ja hyvinvointivaltion rakentaminen ovat aikansa voittajaratkaisuja. Mutta optimointi kaventaa liikkumatilaa: kun kaikki on viritetty yhteen malliin, mallin vanhetessa koko järjestelmä jähmettyy.",
    evidence: [
      { label: "Yhteinen aikajana", theme: "teema-aikajana" },
      { label: "Työn mahdollisuudet", theme: "teema-tyo", anchor: "timeline-work-opportunity" },
    ],
  },
  {
    n: "III",
    span: "1985–2000",
    title: "Markkinakäänne ja leikkauspöytä",
    thesis: "Rahoitus vapautuu, kupla puhkeaa ja vastuu siirtyy valtiolta yksilöille.",
    body: "1980-luvun loppu: luottolaajennus ja kasinotalous. 1990-luvun alku: pankkikriisi, massatyöttömyys ja leikkaukset. Ratkaisut tehdään kabineteissa ja konklaaveissa — parlamentaarinen keskustelu ohitetaan. 1990-luvun finanssioppi kirjoittaa uudet säännöt, joista tulee seuraavien vuosikymmenten toimeenpanolukko.",
    evidence: [
      { label: "Kriisien hoito", theme: "teema-talous", anchor: "timeline-crises" },
      {
        label: "Historiallinen käännekohta",
        theme: "teema-aikajana",
        anchor: "timeline-historical",
      },
    ],
  },
  {
    n: "IV",
    span: "2000–2025",
    title: "Tuottavuusparadoksi",
    thesis: "Pääoma ja asuntovarallisuus eriytyvät; syntyvyys ja hoivakyky sakkaavat.",
    body: "Työn tuottavuus nousee, mutta sen hedelmät jakautuvat yhä kapeammalle piirille. Asuntohinnat karkaavat kasvukeskuksissa, perheet lykkäävät lapsia, ja käyttämättömän työpotentiaalin kustannus — syrjäytyminen, hoiva, toimeentulo — alkaa ylittää optimoinnista saadun hyödyn. Eilisen voittajamalli on muuttunut tämän päivän vinoumaksi.",
    evidence: [
      { label: "Asuntovarallisuus", theme: "teema-tyo", anchor: "timeline-housing" },
      { label: "Hoivan kapasiteetti", theme: "teema-tyo", anchor: "timeline-care" },
      { label: "Perhepolitiikka", theme: "teema-tyo", anchor: "family-policy" },
    ],
  },
  {
    n: "V",
    span: "2025–2050",
    title: "Toimeenpanolukot vai uusi varaan rakentaminen?",
    thesis: "Mihin yhteiskuntasopimus nojaa, kun vanhat kantavat solmut murtuvat?",
    body: "Edessä on valinta: jatketaanko vanhojen rakenteiden laitostamista vai rakennetaanko uusi varaan? Keskeinen kysymys ei ole kenen varaan, vaan minkä varaan. Menneisyys toimii ohjausjärjestelmänä: viivekoneiston tunteminen kertoo, mitkä tämän päivän ratkaisuista palaavat 2040-luvulla ongelmina.",
    evidence: [
      { label: "Mekanismit ja palautesilmukat", theme: "teema-mekanismit" },
      { label: "Julkinen velka", theme: "teema-talous", anchor: "timeline-debt" },
    ],
  },
];

/** Viisinäytöksinen lukupolku: Suomen suuri kaari 1860–2050. */
export function StoryPath() {
  const [act, setAct] = useState(0);
  const a = ACTS[act]!;

  const go = (theme: string, anchor?: string) => {
    revealAnalysis(theme, anchor);
  };

  return (
    <section className="story" aria-label="Suomen suuri kaari">
      <div className="story-head">
        <p className="v-kicker">Metatarina · ohjattu lukupolku</p>
        <h2>
          Suomen suuri kaari <em>1860–2050</em>
        </h2>
        <p>
          Viisi näytöstä, yksi juoni: jokaisen aikakauden voittajaratkaisu palaa 20–30 vuoden
          viiveellä seuraavan aikakauden lukkona.
        </p>
      </div>
      <ol className="story-rail" role="tablist" aria-label="Näytökset">
        {ACTS.map((x, i) => (
          <li key={x.n}>
            <button
              role="tab"
              aria-selected={i === act}
              className={i === act ? "is-active" : ""}
              onClick={() => setAct(i)}
            >
              <span className="story-rail-n">{x.n}</span>
              <span className="story-rail-t">{x.title}</span>
              <span className="story-rail-s">{x.span}</span>
            </button>
          </li>
        ))}
      </ol>
      <article className="story-act" key={a.n}>
        <p className="v-kicker">
          Näytös {a.n} · {a.span}
        </p>
        <h3>{a.thesis}</h3>
        <p>{a.body}</p>
        <div className="story-evidence">
          <span>Evidenssi tälle käännekohdalle:</span>
          {a.evidence.map((e) => (
            <button key={e.label} onClick={() => go(e.theme, e.anchor)}>
              {e.label} ↓
            </button>
          ))}
        </div>
        <div className="story-nav">
          <button disabled={act === 0} onClick={() => setAct(act - 1)}>
            ← Edellinen näytös
          </button>
          <button disabled={act === ACTS.length - 1} onClick={() => setAct(act + 1)}>
            Seuraava näytös →
          </button>
        </div>
      </article>
    </section>
  );
}
