import data from './ownership-cashflow-data.json';
import { valueCompanies, storaFinlandTaxes, taxTotals } from './finland-value-data';
export const ownershipCashflow=data;
export const cashflowYears=Array.from({length:8},(_,i)=>2018+i);
export const saleGross=data.storaSale.sharesMillion*data.storaSale.price;
const millisPerYear=365.25*24*60*60*1000;
const elapsed=(date:string)=>(Date.parse(date)-Date.parse(data.storaSale.date))/millisPerYear;
export function soldBlockDividends(year:number){
 if(year<2018||year>2025||!Number.isInteger(year))return null;
 return data.dividends.filter(d=>Number(d.date.slice(0,4))<=year).map(d=>({...d,amountMillion:d.perShare*data.storaSale.sharesMillion}));
}
export function ownershipScenario(year:number,terminalPrice:number,discountPercent:number){
 const dividends=soldBlockDividends(year);
 if(!dividends||!Number.isFinite(terminalPrice)||terminalPrice<0||!Number.isFinite(discountPercent)||discountPercent<0||discountPercent>100)throw new RangeError('Invalid ownership scenario');
 const rate=discountPercent/100,cutoff=`${year}-12-31`;
 const nominalDividends=dividends.reduce((s,d)=>s+d.amountMillion,0);
 const dividendPV=dividends.reduce((s,d)=>s+d.amountMillion/(1+rate)**elapsed(d.date),0);
 const nominalAsset=data.storaSale.sharesMillion*terminalPrice;
 const assetPV=nominalAsset/(1+rate)**elapsed(cutoff);
 return {nominalDividends,dividendPV,nominalAsset,assetPV,retainedPV:dividendPV+assetPV,salePV:saleGross,priceForEqualPV:Math.max(0,(saleGross-dividendPV)*(1+rate)**elapsed(cutoff)/data.storaSale.sharesMillion)};
}
export function benefitChannels(id:string){
 const company=valueCompanies.find(c=>c.id===id);
 if(!company)return [{name:'Työntekijät',value:null,unit:'',scope:'Vertailukelpoinen Suomen palkkasumma puuttuu.'},{name:'Osakkeenomistajat',value:null,unit:'',scope:'Sampo-konsernin voitonjako ei seuraa suoraan pankkikaupan hintaa.'},{name:'Julkinen talous',value:null,unit:'',scope:'Valtion myyntitulot ja osingot on jäljitettävä erikseen.'}];
 return [{name:'Työntekijät',value:company.pay.total,unit:company.pay.unit,scope:`${company.pay.year}: koko konsernin palkat, ei Suomen palkkasumma.`},{name:'Osakkeenomistajat',value:company.dividend.total,unit:company.dividend.unit,scope:`${company.dividend.year}: kaikille osakkaille maksettu osinko; julkisen omistajan osuus puuttuu.`},{name:'Julkinen talous',value:id==='stora'?taxTotals(storaFinlandTaxes[1]!).own:null,unit:'milj. EUR',scope:id==='stora'?'2018: yhtiön omat Suomen verot ja veronluonteiset maksut. Muiden puolesta tilitetyt 256 milj. EUR erikseen.':'Suomen verojalanjälki puuttuu; konsernin tuloveroa ei sijoiteta Suomeen.'}];
}
export const cashflowEvents=[
 {id:'cashflow-sampo-2007',year:2007,title:'Pankkikaupan raha menee Sammolle',text:'Danske-kaupan 4,05 miljardin euron käteishinnan saaja oli Sampo. Valtion osakemyynnit ja osingot ovat tästä erillisiä virtoja.',url:data.sources.sampoClosing,kind:'Toteutunut kauppa',theme:'Omistus ja tulovirrat'},
 {id:'cashflow-stora-2018',year:2018,title:'Osinkovirtaa vaihdetaan myyntituloon',text:'Solidium myi 14 miljoonaa Stora Enson R-osaketta ja hankki samalla A-osakkeita. Osakeosuus pieneni, mutta ääniosuus säilyi. Myyntitulo ei ole suoraan valtion budjettitulo.',url:data.sources.sale,kind:'Omistusjärjestely',theme:'Omistus ja tulovirrat'},
 {id:'cashflow-ssab-2021',year:2021,title:'Omistus siirtyy julkisen omistuksen sisällä',text:'SSAB-osakkeiden siirtopäätös Solidiumilta valtiolle tehtiin pääoman palautuksena osakkeissa. Päätöksen noin 271 miljoonaa euroa kuvaa varallisuuden arvoa, ei käteismyyntiä.',url:data.sources.ssabTransfer,kind:'Omistuskanavan muutos',theme:'Omistus ja tulovirrat'},
 {id:'cashflow-assessment-2025',year:2025,title:'Omistajaohjaus arvioi myynnin ja tulevan velanoton yhteyttä',text:'VNK:n omistajaohjaus nosti esiin, että hyvää osinkovirtaa tuottavien omistusten myynti investointiohjelman rahoittamiseksi voi lisätä myöhempää velanottotarvetta. Tämä on viranomaisen ehdollinen arvio, ei kaikkien historiallisten myyntien todistettu vaikutus.',url:data.sources.publicAssessment,kind:'Viranomaisen arvio',theme:'Omistus ja tulovirrat'},
];
