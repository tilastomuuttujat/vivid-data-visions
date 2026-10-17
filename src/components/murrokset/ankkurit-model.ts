// Seitsemän systeemistä ankkuria: toimituksellinen ryhmittely TTT-verkoston kortteista.
// Ankkurien väliset kaaret lasketaan vain lähteeseen kirjatuista relaatioista; mitään ei päätellä.
import { networkEdges, networkNode, type NetworkEdge } from "./decision-network-model";

export type Anchor = {
  id: string;
  n: number;
  from: number;
  to: number;
  title: string;
  mechanism: string;
  now: string;
  tone: string;
  nodes: string[];
};

export const ANCHORS: Anchor[] = [
  {
    id: "a1", n: 1, from: 1860, to: 1879, tone: "var(--m-green)",
    title: "Markkinoiden, metsän ja sivistyksen avaaminen",
    mechanism: "Höyrysahat, puunjalostus, kansakoulu ja elinkeinovapaus.",
    now: "Viennin ja osaamisen kivijalka, jonka varassa veropohja yhä lepää.",
    nodes: ["hoyrysahat-1860", "puunjalostus-1870", "kansakouluasetus-1866", "elinkeinovapaus-1879"],
  },
  {
    id: "a2", n: 2, from: 1918, to: 1921, tone: "var(--m-red)",
    title: "Eheytyskompromissi ja kansalaisuuden laajennus",
    mechanism: "Sisällissodan jälkeinen torpparivapautus, tasavalta ja oppivelvollisuus.",
    now: "Laaja pienomistajuus ja luottamus, joka kantoi sotien yli.",
    nodes: ["sisallissota-1918", "torpparivapautus-1918", "hallitusmuoto-1919", "oppivelvollisuus-1921"],
  },
  {
    id: "a3", n: 3, from: 1939, to: 1954, tone: "var(--m-violet, #a78bfa)",
    title: "Sodat, asutus ja universaali perheturva",
    mechanism: "Sodat, maanhankinta, Arava, neuvolat ja lapsilisä.",
    now: "Arjen perusvarmuus ja hajautettu aluerakenne.",
    nodes: ["talvi-ja-jatkosota", "maanhankintalaki-1945", "aravalaki-1949", "neuvolalaki-1944", "lapsilisa-1948"],
  },
  {
    id: "a4", n: 4, from: 1961, to: 1973, tone: "var(--m-blue)",
    title: "Hyvinvointivaltion arkkitehtuuri",
    mechanism: "Työeläke, peruskoulu, kansanterveys ja päivähoito.",
    now: "Kasvavan väestön oletukselle rakennettu lupaus, josta tuli kestävyysvaje.",
    nodes: ["tyoelake-1961", "tel-1962", "peruskoulu-1968", "kansanterveyslaki-1972", "paivahoitolaki-1973", "teollistuminen", "kaupungistuminen"],
  },
  {
    id: "a5", n: 5, from: 1986, to: 1993, tone: "var(--m-gold)",
    title: "Rahoitusvapautus, lama ja riskinjaon uusjako",
    mechanism: "Luottomarkkinoiden vapautus, pankkikriisi ja markan kellutus.",
    now: "Riski siirtyi kotitalouksille; pysyvä leikkaus- ja velkavarovaisuus.",
    nodes: ["rahoitusmarkkinoiden-vapautuminen", "rahoitusmarkkinoiden_vapauttaminen", "pankkikriisi", "1990-luvun-lama", "markan_kellutus"],
  },
  {
    id: "a6", n: 6, from: 1995, to: 2008, tone: "var(--m-teal)",
    title: "Integraatio ja teknologiaklusteri",
    mechanism: "EU, euro, internet ja Nokia-vetoinen kasvu sekä sen hiipuminen.",
    now: "Tuottavuushuippu ja yhden klusterin haavoittuvuus.",
    nodes: ["eu-jasenyys-1995", "euro-1999", "internet-murros", "nokia-rakennemuutos"],
  },
  {
    id: "a7", n: 7, from: 2010, to: 2025, tone: "var(--m-rose, #f472b6)",
    title: "Väestöpudotus, sote ja turvallisuusmurros",
    mechanism: "Matala syntyvyys, ikääntyminen, hyvinvointialueet ja Nato.",
    now: "Universaali palvelulupaus ja supistuva työvoima törmäävät.",
    nodes: ["historiallisen-matala-syntyvyys-2010", "vaeston-ikaantyminen", "hyvinvointialueet-2023", "sote-pitka-uudistus", "julkisen-talouden-kestavyysvaje-2020", "nato-jasenyys"],
  },
];

const anchorOfNode = new Map<string, string>();
for (const a of ANCHORS) for (const n of a.nodes) anchorOfNode.set(n, a.id);
export const anchorOf = (nodeId: string) => anchorOfNode.get(nodeId);

/** Ankkurien väliset lähdesuuntaiset yhteydet (from → to), ryhmiteltyinä. */
export function anchorLinks() {
  const map = new Map<string, { from: string; to: string; edges: NetworkEdge[] }>();
  for (const e of networkEdges) {
    const a = anchorOf(e.from);
    const b = anchorOf(e.to);
    if (!a || !b || a === b) continue;
    const key = `${a}>${b}`;
    if (!map.has(key)) map.set(key, { from: a, to: b, edges: [] });
    map.get(key)!.edges.push(e);
  }
  return [...map.values()];
}

/** Valitun ankkurin yhteydet ankkurien ulkopuolisiin kortteihin. */
export function anchorSatellites(anchorId: string) {
  const own = new Set(ANCHORS.find((a) => a.id === anchorId)?.nodes ?? []);
  return networkEdges
    .filter((e) => (own.has(e.from) || own.has(e.to)) && !(anchorOf(e.from) && anchorOf(e.to)))
    .map((e) => {
      const incoming = own.has(e.to);
      return { e, incoming, other: networkNode(incoming ? e.from : e.to)! };
    })
    .filter((r) => r.other && r.other.yearStart != null);
}

export function validateAnchors() {
  for (const a of ANCHORS)
    for (const n of a.nodes) if (!networkNode(n)) throw new Error(`Tuntematon ankkurikortti: ${n}`);
}
