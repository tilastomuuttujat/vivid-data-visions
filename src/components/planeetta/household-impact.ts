import examples from './household-example-data.json';
export { examples };
export type HouseholdPoint={year:number;gross:number;transfers:number;taxes:number;net:number;taxShare:number};
export type HouseholdExample={id:string;name:string;description:string;page:number;points:HouseholdPoint[]};
export type HouseholdVintage={id:string;published:string;calculated:string;forecastFrom:number;url:string;web:string;earningsNote:string;profiles:HouseholdExample[]};
export const householdVintages=examples.vintages as HouseholdVintage[];
export function householdPoint(vintage:string,profile:string,year:number):HouseholdPoint|null{
 return householdVintages.find(v=>v.id===vintage)?.profiles.find(p=>p.id===profile)?.points.find(p=>p.year===year)??null;
}
export function householdChange(vintage:string,profile:string,from:number,to:number){
 const a=householdPoint(vintage,profile,from),b=householdPoint(vintage,profile,to);
 if(!a||!b)return null;
 const gross=b.gross-a.gross,transfers=b.transfers-a.transfers,taxEffect=a.taxes-b.taxes,net=b.net-a.net;
 return {gross,transfers,taxEffect,net,rounding:net-gross-transfers-taxEffect,percent:net/a.net*100};
}
export const distribution2018={
 source:'https://julkaisut.valtioneuvosto.fi/server/api/core/bitstreams/cd8829d5-fe2a-456f-b962-fdf46805b87e/content',
 page:21,
 metrics:[{id:'gini',name:'Gini-kerroin'},{id:'poverty',name:'Pienituloisuus, koko väestö (60 %)'},{id:'children',name:'Lasten pienituloisuus (60 %)'},{id:'older',name:'Yli 65-vuotiaiden pienituloisuus (60 %)'}],
 variants:{
  A:{name:'A: muutokset suhteessa hintatasoon',base:[27.2,13.0,12.0,11.8],changes:{'0':[.3,.6,.8,1.0],'0.1':[.3,.5,.5,1.1],'0.25':[.2,.4,.1,1.3],'0.5':[0,.2,-.6,1.7]}},
  B:{name:'B: hallituksen aktiivisiksi tulkitut päätökset',base:[27.4,13.0,12.2,11.8],changes:{'0':[.2,.6,.6,1.0],'0.1':[.1,.4,.2,1.1],'0.25':[0,.3,-.4,1.4],'0.5':[-.2,0,-1.3,1.9]}},
 },
};
export type DistributionVariant=keyof typeof distribution2018.variants;
export type DistributionElasticity=keyof typeof distribution2018.variants.A.changes;
export const impactSources={
 kela:'https://www.kela.fi/ajankohtaista/kelan-laskelma-sosiaaliturvan-leikkaukset-heikentavat-kannustimia-pienipalkkaiseen-ja-osa-aikaiseen-tyohon-kelan-tyottomyysturvaa-saavilla',
 thl:'https://blogi.thl.fi/aktiivimalli-lisaa-toimeentulotuen-tarvetta-mutta-ei-juuri-kasvata-pienituloisten-maaraa/',
};
export const householdImpactEvents=[
 {id:'household-study-2018',year:2018,title:'Verojen ja etuuksien yhteisvaikutus: tulos riippuu myös oletuksista',kind:'Julkaistu mikrosimulointitutkimus',text:'Kärkkäisen ja Tervolan vuoden 2018 tutkimus vertaa joulukuun 2015 ja 2018 sääntöjä samassa väestöaineistossa. Aktiivisten päätösten rajaus ja oletettu työn tarjonnan jousto muuttavat tuloksia. Arvioitu työllisyysvaikutus ei ole havaittu työllisyyslisäys.',url:distribution2018.source},
 {id:'household-active-2019',year:2019,title:'Aktiivimallin leikkausta kompensoivat muut etuudet ja verotus',kind:'Julkaistu staattinen vaikutusarvio',text:'THL:n tutkijan laskelmassa alimman tulokymmenyksen lopullinen tulonmenetys oli noin neljännes työttömyysetuuden leikkauksesta. Asumistuki, toimeentulotuki ja verotus muuttivat yhteisvaikutusta. Tämä ei osoita kompensaation toteutuneen jokaiselle.',url:impactSources.thl},
 {id:'household-kela-2024',year:2024,title:'Kelan esimerkkilaskelma: pienipalkkaisen työn kannustimet',kind:'Kahden esimerkkitalouden mikrosimulointi',text:'Kelan vuoden 2024 laskelmassa yksinhuoltajan toimeentulotukioikeuden palkkaraja nousi noin 150 eurosta 1 050 euroon kuukaudessa. Työn lisätuloa leikkaavat sekä verot että etuuksien pieneneminen. Tulokset koskevat lähteen helsinkiläisiä esimerkkitalouksia.',url:impactSources.kela},
 {id:'household-labore-2024',year:2024,title:'Esimerkkiperheet 2024: tulot, etuudet ja verot rinnakkain',kind:'Julkaisuhetken esimerkkilaskelma ja ennuste',text:'Laboren 10.10.2024 raportin kuvitteelliset kotitaloudet näyttävät bruttotulojen, tulonsiirtojen ja verojen yhteisvaikutuksen. Laskelma sisältää palkka-, hinta- ja politiikkaoletuksia; sitä ei tulkita koko väestön toteumaksi.',url:householdVintages.find(v=>v.id==='2024')!.web},
 {id:'household-labore-2025',year:2025,title:'Esimerkkiperheet 2025: muuttuneet oletukset on pidettävä näkyvissä',kind:'Päivitetty esimerkkilaskelma ja ennuste',text:'Laboren 29.10.2025 raportissa ansiopäivärahaesimerkki rajataan täyteen päivärahaan ensimmäisten 40 päivärahapäivän aikana. Porrastusta ei siinä huomioida. Julkaisujen välisestä erosta ei voi päätellä sääntömuutoksen vaikutusta.',url:householdVintages.find(v=>v.id==='2025')!.web},
].map(e=>({...e,theme:'Kotitalouksien toimeentulo'}));
