import { ERAS, EVENTS, eraOf } from "./mechanism-model";

// Editorial compression of the existing eras, not an indicator series or a causal graph.
export const LANDSCAPE = [
  {
    title: "Perusta",
    color: "#76b9b0",
    currents: ["Sivistyksen alku", "Teollisuuden alku", "Omat instituutiot"],
    nodes: ["sawmills", "money", "school"],
  },
  {
    title: "Osallisuus",
    color: "#96cbb0",
    currents: ["Osallistuminen avartuu", "Palkkatyö laajenee", "Kaupan yhteydet"],
    nodes: ["democracy"],
  },
  {
    title: "Oma valtio",
    color: "#cbb784",
    currents: ["Oikeudet ja ristiriidat", "Maa ja toimeentulo", "Itsenäisyys"],
    nodes: ["prison", "land", "compulsory"],
  },
  {
    title: "Jälleen\u00adrakennus",
    color: "#b9c78c",
    currents: ["Arjen turvaa", "Asutus ja tuotanto", "Sota ja rauha"],
    nodes: ["war", "resettlement", "families"],
  },
  {
    title: "Laaja turva",
    color: "#73c5bb",
    currents: ["Koulu ja terveys", "Työ ja yhteinen turva", "Kaupungistuminen"],
    nodes: ["comprehensive", "health", "daycare"],
  },
  {
    title: "Avautuminen",
    color: "#8eb4d8",
    currents: ["Osaamistalous", "Luotto ja kilpailu", "Eurooppa ja markkinat"],
    nodes: ["crisis", "eu", "euro"],
  },
  {
    title: "Uusi suunta",
    color: "#b6a5d4",
    currents: ["Kyky uudistua", "Kasvu ja riskit", "Ilmasto ja turvallisuus"],
    nodes: ["shock", "climate", "nato"],
  },
] as const;
export const CURRENTS = [
  { title: "Osallisuus ja toimintakyky", question: "Ketkä pääsevät mukaan?", color: "#75d1ae" },
  {
    title: "Toimeentulo ja riskinjako",
    question: "Mistä elanto ja turva syntyvät?",
    color: "#8abfe8",
  },
  { title: "Yhteydet ja elinympäristö", question: "Minkä varassa Suomi toimii?", color: "#d7bd7d" },
] as const;
export function eraEvents(index: number) {
  return EVENTS.filter((e) => eraOf(e.year) === index);
}
export function landmarkEvents(index: number) {
  return LANDSCAPE[index]!.nodes.map((id) => EVENTS.find((e) => e.id === id)!).filter(Boolean);
}
export function eraWidth(index: number) {
  const e = ERAS[index]!;
  return ((e.to - e.from) / 175) * 100;
}
