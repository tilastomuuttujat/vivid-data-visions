import snapshot from "@/data/murros-network.json";
import { DECISIONS } from "./murrokset-model";
import { ROOT_PATHS } from "./juurisyyt-model";

export const networkSource = snapshot.source;
export const networkNodes = snapshot.nodes;
export const networkEdges = snapshot.edges;
export type NetworkNode = (typeof networkNodes)[number];
export type NetworkEdge = (typeof networkEdges)[number];
export type Direction = "all" | "incoming" | "outgoing";
type DecisionMapping = { nodes: string[]; basis: string; match: "decision" | "context" };

// Explicit editorial crosswalk. A shared topic or a matching year never creates an edge.
const direct = (node: string): DecisionMapping => ({
  nodes: [node],
  basis: "Päätöstä vastaava TTT-kortti. Ajankohta voi kuvata säätämistä tai toimeenpanoa.",
  match: "decision",
});
const context = (nodes: string[], basis: string): DecisionMapping => ({
  nodes,
  basis,
  match: "context",
});
export const decisionMappings: Record<string, DecisionMapping> = {
  d002: context(
    ["hoyrysahat-1860"],
    "Höyrysahojen kehityskokonaisuus; kortti ei ole vuoden 1857 lupapäätöksen tarkka vastine.",
  ),
  d003: context(["rautatieverkko-1862"], "Ensimmäinen rata on osa laajempaa rataverkon kehitystä."),
  d004: direct("markka-1860"),
  d005: direct("kieliasetus-1863"),
  d007: direct("kunnallishallinto-1865"),
  d008: direct("kansakouluasetus-1866"),
  d009: direct("elinkeinovapaus-1879"),
  d010: direct("terveydenhoitoasetus-1879"),
  d011: direct("metsalaki-1886"),
  d012: direct("tyotapaturmavakuutus-1895"),
  d013: direct("kansakoulu-maaseutu-1898"),
  d014: direct("aanioikeus-1906"),
  d015: direct("kahdeksan-tunnin-tyoaika-1917"),
  d016: context(
    ["sisallissota-1918"],
    "Vankileirikatastrofi liittyy sisällissodan kokonaisuuteen; kortti kattaa myös muita tapahtumia.",
  ),
  d017: direct("torpparivapautus-1918"),
  d018: direct("hallitusmuoto-1919"),
  d020: direct("kieltolaki-1919"),
  d021: direct("oppivelvollisuus-1921"),
  d022: direct("tyosopimuslaki-1922"),
  d023: direct("koyhainhoitolaki-1922"),
  d024: direct("avioliittolaki-1929"),
  d026: direct("alkoholimonopoli-1932"),
  d029: context(
    ["kansanelakelaki-1937"],
    "Kelan perustaminen liittyy kansaneläkejärjestelmän rakentamiseen.",
  ),
  d030: direct("aitiysavustus-1937"),
  d032: direct("neuvolalaki-1944"),
  d033: direct("maanhankintalaki-1945"),
  d034: direct("lapsilisa-1948"),
  d036: direct("aravalaki-1949"),
  d038: direct("pohjoismaiset-tyomarkkinat-1954"),
  d039: direct("kansanelakeuudistus-1956"),
  d041: direct("ammattioppilaitoslaki-1958"),
  d042: context(
    ["tyoelake-1961", "tel-1962"],
    "TTT erottaa työeläkejärjestelmän rakentamisen ja TEL:n käyttöönoton kahdeksi kortiksi.",
  ),
  d043: direct("sairausvakuutus-1963"),
  d045: direct("peruskoulu-1968"),
  d046: direct("opintolaina-1969"),
  d049: context(
    ["peruskoulu-1968"],
    "Alueittainen toimeenpano liittyy peruskoulu-uudistuksen korttiin; se ei ole uusi vuoden 1968 päätös.",
  ),
  d050: direct("kansanterveyslaki-1972"),
  d051: direct("paivahoitolaki-1973"),
  d052: direct("isyyslaki-1975"),
  d054: direct("tyoterveyshuolto-1978"),
  d056: context(
    ["rahoitusmarkkinoiden-vapautuminen", "rahoitusmarkkinoiden_vapauttaminen"],
    "Lähteessä on kaksi osin päällekkäistä rahoitusmarkkinoiden vapautumisen korttia. Niiden yhteyksiä ei yhdistetä automaattisesti.",
  ),
  d057: direct("sosiaalihuoltolaki-1982"),
  d059: direct("lasten-kotihoidontuki-1985"),
  d060: direct("tasa-arvolaki-1987"),
  d061: direct("vammaispalvelulaki-1987"),
  d064: context(
    ["pankkikriisi"],
    "Vakuusrahaston perustaminen liittyy pankkikriisin hoitoon; kortti kattaa koko kriisin.",
  ),
  d065: direct("markan_kellutus"),
  d072: direct("eu-jasenyys-1995"),
  d074: direct("perusoikeusuudistus-1995"),
  d077: direct("euro-1999"),
  d078: direct("perustuslaki-2000"),
  d083: direct("elakeuudistukset-2005"),
  d093: context(
    ["koulutusleikkaukset"],
    "Laaja koulutussäästöjen kokonaisuus; yksittäisiä talousarviopäätöksiä ei eroteta lähdekortissa.",
  ),
  d094: context(
    ["koulutusleikkaukset"],
    "Vuoden 2016 säästöt ovat osa koulutusleikkausten laajempaa kokonaisuutta.",
  ),
  d099: direct("perustulokokeilu-2017"),
  d100: direct("ammatillisen-koulutuksen-reformi-2018"),
  d104: context(
    ["covid-19"],
    "Koronatukia tarkastellaan pandemian kokonaisuuden kautta; kaikki relaatiot eivät koske tukipäätöksiä.",
  ),
  d106: context(
    ["hyvinvointialueet-2023", "sote-pitka-uudistus"],
    "Hyvinvointialueiden perustaminen ja pitkä sote-uudistus ovat lähteessä eri kortteja.",
  ),
  d107: context(
    ["hyvinvointialueet-2023"],
    "Rahoituslaki liittyy hyvinvointialueiden kokonaisuuteen; relaatiot eivät kohdistu vain rahoituslakiin.",
  ),
  d110: context(
    ["osaajapula-tki-palautus-2019"],
    "T&K-rahoituslaki liittyy laajempaan osaaja- ja TKI-kokonaisuuteen; kyseessä on aiheyhteys.",
  ),
  d111: direct("nato-jasenyys"),
  d112: direct("uusi-vammaispalvelulaki-2025"),
  d115: context(
    ["te24_uudistus", "kuntapohjainen-tyollisyydenhoito-2025"],
    "TE-palvelujen siirrosta on kaksi toisiaan täydentävää korttia.",
  ),
};

const nodesById = new Map(networkNodes.map((n) => [n.id, n]));
export const networkNode = (id: string) => nodesById.get(id);
export function edgesFor(id: string, direction: Direction = "all"): NetworkEdge[] {
  return networkEdges.filter((e) =>
    direction === "incoming"
      ? e.to === id
      : direction === "outgoing"
        ? e.from === id
        : e.from === id || e.to === id,
  );
}
export const otherNode = (edge: NetworkEdge, id: string) =>
  networkNode(edge.from === id ? edge.to : edge.from)!;
export const isScenario = (node: NetworkNode) =>
  /^(skenaario|tulevaisuus)/.test(node.id) || (node.yearStart != null && node.yearStart > 2025);
export function relatedAnalyses(decisionId: string) {
  const links = ROOT_PATHS.filter((p) => p.steps.some((s) => s.ids.includes(decisionId))).flatMap(
    (p) => p.analysis,
  );
  if (!links.length)
    return [{ label: "Yhteinen aikajana ja tilastosarjat", hash: "teema-aikajana" }];
  return links.filter((a, i) => links.findIndex((b) => a.hash === b.hash) === i);
}
export function linkedDecisions(nodeId: string) {
  return DECISIONS.filter((d) => decisionMappings[d.id]?.nodes.includes(nodeId));
}
export function validateNetwork() {
  if (nodesById.size !== networkNodes.length) throw new Error("Päällekkäinen verkostosolmu");
  if (new Set(networkEdges.map((e) => e.id)).size !== networkEdges.length)
    throw new Error("Päällekkäinen relaatio");
  for (const e of networkEdges)
    if (!networkNode(e.from) || !networkNode(e.to))
      throw new Error(`Tuntematon relaation päätepiste: ${e.id}`);
  for (const [id, mapping] of Object.entries(decisionMappings)) {
    if (
      !DECISIONS.some((d) => d.id === id) ||
      !mapping.nodes.length ||
      mapping.nodes.some((n) => !networkNode(n))
    )
      throw new Error(`Virheellinen päätösvastine: ${id}`);
  }
}
