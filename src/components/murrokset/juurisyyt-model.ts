// Käänteinen polkumalli: nykytilan ilmiöstä jäljitetään päätösketju taaksepäin.
// Askeleet ovat toimituksellisia tulkintoja (prosessijäljitys), eivät todistettuja syy-yhteyksiä.
// Päätökset viittaavat lainsaadanto.json-aineiston tunnisteisiin.
import { DECISIONS, type Decision } from './murrokset-model';

export type RootKind = 'vinouma' | 'vahvuus' | 'heikkous';
export type RootStep = { era: string; title: string; mechanism: string; lag?: string; ids: string[] };
export type RootPath = { id: string; kind: RootKind; title: string; now: string; question: string; steps: RootStep[] };

export const KIND_TXT: Record<RootKind, string> = { vinouma: 'Vinouma', vahvuus: 'Vahvuus', heikkous: 'Heikkous' };

export const ROOT_PATHS: RootPath[] = [
  {
    id: 'syntyvyys', kind: 'vinouma', title: 'Syntyvyyden lasku ja perheiden kantokyky',
    now: 'Syntyvyys on historiallisen matalalla; perheen perustaminen siirtyy tai jää toteutumatta.',
    question: 'Mihin perheen perustamisen turvallisuus on aiemmin nojannut?',
    steps: [
      { era: '2016–2025', title: 'Etuuksien leikkaukset ja epävarmuus', mechanism: 'Opiskelijoiden ja nuorten aikuisten turvaa kiristettiin; aikuisuuden taloudellinen pohja ohenee.', lag: 'välitön', ids: ['d095', 'd097', 'd113', 'd116'] },
      { era: '1995', title: 'Lamasäästöt kohdistuvat lapsiperheisiin', mechanism: 'Lapsilisiä leikattiin eikä tasoa palautettu; perhetuen reaaliarvo jäi jälkeen.', lag: '≈ 20–25 v', ids: ['d073'] },
      { era: '1973–1996', title: 'Päivähoito ja kotihoidon tuki', mechanism: 'Työn ja perheen yhteensovittaminen rakennettiin palveluilla ja tuilla.', lag: '≈ 30–40 v', ids: ['d051', 'd059', 'd075'] },
      { era: '1937–1949', title: 'Perheturvan peruskivet', mechanism: 'Äitiysavustus, neuvolat ja lapsilisä tekivät lapsesta yhteisen vastuun.', lag: '≈ 70–80 v', ids: ['d030', 'd032', 'd034', 'd035'] },
    ],
  },
  {
    id: 'asunto', kind: 'vinouma', title: 'Asuntovarallisuuden eriytyminen ja muuttolukko',
    now: 'Varallisuus kasautuu kasvukeskusten omistusasujille; taantuvilla alueilla asunto on lukko, ei turva.',
    question: 'Miten asumisen riski siirtyi valtiolta kotitalouksille?',
    steps: [
      { era: '2005–2025', title: 'Varallisuusveron poisto ja asumistuen kiristys', mechanism: 'Omistamisen verokohtelu keveni samalla kun vuokra-asujan tuki heikkeni.', lag: 'välitön', ids: ['d084', 'd098', 'd113'] },
      { era: '1992–1993', title: 'Pääomatuloverotus ja velkakriisi', mechanism: 'Pääomatulot eriytettiin; laman velkaloukkuihin tuotiin velkajärjestely vasta jälkikäteen.', lag: '≈ 30 v', ids: ['d066', 'd069'] },
      { era: '1980-luku', title: 'Luottomarkkinoiden vapautus', mechanism: 'Asuntolainoituksen säännöstely purettiin; velka ja hintakupla kasvoivat nopeasti.', lag: '≈ 35–40 v', ids: ['d056'] },
      { era: '1945–1949', title: 'Asuttaminen ja Arava', mechanism: 'Valtio kantoi asumisen riskin: maata siirtoväelle ja tuettua asuntotuotantoa.', lag: '≈ 75 v', ids: ['d033', 'd036'] },
      { era: '1918', title: 'Torpparivapautus', mechanism: 'Omistus kansalaisuuden perustana — omistusasumisen kulttuurinen juuri.', lag: '≈ 100 v', ids: ['d017'] },
    ],
  },
  {
    id: 'tuottavuus', kind: 'heikkous', title: 'Tuottavuuskasvun hyytyminen',
    now: 'Tuottavuus on polkenut paikallaan Nokia-murroksen jälkeen; osaamistaso ei enää nouse.',
    question: 'Minkä varaan osaaminen ja innovaatiot rakennettiin — ja milloin pohja ohentui?',
    steps: [
      { era: '2022–2025', title: 'T&K-rahoituslaki ja aikuiskoulutuksen karsinta', mechanism: 'Pitkä T&K-sitoumus palautettiin, mutta osaamisen uusintamista karsittiin.', lag: 'tuleva', ids: ['d110', 'd114'] },
      { era: '2009–2016', title: 'Yliopistouudistus ja koulutussäästöt', mechanism: 'Yliopistot itsenäistettiin ja koulutuksesta leikattiin juuri kasvupohjan järkkyessä.', lag: '≈ 10–15 v', ids: ['d086', 'd093', 'd094'] },
      { era: '1992–1999', title: 'Markan kellutus, EU ja euro', mechanism: 'Devalvaatiot ja kriisi tukivat vientiä; euro poisti kansallisen sopeutuskeinon.', lag: '≈ 15–25 v', ids: ['d065', 'd072', 'd077'] },
      { era: '1968–1983', title: 'Peruskoulu ja Tekes', mechanism: 'Koko väestön osaaminen ja teknologiarahoitus — Nokia-nousun pohja.', lag: '≈ 25–40 v', ids: ['d045', 'd049', 'd058'] },
      { era: '1866–1921', title: 'Kansakoulu ja oppivelvollisuus', mechanism: 'Sivistys julkisena investointina.', lag: '≈ 100 v', ids: ['d008', 'd021'] },
    ],
  },
  {
    id: 'hoiva', kind: 'vinouma', title: 'Kestävyysvaje ja hoivan rahoituskriisi',
    now: 'Hyvinvointialueet ovat alijäämäisiä; ikääntyminen kasvattaa menoja nopeammin kuin veropohjaa.',
    question: 'Milloin palvelulupaukset ja niiden rahoitus erkanivat?',
    steps: [
      { era: '2021–2023', title: 'Sote-uudistus', mechanism: 'Järjestämisvastuu siirtyi alueille ilman omaa verotusoikeutta.', lag: 'välitön', ids: ['d106', 'd107'] },
      { era: '2005–2017', title: 'Eläkeuudistukset', mechanism: 'Eläkeikää nostettiin myöhässä suhteessa elinajan kasvuun.', lag: '≈ 10–20 v', ids: ['d083', 'd096'] },
      { era: '1995', title: 'Perusoikeusuudistus', mechanism: 'Palvelut nostettiin oikeuksiksi — sitova lupaus ilman rahoitussääntöä.', lag: '≈ 25 v', ids: ['d074'] },
      { era: '1961–1972', title: 'Työeläke, sairausvakuutus ja kansanterveys', mechanism: 'Laaja turva rakennettiin nuoren ja kasvavan väestön varaan.', lag: '≈ 50–60 v', ids: ['d042', 'd043', 'd050'] },
    ],
  },
  {
    id: 'kriisinkesto', kind: 'vahvuus', title: 'Kriisinkestävyys ja perusluottamus',
    now: 'Suomi selvisi pandemiasta ja turvallisuusmurroksesta poikkeuksellisen vakaasti.',
    question: 'Mihin yhteiskunnan luottamus ja toimintakyky kriisissä perustuu?',
    steps: [
      { era: '2020–2023', title: 'Koronatuet ja Nato', mechanism: 'Julkinen valta kantoi riskin nopeasti ja laajalla tuella.', lag: 'välitön', ids: ['d104', 'd111'] },
      { era: '1992–1999', title: 'Pankkituki, julkisuus ja perustuslaki', mechanism: 'Pankkijärjestelmä pelastettiin ja hallinnon avoimuutta lisättiin.', lag: '≈ 25 v', ids: ['d064', 'd079', 'd078'] },
      { era: '1932–1945', title: 'Valtion yhtiöt ja sotien jälkeinen asuttaminen', mechanism: 'Energiahuolto ja menetysten yhteinen jakaminen vahvistivat yhteenkuuluvuutta.', lag: '≈ 80 v', ids: ['d027', 'd033'] },
      { era: '1906–1919', title: 'Äänioikeus, tasavalta ja yhdistysvapaus', mechanism: 'Laaja osallistuminen ja kansalaisyhteiskunta — luottamuksen juuri.', lag: '≈ 100 v', ids: ['d014', 'd018', 'd019'] },
    ],
  },
  {
    id: 'tyomarkkinat', kind: 'vinouma', title: 'Työmarkkinoiden sirpaloituminen ja kannustinloukut',
    now: 'Pätkä- ja osa-aikatyö yleistyy; turvan ja työn yhteensovitus on monimutkaista.',
    question: 'Miten työsuhteen turva rakennettiin — ja miten sitä on purettu?',
    steps: [
      { era: '2017–2025', title: 'Perustulokokeilu, aktiivimalli ja palvelujen siirto', mechanism: 'Kokeiltiin kannustimia ja ehtoja; vastuu työllisyydestä siirtyi kunnille.', lag: 'välitön', ids: ['d099', 'd101', 'd102', 'd115'] },
      { era: '1997–2001', title: 'Toimeentulotuki ja aikuiskoulutustuki', mechanism: 'Viimesijainen turva vakiintui pysyväksi osaksi pitkäaikaistyöttömyyttä.', lag: '≈ 25 v', ids: ['d076', 'd080'] },
      { era: '1970–1979', title: 'Työsopimuslaki ja työterveyshuolto', mechanism: 'Vakituinen kokoaikatyö tehtiin turvan normiksi.', lag: '≈ 50 v', ids: ['d047', 'd054'] },
      { era: '1917–1922', title: 'Työaika ja työsopimus', mechanism: 'Työn ehdot säänneltiin yhteiskunnan asiaksi.', lag: '≈ 100 v', ids: ['d015', 'd022'] },
    ],
  },
];

const byId = new Map(DECISIONS.map((d) => [d.id, d]));
export function stepDecisions(s: RootStep): Decision[] {
  return s.ids.map((id) => byId.get(id)).filter((d): d is Decision => Boolean(d));
}
