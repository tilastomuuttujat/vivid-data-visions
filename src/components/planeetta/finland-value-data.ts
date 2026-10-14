import { storaSnapshots } from './stora-comparison-data';
import { combinedBaselineTotal, ssabComparison, ssabSources } from './ssab-comparison-data';
export const valueSources={
 storaFinancials:'https://www.storaenso.com/-/media/documents/download-center/documents/annual-reports/2018/storaenso_financials_2018.pdf',
 storaInvestment:'https://www.storaenso.com/fi-fi/newsroom/regulatory-and-investor-releases/2017/10/stora-enso-investoi-94-miljoonaa-euroa-vauhdittaakseen-kasvua-uusiutuvissa-materiaaleissa',
 storaSale:'https://www.solidium.fi/tiedotteet/solidium-toteutti-onnistuneesti-stora-enso-oyj-n-rosakkeiden-myynnin/',
 solidiumReport:'https://www.solidium.fi/tiedotteet/solidium-oy-n-tilinpaatos-ja-puolivuosikatsaus-113062018/',
};
export type ValueObservation={year:number;finland:number|null;total:number|null;unit:string;basis:string;source:string;location:string};
export type ValueCompany={id:string;name:string;staff:ValueObservation[];pay:ValueObservation;investment:ValueObservation;dividend:ValueObservation;publicDividend:number|null;publicDividendNote:string;sale:ValueObservation;investmentEvent:string;saleNote:string};
export const valueCompanies:ValueCompany[]=[
 {id:'stora',name:'Stora Enso',staff:storaSnapshots.map(s=>({year:s.year,finland:s.finland,total:s.total,unit:'henkilöä',basis:s.basis,source:s.source,location:s.page})),
 pay:{year:2018,finland:null,total:1000,unit:'milj. EUR',basis:'Palkat; henkilöstökulut yhteensä 1 330 milj. EUR sisältävät myös muita eriä. Suomen palkkasummaa ei ole tässä aineistossa.',source:valueSources.storaFinancials,location:'Financials s. 34, liitetieto 6'},
 investment:{year:1998,finland:190.5,total:896.4,unit:'milj. EUR',basis:'Raportin vuoden investoinnit; ei 1998–2018 trendiä.',source:storaSnapshots[0]!.source,location:'Painettu s. 15, PDF-sivu 17'},
 dividend:{year:2018,finland:null,total:323,unit:'milj. EUR',basis:'Vuonna maksetut osingot emoyhtiön osakkaille; ei vuoden 2018 tuloksesta seuraavalle vuodelle tehty osinkoehdotus.',source:valueSources.storaFinancials,location:'Financials s. 22, rahavirtalaskelma'},
 publicDividend:null,publicDividendNote:'Solidiumin tai valtion saamaa yhtiökohtaista osinkoa ei ole varmennettu tässä aineistossa. Vuoden lopun omistusosuutta ei kerrota koko vuoden osingoilla.',
 sale:{year:2018,finland:246.4,total:null,unit:'milj. EUR',basis:'Laskettu bruttokauppahinta: 14 miljoonaa R-osaketta × 17,60 EUR. Vastaanottaja Solidium.',source:valueSources.storaSale,location:'Toteutunut osakemyynti 12.6.2018'},
 investmentEvent:'Vuonna 2017 ilmoitetut Enocellin 52 milj. EUR ja Imatran 42 milj. EUR hankkeet havainnollistavat Suomen tuotannon uudistamista. Ne eivät ole vuoden 2018 toteutunut maakohtainen investointisumma.',
 saleNote:'Bruttomyynti ei ole nettotuloutus valtion budjettiin: Solidium myös hankki 1,4 miljoonaa A-osaketta kesäkuussa 2018. Osakkeiden myynti vaihtaa omistusvarallisuutta rahaksi; koko kauppahinta ei ole uutta syntynyttä arvonlisäystä.'},
 {id:'ssab',name:'Rautaruukki–SSAB',staff:[{year:2013,finland:null,total:combinedBaselineTotal,unit:'henkilöä',basis:'SSAB + Rautaruukki vuoden lopussa. Ruukin Suomessa 5 218; SSAB:n vastaava maajako puuttuu.',source:ssabSources.ssab2013,location:'SSAB s. 38; Ruukin tilinpäätöstiedote PDF-sivu 12'}, {year:2024,finland:ssabComparison.later.finland,total:ssabComparison.later.total,unit:'henkilöä',basis:'SSAB vuoden lopussa, vakituiset ja määräaikaiset.',source:ssabSources.ssab2024,location:'Painetut s. 108–109'}],
 pay:{year:2024,finland:null,total:10156,unit:'milj. SEK',basis:'Konsernin palkat ja muut korvaukset; Suomen palkkasumma puuttuu. Ei vertailua Stora Enson euroihin ilman valuutta- ja hintatason oikaisua.',source:ssabSources.ssab2024,location:'S. 140, liitetieto B.4'},
 investment:{year:2024,finland:null,total:5375,unit:'milj. SEK',basis:'Raportoitu käyttöomaisuusinvestointien tunnusluku; Suomen vastaava maakohtainen luku puuttuu. Ei sama kuin rahavirtalaskelman maksetut investoinnit.',source:ssabSources.ssab2024,location:'S. 134: Capital expenditure, määritelmä ja laskenta'},
 dividend:{year:2024,finland:null,total:4983,unit:'milj. SEK',basis:'Vuonna maksettu osinko emoyhtiön osakkaille. Valtiolle maksettu osuus puuttuu; ei seuraavalle vuodelle tehty osinkoehdotus.',source:ssabSources.ssab2024,location:'S. 127: konsernin rahavirtalaskelma'},
 publicDividend:null,publicDividendNote:'Valtion 6,5 %:n vuoden lopun osakeosuus ja 8,3 %:n ääniosuus eivät yksin kerro vuoden aikana saadun osingon määrää.',
 sale:{year:2021,finland:null,total:null,unit:'milj. EUR',basis:'Noin 271 milj. EUR:n osakkeiden siirtopäätös Solidiumilta valtiolle; ei käteismyynti.',source:ssabSources.transfer,location:'Päätös 14.9.2021'},
 investmentEvent:'Vuoden 2024 Luulajan 4,5 mrd. EUR:n investointipäätös ja Raahen myöhempi suunniteltu vaihe ovat eri vaiheissa. Raahen puuttuva investointipäätös ei merkitse kaikkien Suomen investointien nollaa.',
 saleNote:'Vuoden 2021 omistuskanavan siirto ei ole myyntitulo. Tämä havainto ei myöskään tarkoita, ettei SSAB-osakkeita olisi myyty muina ajankohtina.'},
];
// Source: Financials 2018 p. 87. Cash tax footprint includes tax-like payments;
// own and collected amounts are separate, not added to salaries or dividends.
export const storaFinlandTaxes=[
 {year:2017,income:0,employment:90,operational:13,vat:35,payroll:144,other:67},
 {year:2018,income:1,employment:90,operational:13,vat:35,payroll:143,other:78},
];
export function taxTotals(t:typeof storaFinlandTaxes[number]){const own=t.income+t.employment+t.operational;const collected=t.vat+t.payroll+t.other;return {own,collected,total:own+collected};}
export function observedShare(o:ValueObservation){return o.finland===null||o.total===null||o.total<=0?null:o.finland/o.total*100;}
