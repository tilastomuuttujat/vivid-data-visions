export const MIN = 1850,
  MAX = 2050,
  FUTURE = 2025;
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
export function eraAt(year: number) {
  return year >= FUTURE
    ? eras.at(-1)!
    : (eras.find((e) => year >= e.start && year <= e.end) ?? eras[0]!);
}
