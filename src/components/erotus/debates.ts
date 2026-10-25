/** Curated A-vs-B pairings. Claims and readings are editorial interpretations, not proven causal findings. */
/** bAsCost: B is read as a cost the whole must carry, so its impact is drawn below the total. */
/** bCostPoints: editorial cost magnitude by year (impact points on the total), replacing B's own curve. */
export type Debate = { id: string; title: string; a: string; b: string; claim: string; reading: string; bAsCost?: boolean; bLabel?: string; bCostPoints?: [number, number][] };

/** Linear interpolation of an editorial cost curve; 0 before the first point. */
export function costAt(points: [number, number][], year: number): number {
  if (year <= points[0]![0]) return points[0]![1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i]!, [x0, y0] = points[i - 1]!;
    if (year <= x1) return y0 + ((year - x0) / (x1 - x0)) * (y1 - y0);
  }
  return points.at(-1)![1];
}

export const DEBATES: Debate[] = [
  { id: "sukupolvet", title: "Sukupolvisota: kuka maksaa viulut?", a: "suuret", b: "lapset",
    claim: "Suuret ikäluokat veivät kaiken ja jättivät laskun nuorille.",
    reading: "Suuret ikäluokat kantoivat kokonaisuutta työiässään 1970–2005: verotulot, teollisuus ja hyvinvointipalvelut rakentuivat heidän työpanoksensa varaan. Kuorma syntyy rakenteesta – suuri ikäluokka siirtyy kerralla eläkkeelle ja seuraajat ovat pieniä – ei yhden sukupolven ahneudesta." },
  { id: "vienti", title: "Nokia vs. metsä: kuka kantoi vientiä?", a: "metsa", b: "ict",
    claim: "Nokia pelasti Suomen, metsäteollisuus oli menneen maailman jäänne.",
    reading: "Metsä kannatteli kokonaisuutta sata vuotta; ICT korvasi sen vain lyhyen jakson 1995–2010. Kun paperin kysyntä ja Nokia romahtivat samaan aikaan 2008–2012, kumpikaan ei enää kantanut – ongelma oli yhden kantajan varaan rakentuminen, ei kumpikaan ala sinänsä." },
  { id: "velka", title: "Julkinen velka: tuhlausta vai oire?", a: "velka", b: "tuottavuus",
    claim: "Velkaantuminen johtuu holtittomasta kulutuksesta.",
    reading: "Velka kasvoi ryöpsähdyksinä kriisien jälkeen (1993, 2009, 2020), kun tuottavuuden kasvu oli pysähtynyt. Velka näyttää enemmän oireelta hyytyneestä tuottavuudesta ja ikääntymisestä kuin itsenäiseltä syyltä." },
  { id: "sopeutus", title: "Tuottavuus vs. työttömyyden hinta: kuka maksaa sopeutuksen?", a: "tuottavuus", b: "perusturva",
    bAsCost: true, bLabel: "Käyttämättömän työpanoksen korjauskustannus",
    // Toimituksellinen tulkinta: pieni täystyöllisyyden aikana, hyppää laman 1991–93 myötä ja kasvaa uudelleen 2008 jälkeen.
    bCostPoints: [[1860, 0], [1930, 0.03], [1945, 0.04], [1975, 0.04], [1989, 0.05], [1994, 0.17], [2001, 0.15], [2008, 0.14], [2016, 0.17], [2025, 0.18], [2050, 0.16]],
    claim: "Työn tuottavuuden kasvu rikastuttaa automaattisesti koko yhteiskuntaa.",
    reading: "Kun tuottavuuden kasvu työllisti (1950–1990), hyöty ylitti selvästi käyttämättömän työpanoksen kustannuksen. Laman 1991–93 jälkeen tuottavuus palautui tehostamalla, mutta työttömyys jäi pysyväksi ja sen toimeentulo julkisen talouden maksettavaksi. Kun tuottavuuden kasvu hyytyi 2008 jälkeen, korjauskustannus ylitti hyödyn ja erotus on katettu velalla. Työvoiman ylitarjonta myös hillitsi palkkojen nousua. Kustannuskäyrä on toimituksellinen tulkinta, ei mitattu nettoluku." },
  { id: "sopiminen", title: "Sopimusyhteiskunnan hinta", a: "sopiminen", b: "paaoma",
    claim: "Ammattiliitot ja tulopolitiikka jäykistävät talouden.",
    reading: "Tulopolitiikka vakautti ja loi luottamusta 1968–1990, mikä tuki investointeja. 2010-luvulla sama malli sopeutui hitaammin, mutta investointien heikkous liittyy myös pääomien ja teollisuuden rakennemuutokseen." },
  { id: "vaesto", title: "Syntyvyys vs. maahanmuutto", a: "syntyvyys", b: "maahanmuutto",
    claim: "Maahanmuutto on uhka – tai vaihtoehtoisesti ratkaisu kaikkeen.",
    reading: "Syntyvyyden pudotus painaa kokonaisuutta vuosikymmenten viiveellä. Maahanmuutto voi paikata työikäistä väestöä vain osin ja hitaasti, joten kumpikaan ei yksin ratkaise kantokyvyn kysymystä." },
];

/** Cumulative area of a yearly net-impact series (points × years): stock, not flow. */
export function cumulativeNet(s: { year: number; delta: number }[], upTo = Infinity) {
  let gain = 0, cost = 0;
  for (let i = 1; i < s.length; i++) {
    const a = s[i - 1]!, b = s[i]!;
    if (b.year > upTo) break;
    const area = ((a.delta + b.delta) / 2) * (b.year - a.year) * 100;
    if (area >= 0) gain += area; else cost -= area;
  }
  return { gain, cost, net: gain - cost };
}
