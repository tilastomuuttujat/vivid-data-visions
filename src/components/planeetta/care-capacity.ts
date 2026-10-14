import snapshot from './care-capacity-data.json';
import budget from './budget-data.json';
export const careRegions=snapshot.regions;
export const careIndicators=snapshot.indicators;
export const careYears=Array.from({length:10},(_,i)=>2016+i);
export type CareMeasure='population'|'clients'|'coverage'|'cost'|'fixed'|'legal'|'hours';
const ids:Record<CareMeasure,string>={population:'171',clients:'5513',coverage:'5513',cost:'5439',fixed:'5679',legal:'6035',hours:'6037'};
type Cell={value:number;count:number|null};
export function careValue(region:number,year:number,measure:CareMeasure,real=false):number|null{
 const values=careRegions.find(r=>r.id===region)?.values as Record<string,Record<string,Cell>>|undefined;
 const cell=values?.[String(year)]?.[ids[measure]];
 if(!cell)return null;
 if(measure==='population'||measure==='clients')return cell.count;
 if(measure==='cost'&&real){const prices=budget.prices as Record<string,number>;return prices[String(year)]?cell.value*prices['2025']!/prices[String(year)]!:null;}
 return cell.value;
}
export function careIndex(region:number,year:number,measure:'population'|'clients',base=2016){
 const first=careValue(region,base,measure),value=careValue(region,year,measure);
 return first===null||value===null||first===0?null:value/first*100;
}
export const careLegalThreshold=(year:number)=>({2021:.55,2022:.60,2023:.65,2024:.65,2025:.60} as Record<number,number>)[year]??null;
export const careEvents=[
 {id:'care-accounting-2022',year:2022,title:'Iäkkäiden palvelujen kustannusluokitus muuttui',text:'Kotihoidon ja kotona asumisen tuen palveluluokat muuttuivat. Kustannusviiva katkaistaan; muutos ei yksin osoita palvelupanoksen kasvua.',url:'https://sotkanet.fi/rest/1.1/indicators/5439',kind:'Tilastokatkos',theme:'Vanhuspalvelut'},
 {id:'care-organisations-2023',year:2023,title:'Kunnista hyvinvointialueille',text:'Kustannusaineiston organisaatiorajaus muuttui. Ennen vuotta 2023 kuntayhtymien muut kuin kuntien kautta tulevat menot ja tulot eivät sisälly lukuihin. Vuoden 2023 nousua ei tulkita suoraan lisäresurssiksi.',url:'https://sotkanet.fi/rest/1.1/indicators/5439',kind:'Tilastokatkos',theme:'Vanhuspalvelut'},
 {id:'care-threshold-2025',year:2025,title:'Henkilöstömitoituksen vertailuraja aleni',text:'Vuoden viimeisen seurantajakson lakiraja aleni 0,65:stä 0,60:een. Lakirajan täyttävien yksiköiden osuuden kasvu ei siten yksin osoita henkilöstön lisääntymistä. Kiinteän 0,7-rajan sarja päättyy aineistossa vuoteen 2024.',url:'https://sotkanet.fi/rest/1.1/indicators/6035',kind:'Lainsäädäntö',theme:'Vanhuspalvelut'},
 {id:'care-survey-2025',year:2025,title:'Kotihoidon seurannan kattavuus muuttui',text:'Yksityisten yksiköiden rajaus muuttui julkisen sektorin kumppaneihin. Vastausprosentti laski 90,4:stä 85:een. Palvelutuntien toteutumisen viiva katkaistaan vuodelle 2025.',url:'https://sotkanet.fi/rest/1.1/indicators/6037',kind:'Tilastokatkos',theme:'Vanhuspalvelut'},
];
