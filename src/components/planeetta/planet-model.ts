import anchorSrc from '@/data/anchors.json';

export interface PStep { short_title: string; title: string; period: string; years: number[]; mechanism: string; benefit: string; tradeoff: string; affected: string; lag: string; alternative: string; explanation: string }
export interface PAnchor { id: string; title: string; period: string; question: string; steps: PStep[] }

const anchors = (anchorSrc as unknown as { anchors: PAnchor[] }).anchors;
const byId = new Map(anchors.map(a => [a.id, a]));

export const W = 1000, H = 700;

export interface Cluster { id: string; name: string; text: string; x: number; y: number; anchors: PAnchor[] }
export interface Plate { id: string; name: string; text: string; color: string; x: number; y: number; r: number; clusters: Cluster[] }
export interface Tension { id: string; a: string; b: string; name: string; text: string }

const C = (id: string, name: string, text: string, x: number, y: number, ids: string[]): Cluster =>
  ({ id, name, text, x, y, anchors: ids.map(i => byId.get(i)).filter(Boolean) as PAnchor[] });

/** Interpretive grouping by the agent — plates are systemic foundations ("minkä varaan"), not measured magnitudes. */
export const PLATES: Plate[] = [
  { id: 'aine', name: 'Aineellinen perusta', text: 'Maa, metsä, malmi, energia ja teollinen ankkurointi. Mitä maasta saadaan irti ja kenen käsin.', color: 'oklch(.74 .16 45)', x: 270, y: 210, r: 190, clusters: [
    C('maa', 'Maa ja toimeentulo', 'Sato, maanomistus ja asuttaminen: toimeentulon perusta sidottiin maahan.', 200, 170, ['nalkavuodet-1866-1868', 'torpparikysymys', 'asuttaminen-ja-jalleenrakennus-1945-1955']),
    C('teol', 'Teollinen ankkuri', 'Valtionyhtiöt, Nokia ja energia: menestyksen varaan rakennetut kantavat solmut.', 350, 270, ['jaavuori-valtionyhtiot-raahe', 'nokian-nousu-ja-matkapuhelinmurros', 'energiakriisi-ja-venaja-riippuvuuden-purkaminen']),
  ] },
  { id: 'vaesto', name: 'Väestö ja työpotentiaali', text: 'Muuttoliikkeet, elinkaari ja hoiva. Käytetty ja käyttämätön työkyky.', color: 'oklch(.82 .13 190)', x: 730, y: 210, r: 190, clusters: [
    C('muutto', 'Muuttoliikkeet', 'Maalta kaupunkiin, Ruotsiin ja Suomeen: työ hakee ihmistä, ihminen hakee ankkuria.', 680, 160, ['maaltamuutto', 'ruotsiin-muutto-ja-perheiden-arki', 'maahanmuutto-ja-kotoutuminen', 'torpparista-osaajaksi']),
    C('elin', 'Elinkaari ja hoiva', 'Ikääntyminen ja päivähoito: kuka hoivaa, kun kaikki ovat töissä.', 800, 280, ['vaeston-ikaantyminen', 'paivahoito-ja-naisten-palkkatyo']),
  ] },
  { id: 'sopimus', name: 'Perussopimus ja palvelulupaus', text: 'Yhteinen opintie, palvelut ja kriisinkestävyys: lupaus siitä, että koko maa pidetään mukana.', color: 'oklch(.78 .12 150)', x: 270, y: 500, r: 175, clusters: [
    C('opin', 'Yhteinen opintie', 'Peruskoulu ja oppivelvollisuus: osaaminen kansallisena ankkurina.', 210, 460, ['peruskoulu-uudistus', 'oppivelvollisuuden-laajentaminen-2021']),
    C('palv', 'Palvelulupaus', 'Hyvinvointialueet ja pandemia: lupauksen kantokyky kuormassa.', 340, 560, ['hyvinvointialueuudistus', 'koronapandemia']),
  ] },
  { id: 'paaoma', name: 'Pääoma ja ulkoinen kehys', text: 'Rahoitusmarkkinat, valuutta ja integraatio: kuka kantaa riskin ja kuka tuoton.', color: 'oklch(.66 .15 300)', x: 730, y: 500, r: 175, clusters: [
    C('raha', 'Rahoitusmarkkinat', 'Sääntelyn purku, lama ja Arsenal: riskin sosialisointi.', 680, 460, ['jaavuori-pankkisaantely-arsenal', '1990-luvun-lama']),
    C('integ', 'Integraatio', 'EU-jäsenyys: päätösvalta ja markkinat uuteen kehykseen.', 800, 560, ['suomen-eu-jasenyys-1995']),
  ] },
];

export const TENSIONS: Tension[] = [
  { id: 't1', a: 'aine', b: 'vaesto', name: 'Käyttämätön työpotentiaali', text: 'Tuottavuuden optimoinnin kääntöpuoli: työn ulkopuolelle jäävän potentiaalin kustannus voi ylittää optimoinnin hyödyn.' },
  { id: 't2', a: 'aine', b: 'paaoma', name: 'Ankkuri vs. kvartaalitalous', text: 'Alueellinen teollinen ankkuri muuttuu salkkuomaisuudeksi, jota voi myydä ensimmäisessä suhdannekuopassa.' },
  { id: 't3', a: 'vaesto', b: 'sopimus', name: 'Huoltosuhde vs. palvelulupaus', text: 'Lupaus mitoitettiin kasvavalle väestölle; ikääntyvä ja keskittyvä väestö kantaa sitä eri tavoin.' },
  { id: 't4', a: 'sopimus', b: 'paaoma', name: 'Lupaus ilman rahoituspohjaa', text: 'Palvelut sementoitiin lakiin ennen kuin rahoituspohja horjui 1990-luvun lamassa.' },
];

/** Step positions of a path: a time-ordered arc around its cluster centre. */
export function pathPoints(c: Cluster, ai: number) {
  const a = c.anchors[ai]; const n = c.anchors.length;
  const base = (ai / n) * Math.PI * 2;
  return a.steps.map((_, si) => {
    const t = si / Math.max(1, a.steps.length - 1);
    const ang = base + t * 1.6, rad = 14 + t * 46;
    return { x: c.x + Math.cos(ang) * rad, y: c.y + Math.sin(ang) * rad };
  });
}

export const LEVELS = [
  { key: 0, name: 'Kiertorata', hint: 'Mannerlaatat ja jännitevyöhykkeet' },
  { key: 1, name: 'Korkealento', hint: 'Klusterit' },
  { key: 2, name: 'Maanpinta', hint: 'Polut ja ketjut' },
  { key: 3, name: 'Kairausnäyte', hint: 'Valintapisteet ja evidenssi' },
];

export type Sel = { kind: 'plate'; plate: Plate } | { kind: 'tension'; t: Tension } | { kind: 'cluster'; c: Cluster } | { kind: 'path'; c: Cluster; a: PAnchor } | { kind: 'step'; c: Cluster; a: PAnchor; s: PStep } | null;

/** 2D world → lat/lon (degrees) so the 3D globe uses the same layout. */
export const toLatLon = (x: number, y: number) => ({ lon: (x / W - 0.5) * 170, lat: (0.5 - y / H) * 105 });
