import { decisionMappings, networkEdges } from "../murrokset/decision-network-model";
import { EVENTS, MECHANISMS, eventMarkers, type MechanismId } from "./mechanism-model";
export const QUESTIONS = [
  "Mitä tarvittiin, ja mikä ajoi toimimaan?",
  "Kuka päätti, mitä valittiin ja mitä vaihtoehtoja oli?",
  "Miten ratkaisun oli tarkoitus toimia?",
  "Mitä havaittiin, kenelle ja millä viiveellä?",
  "Mikä yhteys ratkaisuun voidaan osoittaa?",
  "Mitä tämä mahdollisti tai vaikeutti seuraavaksi?",
] as const;
export type PathStep = { event: string; mechanism: MechanismId };
export type MainPath = {
  id: string;
  question: string;
  summary: string;
  steps: PathStep[];
  bridges: string[];
  alternative: string;
  feedback: string;
};
const steps = (pairs: [string, MechanismId][]): PathStep[] =>
  pairs.map(([event, mechanism]) => ({ event, mechanism }));
export const MAIN_PATHS: MainPath[] = [
  {
    id: "learning",
    question: "Miten koulutuksesta syntyi toimeentuloa ja yhteistä hyvinvointia?",
    summary: "Seuraa opetukseen pääsyä, osaamisen käyttöä ja uudistumisen ehtoja.",
    steps: steps([
      ["school", "capacity"],
      ["compulsory", "capacity"],
      ["comprehensive", "capacity"],
      ["technology", "work"],
      ["shock", "work"],
      ["adult", "capacity"],
    ]),
    bridges: [
      "Opetuksen laajentuminen ja oppivelvollisuus ovat eri vaiheita yhteisen sivistyspohjan rakentamisessa.",
      "Perusopetukseen pääsyn jälkeen seuraa kysymys yhteisen koulutuspolun yhdenvertaisuudesta.",
      "Koulutettu väestö voi tukea teknologista uudistumista, jos osaamiselle on käyttöä.",
      "Teknologinen menestys voi myös synnyttää riippuvuutta; uusiutuminen joutuu koetukselle häiriössä.",
      "Rakennemuutoksen jälkeen kysymys on siitä, pääsevätkö ihmiset hankkimaan uutta osaamista.",
    ],
    alternative:
      "Jos koulutus ei avaakaan työtä, onko puute koulutuksessa, työpaikoissa vai niiden kohtaamisessa?",
    feedback:
      "Jos työ vahvistaa toimeentuloa ja veropohjaa, voivatko lisävoimavarat vahvistaa koulutusta? Jos työ katoaa, heikkeneekö myös uudelleenkouluttautumisen mahdollisuus?",
  },
  {
    id: "cohesion",
    question: "Miten turvattomuudesta rakennettiin osallisuutta ja yhteiskuntarauhaa?",
    summary: "Seuraa oikeuksien, omistuksen ja yhteiskuntaan kuulumisen jännitettä.",
    steps: steps([
      ["censorship", "power"],
      ["democracy", "power"],
      ["prison", "power"],
      ["land", "risk"],
      ["compulsory", "capacity"],
      ["constitution", "power"],
    ]),
    bridges: [
      "Tiedonsaannin ja poliittisen osallistumisen ehdot ovat osallisuuden eri puolia.",
      "Äänioikeuden laajeneminen ei yksin poistanut yhteiskunnallisia ristiriitoja tai estänyt väkivaltaa.",
      "Väkivallan jälkeen omistuksen ja toimeentulon ratkaisuja voidaan tutkia eheyttämisen näkökulmasta.",
      "Omistuksen rinnalla yhteinen sivistys voi vahvistaa osallistumisen mahdollisuuksia.",
      "Osallisuuden toteutuminen riippuu myös oikeuksien ja julkisen vallan sääntöjen kehityksestä.",
    ],
    alternative:
      "Voivatko muodolliset oikeudet laajentua samalla, kun joidenkin tosiasiallinen mahdollisuus osallistua heikkenee?",
    feedback:
      "Jos ihmiset kokevat tulevansa kohdelluiksi oikeudenmukaisesti, vahvistuuko yhteisten sääntöjen hyväksyttävyys? Mitä tapahtuu, jos kokemus on päinvastainen?",
  },
  {
    id: "work-regions",
    question: "Miten työ ja väestö siirtyivät maataloudesta kaupunkeihin ja palveluihin?",
    summary: "Seuraa tuotannon, asuinpaikan, hoivan ja työn kohtaamista.",
    steps: steps([
      ["sawmills", "work"],
      ["land", "population"],
      ["resettlement", "population"],
      ["nordic", "world"],
      ["daycare", "population"],
      ["crisis", "work"],
      ["employment", "work"],
    ]),
    bridges: [
      "Teollinen työ ja maanomistukseen perustuva toimeentulo muodostivat erilaisia mahdollisuuksia.",
      "Sotien jälkeinen asutus muutti edelleen toimeentulon ja asuinpaikan rakennetta.",
      "Liikkumisen mahdollisuus avasi työtä myös oman asuinalueen ja Suomen ulkopuolelta.",
      "Työssäkäynti muuttaa lasten hoivan järjestämisen tarpeita; päivähoito voi puolestaan mahdollistaa työssäkäyntiä.",
      "Työpaikkojen häviäminen koettelee kotitalouksien kykyä sopeutua.",
      "Kriisien ja rakennemuutoksen jälkeen työllistymisen tuen vastuita järjestetään uudelleen.",
    ],
    alternative:
      "Johtaako työn katoaminen uuteen työhön, kouluttautumiseen, muuttoon vai pitkäaikaiseen työttömyyteen? Kenelle mikäkin reitti on mahdollinen?",
    feedback:
      "Kun työikäisiä muuttaa pois, miten veropohja ja palvelut muuttuvat? Voivatko nämä muutokset kiihdyttää muuttoliikettä tai synnyttää uuden kehityssuunnan?",
  },
  {
    id: "security",
    question: "Miten yksityisestä turvattomuudesta siirryttiin yhteiseen riskinkantoon?",
    summary: "Seuraa vanhuuden, perheiden, terveyden ja talouskriisien turvaa.",
    steps: steps([
      ["pension", "risk"],
      ["families", "population"],
      ["earnings", "risk"],
      ["health", "capacity"],
      ["finance", "risk"],
      ["crisis", "risk"],
      ["pandemic", "risk"],
    ]),
    bridges: [
      "Vanhuuden turvan rinnalle rakennettiin lasten toimeentulon yhteistä tukea.",
      "Perheiden turvan ja ansiotyöhön perustuvan eläketurvan järjestelmät vastaavat eri elämänvaiheiden tarpeisiin.",
      "Toimeentulon turvan rinnalla terveyspalvelut voivat ylläpitää toimintakykyä.",
      "Palvelu- ja turvajärjestelmän rinnalla rahoituksen ehdot muuttavat yksityisiä velkariskejä.",
      "Velkariskin toteutuminen nostaa esiin kysymyksen siitä, kuka kantaa menetykset.",
      "Erilaisia kriisejä vertaamalla voidaan tutkia, miten yhteisen riskinkannon välineet muuttuvat.",
    ],
    alternative:
      "Ehkäiseekö turva ongelman syvenemistä vai siirtyvätkö kustannukset kotitaloudelta toiselle tai myöhempään ajankohtaan?",
    feedback:
      "Jos turva säilyttää työkykyä ja osallistumista, vahvistaako se myös omaa rahoituspohjaansa? Missä tilanteissa tarpeet kasvavat rahoituspohjaa nopeammin?",
  },
  {
    id: "opening",
    question:
      "Miten kansallinen ohjaus muuttui kansainvälisiksi mahdollisuuksiksi ja riippuvuuksiksi?",
    summary: "Seuraa rahaa, liikkuvuutta, integraatiota ja turvallisuutta.",
    steps: steps([
      ["money", "risk"],
      ["nordic", "world"],
      ["finance", "risk"],
      ["eu", "world"],
      ["euro", "risk"],
      ["shock", "work"],
      ["nato", "world"],
    ]),
    bridges: [
      "Omat taloudelliset instituutiot ja rajat ylittävä työssäkäynti muuttavat toiminnan mittakaavaa eri tavoin.",
      "Ihmisten liikkuvuuden rinnalla avautuvat myös rahoitus ja pääomanliikkeet.",
      "Rahoituksen avautuminen ja EU-jäsenyys ovat erillisiä kansainvälistymisen vaiheita.",
      "EU-jäsenyys ja yhteiseen rahaan osallistuminen muuttavat eri osia päätösvallasta.",
      "Yhteisen rahan ja kansainvälisten tuotantoverkostojen oloissa ulkoinen häiriö koettelee sopeutumista.",
      "Taloudellisia riippuvuuksia ja turvallisuusasemaa on tarkasteltava erikseen mutta samassa ulkoisessa toimintaympäristössä.",
    ],
    alternative:
      "Milloin avoimuus hajauttaa riippuvuuksia ja milloin se keskittää niitä yhteen markkinaan, rahoituslähteeseen tai tuotannon alaan?",
    feedback:
      "Miten kansainväliset sitoumukset muuttavat seuraavien kotimaisten päätösten vaihtoehtoja? Mitä uutta toimintakykyä tai rajoitteita niistä syntyy?",
  },
  {
    id: "resources",
    question: "Miten luonnonvarojen käytöstä edettiin aineellisen perustan uudistamiseen?",
    summary: "Seuraa metsää, energiaa, teknologiaa ja ympäristön rajoja.",
    steps: steps([
      ["sawmills", "nature"],
      ["forest", "nature"],
      ["electricity", "nature"],
      ["technology", "work"],
      ["climate", "nature"],
    ]),
    bridges: [
      "Tuotannon mahdollistava luonnonvaran käyttö nostaa esiin myös käytön jatkuvuuden säännöt.",
      "Luonnonvarojen käytön rinnalla energiantuotanto muuttaa tuotannon aineellisia ehtoja.",
      "Energia ja teknologinen osaaminen voivat yhdessä mahdollistaa uusia tuotantotapoja.",
      "Teknologian kehittämistä voidaan tarkastella myös ilmasto- ja resurssitavoitteiden toteuttamisen välineenä.",
    ],
    alternative:
      "Kasvaako tuotanto luonnonvarojen käyttöä lisäämällä vai tuottamalla samalla panoksella enemmän hyötyä? Mihin ympäristökustannukset jäävät?",
    feedback:
      "Miten ympäristön heikkeneminen tai energian saatavuus muuttaa tuotannon ehtoja ja pakottaa uusia investointeja? Voivatko uudet ratkaisut vähentää riippuvuutta?",
  },
];
export function pathEvent(step: PathStep) {
  return EVENTS.find((e) => e.id === step.event)!;
}
export function pathPosition(step: PathStep) {
  const index = MECHANISMS.findIndex((m) => m.id === step.mechanism);
  const marker = eventMarkers(step.mechanism).find((p) => p.event.id === step.event)!;
  return { x: marker.x, y: 115 + index * 106 + 48 + marker.lane * 15 };
}
export function bridgeEvidence(from: PathStep, to: PathStep) {
  const nodes = (step: PathStep) =>
    new Set(
      pathEvent(step).decisions.flatMap((id) =>
        decisionMappings[id]?.match === "decision" ? decisionMappings[id]!.nodes : [],
      ),
    );
  const a = nodes(from),
    b = nodes(to);
  return networkEdges.filter((e) => a.has(e.from) && b.has(e.to));
}
export function bridgePath(from: PathStep, to: PathStep) {
  const a = pathPosition(from),
    b = pathPosition(to);
  const dx = b.x - a.x;
  return `M${a.x} ${a.y} C${a.x + dx * 0.45} ${a.y},${b.x - dx * 0.45} ${b.y},${b.x} ${b.y}`;
}
