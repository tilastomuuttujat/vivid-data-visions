/** Curated A-vs-B pairings. Claims and readings are editorial interpretations, not proven causal findings. */
export type Debate = { id: string; title: string; a: string; b: string; claim: string; reading: string };

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
  { id: "sopiminen", title: "Sopimusyhteiskunnan hinta", a: "sopiminen", b: "paaoma",
    claim: "Ammattiliitot ja tulopolitiikka jäykistävät talouden.",
    reading: "Tulopolitiikka vakautti ja loi luottamusta 1968–1990, mikä tuki investointeja. 2010-luvulla sama malli sopeutui hitaammin, mutta investointien heikkous liittyy myös pääomien ja teollisuuden rakennemuutokseen." },
  { id: "vaesto", title: "Syntyvyys vs. maahanmuutto", a: "syntyvyys", b: "maahanmuutto",
    claim: "Maahanmuutto on uhka – tai vaihtoehtoisesti ratkaisu kaikkeen.",
    reading: "Syntyvyyden pudotus painaa kokonaisuutta vuosikymmenten viiveellä. Maahanmuutto voi paikata työikäistä väestöä vain osin ja hitaasti, joten kumpikaan ei yksin ratkaise kantokyvyn kysymystä." },
];
