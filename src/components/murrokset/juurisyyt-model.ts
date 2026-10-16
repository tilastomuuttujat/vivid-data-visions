// Käänteinen polkumalli: nykytilan ilmiöstä jäljitetään päätösketju taaksepäin.
// Askeleet ovat toimituksellisia tulkintoja (prosessijäljitys), eivät todistettuja syy-yhteyksiä.
// Päätökset viittaavat lainsaadanto.json-aineiston tunnisteisiin.
import { DECISIONS, type Decision } from "./murrokset-model";

export type RootKind = "vinouma" | "vahvuus" | "heikkous";
export type RootStep = { era: string; title: string; mechanism: string; ids: string[] };
export type RootPath = {
  id: string;
  kind: RootKind;
  title: string;
  now: string;
  question: string;
  alternative: string;
  check: string;
  analysis: { label: string; hash: string }[];
  steps: RootStep[];
};

export const KIND_TXT: Record<RootKind, string> = {
  vinouma: "Vinouma",
  vahvuus: "Vahvuus",
  heikkous: "Heikkous",
};

export const ROOT_PATHS: RootPath[] = [
  {
    id: "syntyvyys",
    kind: "vinouma",
    title: "Syntyvyyden lasku ja perheiden kantokyky",
    now: "Syntyvyys on historiallisen matalalla; perheen perustaminen siirtyy tai jää toteutumatta.",
    question: "Mihin perheen perustamisen turvallisuus on aiemmin nojannut?",
    alternative:
      "Myös parisuhteiden muodostuminen, toiveet, terveys ja työmarkkinatilanne voivat vaikuttaa syntyvyyteen.",
    check:
      "Vertaa etuusmuutosten ajoitusta syntyvyyskehitykseen ja tutkimuksiin eri väestöryhmistä; pelkkä samanaikaisuus ei riitä.",
    analysis: [
      { label: "Syntyvyys ja perhepolitiikka", hash: "family-policy" },
      { label: "Kotitalouksien toimeentulo", hash: "timeline-households" },
    ],
    steps: [
      {
        era: "2016–2025",
        title: "Etuuksien leikkaukset ja epävarmuus",
        mechanism:
          "Opiskelijoiden ja nuorten aikuisten turvaa kiristettiin; aikuisuuden taloudellinen pohja ohenee.",
        ids: ["d095", "d097", "d113", "d116"],
      },
      {
        era: "1995",
        title: "Lamasäästöt kohdistuvat lapsiperheisiin",
        mechanism:
          "Vuoden 1995 lapsilisäleikkaus pienensi tukea. Pitkän aikavälin reaaliarvo ja yhteys syntyvyyteen vaativat erillisen tarkastelun.",
        ids: ["d073"],
      },
      {
        era: "1973–1996",
        title: "Päivähoito ja kotihoidon tuki",
        mechanism: "Työn ja perheen yhteensovittaminen rakennettiin palveluilla ja tuilla.",
        ids: ["d051", "d059", "d075"],
      },
      {
        era: "1937–1949",
        title: "Perheturvan peruskivet",
        mechanism: "Äitiysavustus, neuvolat ja lapsilisä tekivät lapsesta yhteisen vastuun.",
        ids: ["d030", "d032", "d034", "d035"],
      },
    ],
  },
  {
    id: "asunto",
    kind: "vinouma",
    title: "Asuntovarallisuuden eriytyminen ja muuttolukko",
    now: "Varallisuus kasautuu kasvukeskusten omistusasujille; taantuvilla alueilla asunto on lukko, ei turva.",
    question: "Miten asumisen riski siirtyi valtiolta kotitalouksille?",
    alternative:
      "Asuntojen kysyntään ja arvoon vaikuttavat myös korot, rakentaminen, työpaikat ja muuttoliike.",
    check:
      "Vertaa alueiden hinta-, varallisuus- ja muuttoliikekehitystä sekä omistus- ja vuokra-asujia erikseen.",
    analysis: [
      { label: "Asuminen ja varallisuus", hash: "timeline-housing" },
      { label: "Työ ja liikkuvuus", hash: "timeline-work-mobility" },
    ],
    steps: [
      {
        era: "2005–2025",
        title: "Varallisuusveron poisto ja asumistuen muutokset",
        mechanism:
          "Varallisuusvero poistettiin. Opiskelijat siirrettiin yleiseen asumistukeen 2017, asumistukea leikattiin 2024–2025 ja opiskelijat siirrettiin asumislisään 2025. Vaikutukset eroavat ryhmittäin.",
        ids: ["d084", "d098", "d113", "d116"],
      },
      {
        era: "1992–1993",
        title: "Pääomatuloverotus ja velkakriisi",
        mechanism:
          "Pääomatulot eriytettiin; laman velkaloukkuihin tuotiin velkajärjestely vasta jälkikäteen.",
        ids: ["d066", "d069"],
      },
      {
        era: "1980-luku",
        title: "Luottomarkkinoiden vapautus",
        mechanism:
          "Asuntolainoituksen säännöstely purettiin; velka ja hintakupla kasvoivat nopeasti.",
        ids: ["d056"],
      },
      {
        era: "1945–1949",
        title: "Asuttaminen ja Arava",
        mechanism: "Valtio kantoi asumisen riskin: maata siirtoväelle ja tuettua asuntotuotantoa.",
        ids: ["d033", "d036"],
      },
      {
        era: "1918",
        title: "Torpparivapautus",
        mechanism: "Omistus kansalaisuuden perustana — omistusasumisen kulttuurinen juuri.",
        ids: ["d017"],
      },
    ],
  },
  {
    id: "tuottavuus",
    kind: "heikkous",
    title: "Tuottavuuskasvun hyytyminen",
    now: "Polku tarkastelee tuottavuuskasvun hidastumista ja osaamisen edellytyksiä Nokia-murroksen jälkeen. Kehitys vaihtelee mittareittain ja ajanjaksoittain.",
    question: "Minkä varaan osaaminen ja innovaatiot rakennettiin — ja milloin pohja ohentui?",
    alternative:
      "Tuottavuuteen vaikuttavat myös toimialarakenne, investoinnit, vientikysyntä ja teknologinen muutos.",
    check:
      "Erota tuottavuuden toimiala- ja ajanjaksokohtainen kehitys koulutus- ja rahapolitiikkaa koskevista vaikutusväitteistä.",
    analysis: [{ label: "Tuottavuuden kehitys", hash: "timeline-productivity" }],
    steps: [
      {
        era: "2022–2025",
        title: "T&K-rahoituslaki ja aikuiskoulutuksen karsinta",
        mechanism: "Pitkä T&K-sitoumus palautettiin, mutta osaamisen uusintamista karsittiin.",
        ids: ["d110", "d114"],
      },
      {
        era: "2009–2016",
        title: "Yliopistouudistus ja koulutussäästöt",
        mechanism:
          "Yliopistot itsenäistettiin ja koulutuksesta leikattiin juuri kasvupohjan järkkyessä.",
        ids: ["d086", "d093", "d094"],
      },
      {
        era: "1992–1999",
        title: "Markan kellutus, EU ja euro",
        mechanism:
          "Devalvaatiot ja kriisi tukivat vientiä; euro poisti kansallisen sopeutuskeinon.",
        ids: ["d065", "d072", "d077"],
      },
      {
        era: "1968–1983",
        title: "Peruskoulu ja Tekes",
        mechanism: "Koko väestön osaaminen ja teknologiarahoitus — Nokia-nousun pohja.",
        ids: ["d045", "d049", "d058"],
      },
      {
        era: "1866–1921",
        title: "Kansakoulu ja oppivelvollisuus",
        mechanism: "Sivistys julkisena investointina.",
        ids: ["d008", "d021"],
      },
    ],
  },
  {
    id: "hoiva",
    kind: "vinouma",
    title: "Kestävyysvaje ja hoivan rahoituskriisi",
    now: "Hyvinvointialueet ovat alijäämäisiä; ikääntyminen kasvattaa menoja nopeammin kuin veropohjaa.",
    question: "Milloin palvelulupaukset ja niiden rahoitus erkanivat?",
    alternative:
      "Rahoituspaineisiin vaikuttavat myös henkilöstön saatavuus, kustannustaso, palvelutarve ja palvelujen järjestäminen.",
    check:
      "Tarkastele palvelutarvetta, rahoitusta ja kustannuksia rinnakkain; arvioi eläkejärjestelmää erillään hyvinvointialueiden rahoituksesta.",
    analysis: [
      { label: "Hoivan kapasiteetti", hash: "timeline-care" },
      { label: "Julkinen talous", hash: "timeline-debt" },
    ],
    steps: [
      {
        era: "2021–2023",
        title: "Sote-uudistus",
        mechanism: "Järjestämisvastuu siirtyi alueille ilman omaa verotusoikeutta.",
        ids: ["d106", "d107"],
      },
      {
        era: "2005–2017",
        title: "Eläkeuudistukset",
        mechanism:
          "Uudistukset muuttivat eläkeikää ja eläkkeen karttumista. Niiden riittävyys suhteessa elinajan muutokseen vaatii erillisen arvion.",
        ids: ["d083", "d096"],
      },
      {
        era: "1995",
        title: "Perusoikeusuudistus",
        mechanism:
          "Uudistus vahvisti sosiaalisten oikeuksien asemaa. Sen yhteys myöhempiin rahoituspaineisiin on erikseen tutkittava tulkinta.",
        ids: ["d074"],
      },
      {
        era: "1961–1972",
        title: "Työeläke, sairausvakuutus ja kansanterveys",
        mechanism: "Laaja turva rakennettiin nuoren ja kasvavan väestön varaan.",
        ids: ["d042", "d043", "d050"],
      },
    ],
  },
  {
    id: "kriisinkesto",
    kind: "vahvuus",
    title: "Kriisinkestävyys ja perusluottamus",
    now: "Pandemia ja turvallisuusympäristön muutos koettelivat Suomen toimintakykyä. Kriisinkestävyyttä tarkastellaan eri mittareilla ja väestöryhmissä.",
    question: "Mihin yhteiskunnan luottamus ja toimintakyky kriisissä perustuu?",
    alternative:
      "Kriisien seurauksiin vaikuttavat myös kriisin luonne, kansainvälinen yhteistyö ja väestöryhmien erilainen altistuminen.",
    check:
      "Määrittele kriisinkestävyyden mittari ja vertailumaat; tarkista terveyden, toimeentulon ja luottamuksen kehitys erikseen.",
    analysis: [
      { label: "Kriisien hoito", hash: "timeline-crises" },
      { label: "Alueiden toipuminen", hash: "timeline-recovery" },
    ],
    steps: [
      {
        era: "2020–2023",
        title: "Koronatuet ja Nato",
        mechanism: "Julkinen valta kantoi riskin nopeasti ja laajalla tuella.",
        ids: ["d104", "d111"],
      },
      {
        era: "1992–1999",
        title: "Pankkituki, julkisuus ja perustuslaki",
        mechanism: "Pankkijärjestelmä pelastettiin ja hallinnon avoimuutta lisättiin.",
        ids: ["d064", "d079", "d078"],
      },
      {
        era: "1932–1945",
        title: "Valtion yhtiöt ja sotien jälkeinen asuttaminen",
        mechanism: "Energiahuolto ja menetysten yhteinen jakaminen vahvistivat yhteenkuuluvuutta.",
        ids: ["d027", "d033"],
      },
      {
        era: "1906–1919",
        title: "Äänioikeus, tasavalta ja yhdistysvapaus",
        mechanism: "Laaja osallistuminen ja kansalaisyhteiskunta — luottamuksen juuri.",
        ids: ["d014", "d018", "d019"],
      },
    ],
  },
  {
    id: "tyomarkkinat",
    kind: "vinouma",
    title: "Työmarkkinoiden sirpaloituminen ja kannustinloukut",
    now: "Polku tarkastelee määräaikaisen ja osa-aikaisen työn sekä toimeentuloturvan yhteensovittamista. Kehitys on tarkistettava työsuhdemuodoittain.",
    question: "Miten työsuhteen turva rakennettiin — ja miten sitä on purettu?",
    alternative:
      "Työsuhteiden muutoksiin vaikuttavat myös suhdanteet, toimialat, työn kysyntä ja työntekijöiden omat valinnat.",
    check:
      "Erota vapaaehtoinen ja vastentahtoinen osa-aikatyö sekä tarkista, koskevatko työn ja turvan havainnot samoja väestöryhmiä.",
    analysis: [
      { label: "Työn mahdollisuudet", hash: "timeline-work-opportunity" },
      { label: "Kotitalouksien toimeentulo", hash: "timeline-households" },
    ],
    steps: [
      {
        era: "2017–2025",
        title: "Perustulokokeilu, aktiivimalli ja palvelujen siirto",
        mechanism: "Kokeiltiin kannustimia ja ehtoja; vastuu työllisyydestä siirtyi kunnille.",
        ids: ["d099", "d101", "d102", "d115"],
      },
      {
        era: "1997–2001",
        title: "Toimeentulotuki ja aikuiskoulutustuki",
        mechanism:
          "Toimeentulotukilaki jäsensi viimesijaista turvaa, aikuiskoulutustuki korvasi opiskelun ansionmenetystä. Yhteys työmarkkinoiden sirpaloitumiseen vaatii erillistä näyttöä.",
        ids: ["d076", "d080"],
      },
      {
        era: "1970–1979",
        title: "Työsopimuslaki ja työterveyshuolto",
        mechanism: "Vakituinen kokoaikatyö tehtiin turvan normiksi.",
        ids: ["d047", "d054"],
      },
      {
        era: "1917–1922",
        title: "Työaika ja työsopimus",
        mechanism: "Työn ehdot säänneltiin yhteiskunnan asiaksi.",
        ids: ["d015", "d022"],
      },
    ],
  },
];

const byId = new Map(DECISIONS.map((d) => [d.id, d]));
export function stepDecisions(s: RootStep): Decision[] {
  return s.ids.map((id) => {
    const decision = byId.get(id);
    if (!decision) throw new Error(`Tuntematon päätösviittaus: ${id}`);
    return decision;
  });
}
