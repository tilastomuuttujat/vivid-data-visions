import { evidence, type Episode } from "@/components/murrokset/evidence-model";

export const YEAR_MIN = 1860;
export const YEAR_MAX = 2050;
export const NOW = 2026;

/** Three interpretive force lines. Levels (0–1) are editorial readings of direction, never measured values. */
export type ForceLine = { id: string; label: string; tone: string; question: string; points: [number, number][] };

export const LINES: ForceLine[] = [
  {
    id: "tuotanto",
    label: "Tuotanto ja osaaminen",
    tone: "var(--k-gold)",
    question: "Millä Suomi tuottaa lisäarvoa?",
    points: [[1860, 0.15], [1900, 0.3], [1918, 0.22], [1950, 0.42], [1975, 0.62], [1992, 0.5], [2007, 0.86], [2015, 0.6], [2026, 0.58], [2050, 0.62]],
  },
  {
    id: "turva",
    label: "Yhteinen turva ja sopimus",
    tone: "var(--k-teal)",
    question: "Kuka kantaa riskin, kun jokin pettää?",
    points: [[1860, 0.1], [1868, 0.05], [1921, 0.3], [1950, 0.5], [1972, 0.85], [1990, 0.82], [1995, 0.6], [2010, 0.58], [2026, 0.48], [2050, 0.42]],
  },
  {
    id: "kantokyky",
    label: "Väestö ja kantokyky",
    tone: "var(--k-rose)",
    question: "Riittääkö työikäisiä kantamaan lupaukset?",
    points: [[1860, 0.35], [1868, 0.2], [1918, 0.35], [1950, 0.75], [1970, 0.8], [1990, 0.7], [2010, 0.55], [2026, 0.35], [2050, 0.22]],
  },
];

export type Turn = {
  id: string;
  year: number;
  title: string;
  happened: string;
  mechanism: string;
  later: string;
  lines: string[];
  episode: string;
};

/** Seven turning points; each is tied to an exported evidence episode by code. */
export const TURNS: Turn[] = [
  { id: "t1866", year: 1868, title: "Nälkävuodet", happened: "Katovuodet ja kuolleisuuspiikki 1866–1868.", mechanism: "Valtio ja kunnat joutuvat ottamaan vastuun toimeentulon häiriöstä: kunnallis- ja kansakouluasetukset luovat paikallisen hallinnon pohjan.", later: "Paikallinen itsehallinto ja koulu tulevat suomalaisen palvelumallin selkärangaksi.", lines: ["turva", "kantokyky"], episode: "famine_1866_1870" },
  { id: "t1918", year: 1918, title: "Sota ja eheytys", happened: "Sisällissota, väestö- ja tuotantoshokki.", mechanism: "Torpparivapautus ja maareformi laajentavat omistajuutta: ristiriita puretaan antamalla osuus.", later: "Laaja pienomistus ja luottamus instituutioihin kantavat sotien ja jälleenrakennuksen läpi.", lines: ["turva", "tuotanto"], episode: "crisis_1917_1919" },
  { id: "t1930", year: 1932, title: "1930-luvun lama", happened: "Syntyvyys laskee, tulot heikkenevät.", mechanism: "Ensimmäiset universaalin turvan rakennuspalikat: lastensuojelu, äitiysavustus, kansaneläke.", later: "Etuudet säädetään ennen kuin toimeenpanokyky on olemassa – laki ei yksin takaa suojaa.", lines: ["turva", "kantokyky"], episode: "depression_1930_1934" },
  { id: "t1970", year: 1970, title: "Suuri rakennemuutos", happened: "Maaseudulta kaupunkeihin ja Ruotsiin, peruskoulu ja työeläke.", mechanism: "Hyvinvointivaltion arkkitehtuuri mitoitetaan nuorelle, kasvavalle väestölle.", later: "Sama mitoitus on nykyisen kestävyysvajeen juuri – rakenne ei jousta väestön vanhetessa.", lines: ["turva", "kantokyky", "tuotanto"], episode: "structural_1965_1974" },
  { id: "t1991", year: 1991, title: "Lama ja riskin uusjako", happened: "Pankkikriisi, joukkotyöttömyys, tuotanto romahtaa.", mechanism: "Tuottavuus nousee, mutta palkkasumma ja kotitaloustulot erkaantuvat siitä; riski siirtyy kotitalouksille.", later: "Pysyvä leikkauslogiikka ja velkapelko; luottamus yhteiseen turvaan ohenee.", lines: ["turva", "tuotanto"], episode: "recession_1990_1994" },
  { id: "t2008", year: 2008, title: "Finanssikriisi ja Nokian jälkeen", happened: "Tuotanto putoaa, kotitaloustuloja suojaavat puskurit.", mechanism: "Turvaverkko vakauttaa kulutuksen, mutta yhden klusterin varaan rakennettu tuottavuus ei palaa.", later: "Vuosikymmenen tuottavuuden pysähdys ja kasvava julkinen velka.", lines: ["tuotanto", "kantokyky"], episode: "financial_2008_2009" },
  { id: "t2022", year: 2022, title: "Hintashokki ja turvallisuusmurros", happened: "Energia ja hinnat nousevat, ostovoima laskee.", mechanism: "Ulkoinen shokki osuu supistuvaan työvoimaan ja jo valmiiksi kireään julkiseen talouteen.", later: "Kysymys siirtyy siitä mitä luvataan siihen, minkä varaan lupaukset voidaan rakentaa.", lines: ["kantokyky", "turva"], episode: "price_shock_2022_2023" },
];

/** Line-specific turning points shown when one force is focused. Years are editorial anchors; episode "" = no evidence panel. */
const lt = (line: string, year: number, title: string, happened: string, mechanism: string, later: string): Turn =>
  ({ id: `${line}-${year}`, year, title, happened, mechanism, later, lines: [line], episode: "" });

export const LINE_TURNS: Record<string, Turn[]> = {
  tuotanto: [
    lt("tuotanto", 1870, "Höyrysahat ja metsäteollisuus", "Sahateollisuus vapautetaan, vienti kasvaa.", "Metsästä tulee viennin ja pääoman kivijalka.", "Raaka-ainevetoinen vientirakenne kantaa vuosisadan."),
    lt("tuotanto", 1944, "Sotakorvausteollisuus", "Sotakorvaukset pakottavat konepajateollisuuden kasvuun.", "Metalli- ja konepajaosaaminen syntyy nopeasti valtion ohjauksessa.", "Teollinen pohja kantaa jälleenrakennuksen ja idänkaupan."),
    lt("tuotanto", 1991, "Laman tuotantoromahdus", "Idänkauppa loppuu, konkursseja ja joukkotyöttömyyttä.", "Devalvaatiot ja karsinta nostavat tuottavuutta rajusti.", "Tuotanto keskittyy harvoihin vientiklustereihin."),
    lt("tuotanto", 2007, "Nokian huippu", "ICT-klusteri tuottaa ison osan tuottavuuskasvusta.", "Kasvu nojaa yhteen klusteriin.", "Haavoittuvuus paljastuu, kun klusteri romahtaa."),
    lt("tuotanto", 2015, "Tuottavuuskuoppa", "Tuotanto ei palaa vuoden 2008 tasolle.", "Uutta laajaa kasvualaa ei synny Nokian tilalle.", "Pysähtynyt tuottavuus kiristää julkista taloutta."),
  ],
  turva: [
    lt("turva", 1921, "Torpparivapautus ja oppivelvollisuus", "Maareformi ja oppivelvollisuus sodan jälkeen.", "Ristiriitaa puretaan laajentamalla omistusta ja sivistystä.", "Laaja luottamus instituutioihin."),
    lt("turva", 1937, "Kansaneläke", "Ensimmäinen yleinen eläkejärjestelmä.", "Turva alkaa siirtyä perheeltä valtiolle.", "Universaalin turvan malli juurtuu."),
    lt("turva", 1966, "Hyvinvointivaltion lakipaketti", "TEL 1961, peruskoulu 1968, kansanterveyslaki 1972.", "Laaja turva mitoitetaan kasvavalle väestölle.", "Rakenne on tämän päivän kestävyysvajeen juuri."),
    lt("turva", 1993, "Laman leikkauslogiikka", "Perheiltä, kouluilta ja mielenterveydeltä leikataan.", "Riski siirtyy kotitalouksille.", "Pitkät seuraukset näkyvät palvelutarpeena."),
    lt("turva", 2023, "Hyvinvointialueet", "Sote siirtyy kunnilta alueille.", "Rahoitus valtiolta, vastuu alueilla.", "Lupausten ja rahoituksen kuilu tulee näkyviin."),
  ],
  kantokyky: [
    lt("kantokyky", 1868, "Nälkävuodet", "Kuolleisuuspiikki ja väestökato.", "Väestö haavoittuu toimeentulon häiriöille.", "Paikallinen vastuu toimeentulosta vahvistuu."),
    lt("kantokyky", 1947, "Suuret ikäluokat", "Ennätyksellinen syntyvyys sodan jälkeen.", "Poikkeuksellisen suuri työvoima 1970–2010.", "Sama ikäluokka eläköityy 2010-luvulla."),
    lt("kantokyky", 1970, "Muutto Ruotsiin ja kaupunkeihin", "Maaseutu tyhjenee nopeasti.", "Työvoima keskittyy kasvukeskuksiin.", "Alueellinen kantokyky eriytyy."),
    lt("kantokyky", 2010, "Syntyvyys kääntyy laskuun", "Syntyvyys alkaa pudota ja eläköityminen kiihtyy.", "Huoltosuhde heikkenee kahdesta suunnasta.", "Työikäisiä on yhä vähemmän lupausten kantajiksi."),
    lt("kantokyky", 2024, "Huoltosuhteen kiristyminen", "Hoivan tarve kasvaa, työikäiset vähenevät.", "Palvelut ja verotulot ajautuvat ristiin.", "Kysymys: minkä varaan lupaukset rakennetaan."),
  ],
};

export const ERAS = [
  { from: 1860, to: 1955, label: "Perustan rakentaminen" },
  { from: 1955, to: 1987, label: "Kultainen arkkitehtuuri" },
  { from: 1987, to: NOW, label: "Uusjako ja lukot" },
  { from: NOW, to: YEAR_MAX, label: "Skenaario" },
];

export function episodeFor(turn: Turn): Episode | undefined {
  return evidence.episodes.find((e) => e.code === turn.episode);
}

export function levelAt(line: ForceLine, year: number): number {
  const p = line.points;
  if (year <= p[0]![0]) return p[0]![1];
  for (let i = 1; i < p.length; i++) {
    const [x1, y1] = p[i]!;
    const [x0, y0] = p[i - 1]!;
    if (year <= x1) return y0 + ((y1 - y0) * (year - x0)) / (x1 - x0);
  }
  return p.at(-1)![1];
}
