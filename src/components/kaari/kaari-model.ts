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

/** Editorial sub-streams (5–6 per force), shown only when a force is focused. Levels are interpretive readings, never measured values. */
export type SubLine = { id: string; parent: string; label: string; note: string; points: [number, number][] };

export const SUBLINES: SubLine[] = [
  { id: "metsa", parent: "tuotanto", label: "Metsä ja perusteollisuus", note: "Sahat, paperi ja metalli kantoivat vientiä vuosisadan.",
    points: [[1860, 0.12], [1880, 0.35], [1920, 0.4], [1950, 0.6], [1975, 0.7], [1992, 0.55], [2008, 0.5], [2026, 0.42], [2050, 0.4]] },
  { id: "ict", parent: "tuotanto", label: "Korkea teknologia ja ICT", note: "Nokia-klusteri nousi nopeasti ja romahti yhtä nopeasti.",
    points: [[1860, 0.02], [1960, 0.05], [1985, 0.15], [1995, 0.4], [2007, 0.92], [2013, 0.35], [2026, 0.45], [2050, 0.55]] },
  { id: "paaoma", parent: "tuotanto", label: "Pääomat ja investointikyky", note: "Säännelty pääoma, vapautus 1986, sen jälkeen ohut kotimainen omistus.",
    points: [[1860, 0.1], [1918, 0.2], [1950, 0.4], [1975, 0.55], [1989, 0.75], [1993, 0.3], [2007, 0.55], [2026, 0.4], [2050, 0.45]] },
  { id: "tki", parent: "tuotanto", label: "Koulutustaso ja T&K", note: "Korkeakoulutus massoittui, T&K-panostus huipussaan 2000-luvulla, leikkaukset 2010-luvulla.",
    points: [[1860, 0.05], [1920, 0.15], [1960, 0.3], [1985, 0.55], [2000, 0.85], [2009, 0.88], [2015, 0.6], [2026, 0.62], [2050, 0.65]] },
  { id: "tuottavuus", parent: "tuotanto", label: "Työn tuottavuus", note: "Nopea kasvu sotien jälkeen, pysähdys vuoden 2008 jälkeen.",
    points: [[1860, 0.1], [1900, 0.2], [1945, 0.3], [1970, 0.6], [1990, 0.72], [2007, 0.85], [2012, 0.55], [2026, 0.5], [2050, 0.55]] },
  { id: "energia", parent: "tuotanto", label: "Energia ja omavaraisuus", note: "Puusta vesi- ja ydinvoimaan, tuontiriippuvuudesta uusiutuvaan sähköön.",
    points: [[1860, 0.5], [1920, 0.4], [1950, 0.45], [1973, 0.3], [1980, 0.6], [2008, 0.55], [2022, 0.4], [2026, 0.65], [2050, 0.75]] },
  { id: "perusturva", parent: "turva", label: "Perusturva ja toimeentulo", note: "Köyhäinhoidosta universaaliin turvaan ja laman jälkeiseen kiristykseen.",
    points: [[1860, 0.05], [1922, 0.2], [1948, 0.45], [1975, 0.8], [1990, 0.82], [1996, 0.58], [2026, 0.45], [2050, 0.4]] },
  { id: "elake", parent: "turva", label: "Työeläkejärjestelmä", note: "TEL 1961 rakensi rahastot, jotka ovat yhä vahvin puskuri.",
    points: [[1860, 0.02], [1937, 0.15], [1961, 0.45], [1980, 0.75], [2005, 0.85], [2026, 0.75], [2050, 0.62]] },
  { id: "terveys", parent: "turva", label: "Terveydenhuolto ja hoiva", note: "Keskussairaalat, kansanterveyslaki 1972, hyvinvointialueet 2023 – lupaus ja rahoitus erkanevat.",
    points: [[1860, 0.05], [1920, 0.2], [1955, 0.45], [1972, 0.78], [1990, 0.85], [1994, 0.62], [2010, 0.6], [2026, 0.45], [2050, 0.4]] },
  { id: "perhe", parent: "turva", label: "Perhe- ja lapsipolitiikka", note: "Neuvolat 1944, lapsilisä 1948, päivähoitolaki 1973; 1990-luvulla leikkauksia.",
    points: [[1860, 0.03], [1938, 0.2], [1948, 0.5], [1973, 0.75], [1990, 0.82], [1994, 0.6], [2026, 0.55], [2050, 0.5]] },
  { id: "koulu", parent: "turva", label: "Peruskoulu ja sivistys", note: "Kansakoulusta peruskouluun 1968–1977, PISA-huippu ja oppimistulosten lasku.",
    points: [[1860, 0.1], [1866, 0.2], [1921, 0.4], [1970, 0.7], [2000, 0.9], [2006, 0.92], [2026, 0.6], [2050, 0.55]] },
  { id: "sopiminen", parent: "turva", label: "Työmarkkinamalli ja sopiminen", note: "Tammikuun kihlaus 1940, tupo 1968 alkaen, keskitetyn sopimisen murtuminen.",
    points: [[1860, 0.05], [1918, 0.1], [1940, 0.35], [1968, 0.7], [1990, 0.75], [2007, 0.6], [2016, 0.4], [2026, 0.35], [2050, 0.35]] },
  { id: "syntyvyys", parent: "kantokyky", label: "Syntyvyys", note: "Suuret ikäluokat, pitkä vakaa taso ja jyrkkä pudotus 2010 jälkeen.",
    points: [[1860, 0.55], [1868, 0.3], [1920, 0.5], [1947, 0.9], [1970, 0.55], [1990, 0.55], [2010, 0.5], [2026, 0.2], [2050, 0.18]] },
  { id: "huoltosuhde", parent: "kantokyky", label: "Ikärakenne ja huoltosuhde", note: "Nuoresta työikäisestä maasta Euroopan vanhimpien joukkoon.",
    points: [[1860, 0.5], [1920, 0.55], [1950, 0.6], [1980, 0.8], [2008, 0.72], [2026, 0.4], [2050, 0.28]] },
  { id: "velka", parent: "kantokyky", label: "Julkinen talous ja velka", note: "Korkea arvo = liikkumavaraa. Lama ja 2008 jälkeinen velkaura kaventavat sitä.",
    points: [[1860, 0.4], [1918, 0.3], [1945, 0.25], [1960, 0.7], [1990, 0.75], [1994, 0.35], [2008, 0.65], [2026, 0.32], [2050, 0.25]] },
  { id: "alueet", parent: "kantokyky", label: "Aluerakenne ja muuttoliike", note: "Hajautettu asutus, suuri muutto ja Ruotsiin lähtö, kasvukeskusten vetovoima.",
    points: [[1860, 0.5], [1950, 0.75], [1965, 0.7], [1975, 0.45], [2000, 0.35], [2026, 0.25], [2050, 0.2]] },
  { id: "maahanmuutto", parent: "kantokyky", label: "Maahanmuutto ja kansainvälistyminen", note: "Suljetusta maasta hitaasti kasvavaan maahanmuuttoon ja osaajatarpeeseen.",
    points: [[1860, 0.1], [1950, 0.08], [1990, 0.15], [2008, 0.3], [2026, 0.45], [2050, 0.55]] },
];
