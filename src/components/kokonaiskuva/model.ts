import snapshot from "@/data/murrosmatriisi-evidence.json";
export const MIN = 1850,
  MAX = 2050,
  FUTURE = 2025,
  BASE = 1975;
export type Point = { year: number; value: number };
export const seriesDefinitions = [
  { key: "fi.statfin15ai.total.b1gmh.b60cef008d", label: "Tuotanto / asukas", color: "#f2f0e7" },
  {
    key: "fi.atlas1960.household_disposable_real_per_capita",
    label: "Kotitalouksien reaalitulo / asukas",
    color: "#eab875",
  },
] as const;
export function observations(key: string): Point[] {
  const rows = snapshot.observations.filter(
    (o) =>
      o.series_key === key &&
      o.group_key === "FI" &&
      o.is_published &&
      o.year <= FUTURE &&
      Number.isFinite(o.value),
  );
  const unique = new Map<number, number>();
  for (const o of rows) {
    if (unique.has(o.year) && unique.get(o.year) !== o.value)
      throw new Error("Ristiriitainen lähdehavainto");
    unique.set(o.year, o.value);
  }
  return [...unique].map(([year, value]) => ({ year, value })).sort((a, b) => a.year - b.year);
}
export function index(points: Point[], baseline = BASE): Point[] {
  const base = points.find((p) => p.year === baseline);
  if (!base || base.value <= 0) throw new Error("Yhteinen vertailuvuosi puuttuu");
  return points.map((p) => ({ year: p.year, value: (100 * p.value) / base.value }));
}
export function segments(points: Point[]) {
  const out: Point[][] = [];
  for (const p of points) {
    const last = out.at(-1);
    if (!last || p.year - last.at(-1)!.year > 1) out.push([p]);
    else last.push(p);
  }
  return out;
}
export const scenarios = [
  {
    id: "shared",
    label: "Kasvu välittyy",
    growth: [0.015, 0.015],
    text: "Tuotanto ja kotitalouksien reaalitulo kasvavat molemmat 1,5 % vuodessa.",
  },
  {
    id: "diverge",
    label: "Kasvu eriytyy",
    growth: [0.02, 0.005],
    text: "Tuotanto kasvaa 2 % ja kotitalouksien reaalitulo 0,5 % vuodessa.",
  },
  {
    id: "stagnate",
    label: "Kasvu pysähtyy",
    growth: [0, 0],
    text: "Kummankin reaalinen taso säilyy vuoden 2025 tasolla.",
  },
] as const;
export function project(last: Point, rate: number): Point[] {
  if (last.year !== FUTURE) throw new Error("Skenaarion lähtövuoden pitää olla 2025");
  return Array.from({ length: MAX - FUTURE + 1 }, (_, i) => ({
    year: FUTURE + i,
    value: last.value * (1 + rate) ** i,
  }));
}
export const national = seriesDefinitions.map((s) => ({
  ...s,
  points: index(observations(s.key)),
  rawPoints: observations(s.key),
  source: snapshot.series.find((v) => v.series_key === s.key)!,
}));
export type Era = {
  start: number;
  end: number;
  label: string;
  title: string;
  whole: string;
  chain: [string, string, string, string];
  counter: string;
  limit: string;
  episodes: string[];
};
export const eras: Era[] = [
  {
    start: 1850,
    end: 1917,
    label: "1850–1917",
    title: "Toimeentulo on lähellä tuotannon riskiä",
    whole:
      "Maatalousvaltaisen yhteiskunnan toimeentulo on altis sadon ja paikallisen työn häiriöille. Teollistuminen ja koulutus avaavat vähitellen uusia väyliä.",
    chain: [
      "Sadon, työn ja tuotannon häiriö",
      "Perheen toimeentulo ja paikallinen avuntarve",
      "Kuntien, yhteisöjen ja valtion vastuun muutos",
      "Koulutus ja tuotannon monipuolistuminen voivat vähentää haavoittuvuutta",
    ],
    counter:
      "Teollistuminen ja keskinäinen apu voivat vahvistaa toimeentuloa samaan aikaan, kun vanhat elinkeinot horjuvat.",
    limit:
      "Vuosien 1850–1860 tuotantohavainnot ja kotitalouksien reaalitulon pitkä sarja puuttuvat tästä poiminnasta. Nälkävuodet eivät selitä yksin koko jaksoa.",
    episodes: ["famine_1866_1870"],
  },
  {
    start: 1918,
    end: 1945,
    label: "1918–1945",
    title: "Kriisien jälkeen ratkaistaan, kenellä on paikka yhteiskunnassa",
    whole:
      "Sota, lama ja toimeentulon turvattomuus kohtaavat omistuksen ja kansalaisoikeuksien uudistukset. Tuotannon elpyminen ja yhteiskunnan eheytyminen eivät ole sama asia.",
    chain: [
      "Sota, talouden kriisi ja omistuksen uudistus",
      "Työn, maan ja toimeentulon mahdollisuudet jakautuvat uudelleen",
      "Julkinen valta rakentaa turvaa ja kantaa sodan kustannuksia",
      "Osallistumisen mahdollisuudet voivat tukea tuotantoa ja yhteiskunnallista vakautta",
    ],
    counter:
      "Omistuksen laajeneminen ei poista kaikkien ryhmien turvattomuutta. Sodat myös katkaisevat rauhanajan kehitystä.",
    limit:
      "Sarjassa on aukko 1940–1959. Käyrä ei mittaa omistusuudistuksen tai eheytymisen kausaalista vaikutusta.",
    episodes: ["crisis_1917_1919", "depression_1930_1934"],
  },
  {
    start: 1946,
    end: 1975,
    label: "1946–1975",
    title: "Tuotanto, palkkatyö ja yhteinen turva laajenevat",
    whole:
      "Jälleenrakennus, teollistuminen ja palvelut muuttavat työnjakoa. Koulutus ja sosiaaliturva kasvavat osaksi yhteiskunnan kykyä sovittaa muutos ihmisten elämään.",
    chain: [
      "Tuotannon rakennemuutos ja työn siirtyminen",
      "Palkkatyö, koulutus ja muuttaminen avaavat uusia mahdollisuuksia",
      "Veropohja sekä koulutuksen, hoivan ja turvan tehtävät laajenevat",
      "Palvelut ja turva voivat ylläpitää työkykyä ja mahdollistaa osallistumista",
    ],
    counter:
      "Muutos myös siirtää väestöä ja jättää alueita sekä ryhmiä eri asemiin; yleinen kasvu ei kuvaa kaikkien kokemusta.",
    limit:
      "Kotitalouksien reaalitulokäyrä alkaa vasta vuodesta 1975. Siksi aikaisempaa rinnakkaista kasvua ei lasketa näiden käyrien perusteella.",
    episodes: ["structural_1965_1974"],
  },
  {
    start: 1976,
    end: 1994,
    label: "1976–1994",
    title: "Rakennemuutos ja lama koettelevat yhteistä sopimusta",
    whole:
      "Työn, rahoituksen ja kansainvälisen kilpailun muutokset sekä 1990-luvun lama muuttavat mahdollisuuksia ja riskien jakautumista. Tuottavuus voi elpyä ilman, että menetetyt työpaikat palaavat.",
    chain: [
      "Työn ja rahoituksen rakennemuutos sekä lama",
      "Työttömyys, velkarasitukset ja kotitalouksien tulomenetykset",
      "Verotulot ja turvan tarve voivat liikkua vastakkaisiin suuntiin",
      "Pitkittynyt ulkopuolisuus voi heikentää osaamista ja myöhempää työllistymistä",
    ],
    counter:
      "Tulonsiirrot ja palvelut pehmentävät häiriöitä; uuden tuotannon kasvu voi luoda myös uusia työpaikkoja.",
    limit:
      "Ajoitus ei yksin osoita vapauttamisen, laman tai leikkausten erillistä vaikutusta. Terveys ja työttömyys voivat vaikuttaa toisiinsa.",
    episodes: ["purchasing_power_1977_1978", "recession_1990_1994"],
  },
  {
    start: 1995,
    end: 2025,
    label: "1995–2025",
    title: "Kasvun määrä ja sen välittyminen ovat eri kysymyksiä",
    whole:
      "Teknologinen kasvu, finanssikriisi, pandemia ja hintashokki osuvat erilaiseen väestöön ja työnjakoon. Ratkaisevaa on, miten tuotanto välittyy työhön, reaalituloihin ja yhteisten tehtävien rahoitukseen.",
    chain: [
      "Tuotannon, tuottavuuden ja työn kysynnän muutos",
      "Palkat, työllisyys, hinnat, verot ja etuudet välittävät vaikutusta",
      "Kotitalouksien kysyntä, veropohja ja palvelujen tarve muuttuvat",
      "Osallistuminen ja toimintakyky voivat vahvistaa tai heikentää myöhempää tuotantopohjaa",
    ],
    counter:
      "Turva voi pitää tuloja yllä tuotannon pudotessa. Väestön ikääntyminen, tulonjako ja julkiset palvelut muuttavat tulkintaa edelleen.",
    limit:
      "Kansallinen keskiarvo ei kerro ryhmien jakaumista. Käyrien indeksiero ei ole menetettyä rahaa eikä nimetyn politiikan vaikutusarvio.",
    episodes: ["financial_2008_2009", "pandemic_2020_2021", "price_shock_2022_2023"],
  },
  {
    start: 2025,
    end: 2050,
    label: "2025–2050",
    title: "Kasvun välittyminen on avoin tulevaisuuden kysymys",
    whole:
      "Skenaario erottaa tuotannon kasvun siitä, kasvaako kotitalouksien reaalinen toimeentulo samaa tahtia. Kumpikaan käyrä ei yksin ratkaise julkisen talouden tai hyvinvoinnin kehitystä.",
    chain: [
      "Oletus tuotannon tulevasta kasvusta",
      "Oletus kasvun välittymisestä reaalituloihin",
      "Työllisyys, veropohja ja palvelujen tarve jäävät erikseen ratkaistaviksi",
      "Koulutus, terveys ja osallistuminen voivat muuttaa myös kasvun edellytyksiä",
    ],
    counter:
      "Samakin tulokehitys voi syntyä hyvin erilaisella työllisyydellä, tulonjaolla, velalla ja palvelutasolla.",
    limit:
      "Katkoviivat ovat laskuesimerkkejä, eivät ennusteita tai tunnistettujen päätösvaikutusten summia. Vuoden 2025 lähdeluvut voivat tarkentua.",
    episodes: [],
  },
];
export const lenses = [
  {
    id: "all",
    label: "Koko yhteiskunta",
    exposure:
      "Seuraa, miten tuotannon muutos kulkee toimeentulon kautta yhteisiin tehtäviin ja takaisin tuotannon edellytyksiin.",
    question: "Kasvaako vain tuotanto vai myös kyky pitää ihmiset mukana?",
    channels: [
      "Tuotanto ja työnjako",
      "Toimeentulo ja kysyntä",
      "Yhteinen vastuu ja rahoitus",
      "Osallistuminen ja tuleva tuotantopohja",
    ],
  },
  {
    id: "work",
    label: "Palkansaaja tai työnhakija",
    exposure:
      "Vaikutus välittyy työn saatavuuden, palkkojen, työehtojen, osaamisvaatimusten ja työttömyysturvan kautta. Ryhmän sisäiset erot voivat olla suuria.",
    question:
      "Mitä yhteiskunnalle seuraa, jos tuotanto kasvaa mutta osa työpanoksesta jää käyttämättä?",
    channels: [
      "Millaiselle työpanokselle on kysyntää?",
      "Mitä työstä tai työn puuttumisesta seuraa tuloille?",
      "Miten veropohja ja tuen tarve muuttuvat?",
      "Palautuuko ihminen työhön vai pitkittyykö ulkopuolisuus?",
    ],
  },
  {
    id: "family",
    label: "Lapsiperhe",
    exposure:
      "Työn ja tulojen ohella hoivan järjestäminen, asuminen, etuudet ja palvelut määrittävät mahdollisuuksia. Historiallisten perheiden tilanteet eivät vastaa nykyisiä malliperheitä.",
    question:
      "Mahdollistavatko työnjako ja yhteiset palvelut perheiden toimeentulon ja osallistumisen?",
    channels: [
      "Miten työ ja hoiva sovitetaan yhteen?",
      "Mitä tulojen ja kustannusten jälkeen jää?",
      "Mitä palvelut ja tulonsiirrot mahdollistavat?",
      "Miten lasten ja vanhempien toimintamahdollisuudet kehittyvät?",
    ],
  },
  {
    id: "retired",
    label: "Ikääntyvä tai eläkeläinen",
    exposure:
      "Vaikutus välittyy toimeentulon, eläketurvan, terveyden ja hoivan kautta. Nykyistä eläkejärjestelmää ei oleteta olemassa olevaksi koko aikajanalla.",
    question: "Miten aiemmin syntyneet sitoumukset ja muuttuva tuotantopohja sovitetaan yhteen?",
    channels: [
      "Millainen tuotantopohja kantaa toimeentuloa?",
      "Kuka kantaa vanhuuden toimeentuloriskin?",
      "Miten turva ja hoiva järjestetään ja rahoitetaan?",
      "Miten toimintakyky ja sukupolvien välinen vastuu muuttuvat?",
    ],
  },
  {
    id: "region",
    label: "Maaseutu tai rakennemuutosalue",
    exposure:
      "Työpaikkojen sijainti, muuttaminen, omistus ja palvelujen saavutettavuus välittävät vaikutusta. Kansallinen kasvu voi peittää paikallisen supistumisen.",
    question:
      "Voiko kansallinen kokonaisuus vahvistua samalla, kun alueen mahdollisuudet heikkenevät?",
    channels: [
      "Minne tuotanto ja työ sijoittuvat?",
      "Mitä muuttaminen tai paikalle jääminen merkitsee?",
      "Miten palvelut ja alueen veropohja sopeutuvat?",
      "Syntyykö uusia mahdollisuuksia vai vahvistuuko väestökato?",
    ],
  },
] as const;
export function eraAt(year: number) {
  return year >= FUTURE
    ? eras.at(-1)!
    : (eras.find((e) => year >= e.start && year <= e.end) ?? eras[0]!);
}
export function periodChange(points: Point[], start: number, end: number) {
  const a = points.find((p) => p.year === start),
    b = points.find((p) => p.year === end);
  return a && b ? (b.value / a.value - 1) * 100 : null;
}
