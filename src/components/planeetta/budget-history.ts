import data from './budget-data.json';
import { cabinets } from './family-policy-data';

export type BudgetStage = 'actual' | 'proposal';
export type BudgetUnit = 'real' | 'nominal' | 'share';
export type BudgetPoint = { year:number; stage:BudgetStage; expense:Record<string,number|null>; income:Record<string,number|null>; expenseTotal:number|null; incomeTotal:number|null; expenseSource:string; incomeSource:string;incomeDetailSource:string|null;incomeDetailVerified:boolean };
export const budgetPoints = data.points as BudgetPoint[];
export const budgetPrices = data.prices as Record<string,number>;
export const budgetGroups = [
 {id:'29',name:'Opetus ja kulttuuri',color:'#6ee7d5',note:'Pääluokka 29 sisältää koulutuksen lisäksi tutkimusta, kulttuuria, liikuntaa ja nuorisotyötä. Kuntien oma rahoitus ei sisälly tähän. Varhaiskasvatuksen hallinnonalan siirto 2013 ja ammattikorkeakoulujen rahoitusuudistus 2015 muuttavat vertailua.'},
 {id:'30',name:'Maa- ja metsätalous',color:'#b4db72',note:'Pääluokka 30. Sisältää maa- ja metsätalouden sekä muita hallinnonalan tehtäviä; ei koko maaseudun julkinen rahoitus.'},
 {id:'31',name:'Liikenne ja viestintä',color:'#78b8ff',note:'Pääluokka 31. Sisältää sekä toimintaa että investointeja.'},
 {id:'32',name:'Työ ja elinkeinot',color:'#f5ad70',note:'Pääluokka 32. Vuonna 2008 perustettiin TEM: aiempi kauppa- ja teollisuusministeriön pääluokka ei kata samaa tehtäväjoukkoa. Ei pelkkä yritystukien mittari.'},
 {id:'33',name:'Sosiaali- ja terveysala',color:'#d4a4ff',note:'Pääluokka 33. Sisältää etuuksia ja rahoitussiirtoja. Hyvinvointialueiden yleiskatteinen rahoitus kuuluu vuodesta 2023 pääluokkaan 28.'},
 {id:'28',name:'VM:n hallinnonala ja rahoitussiirrot',color:'#ffcf70',note:'Pääluokka 28 sisältää muun muassa kuntien ja hyvinvointialueiden rahoitusta, valtion eläkkeitä ja EU-maksuja. Summaa ei pidä nimetä hallintokuluiksi.'},
 {id:'27',name:'Puolustus',color:'#f28b9f',note:'Pääluokka 27. Hankintojen ajoitus ja monivuotiset sitoumukset vaikuttavat vuosivertailuun.'},
 {id:'36',name:'Valtionvelan korot',color:'#d5dee7',note:'Pääluokka 36. Korkotaso ja aiemmin kertynyt velka vaikuttavat hallituksen aikana maksettuihin korkoihin.'},
];

export const incomeGroups = [
 {id:'11',name:'Verot ja veronluonteiset tulot',color:'#6ee7d5'},
 {id:'12',name:'Sekalaiset tulot',color:'#f5ad70'},
 {id:'13',name:'Korot, omistustulot ja osakemyynnit',color:'#d4a4ff'},
];
export const taxGroups = [
 {id:'directTaxes',name:'Tulon ja varallisuuden verot',color:'#6ee7d5'},
 {id:'turnoverExcise',name:'Liikevaihto- ja valmisteverot',color:'#f5ad70'},
 {id:'otherTaxes',name:'Muut verot ja veronluonteiset tulot',color:'#d4a4ff'},
];
export const proposalSource=(year:number)=>`https://budjetti.vm.fi/indox/tae/${year}/${year===2004?'he2_2004':year<=2012?`he_TAE_${year}`:`hallituksenEsitys_tae_${year}`}.jsp`;
export function budgetAuthor(year:number){
 const id=year<=2003?'lipponen-ii':year<=2007?'vanhanen':year<=2010?'vanhanen-ii':year===2011?'kiviniemi':year<=2014?'katainen':year===2015?'stubb':year<=2019?'sipila':year===2020?'rinne':year<=2023?'marin':'orpo';
 const old={ 'lipponen-ii':{name:'Lipponen II',parties:'SDP, Kokoomus, Vasemmistoliitto, RKP; Vihreät vuoteen 2002',pm:'SDP'},vanhanen:{name:'Vanhanen I',parties:'Keskusta, SDP, RKP',pm:'Keskusta'}};
 const cabinet=cabinets.find(c=>c.id===id)??old[id as keyof typeof old];
 const minister=year<=2003?'Sauli Niinistö (Kokoomus)':year<=2005?'Antti Kalliomäki (SDP)':year<=2007?'Eero Heinäluoma (SDP)':year<=2011?'Jyrki Katainen (Kokoomus)':year<=2014?'Jutta Urpilainen (SDP)':year===2015?'Antti Rinne (SDP)':year===2016?'Alexander Stubb (Kokoomus)':year<=2019?'Petteri Orpo (Kokoomus)':year===2020?'Mika Lintilä (Keskusta)':year===2021?'Matti Vanhanen (Keskusta)':year<=2023?'Annika Saarikko (Keskusta)':'Riikka Purra (PS)';
 return {id,name:cabinet.name,parties:cabinet.parties,pm:cabinet.pm,minister,source:year>=2002?proposalSource(year):'https://valtioneuvosto.fi/hallitukset-ja-ministerit/hallitukset/-/gov/lipponen-ii'};
}
export function executionCabinets(year:number){
 if(year<2007)return year<=2002?'Lipponen II':year===2003?'Lipponen II → Jäätteenmäki → Vanhanen I':'Vanhanen I';
 const active=cabinets.filter(c=>Number(c.start.slice(0,4))<=year&&(!c.end||Number(c.end.slice(0,4))>=year));
 return (year===2007?['Vanhanen I',...active.map(c=>c.name)]:active.map(c=>c.name)).join(' → ');
}
export const budgetPoint=(year:number,stage:BudgetStage)=>budgetPoints.find(p=>p.year===year&&p.stage===stage);
export function budgetValue(point:BudgetPoint|undefined,key:string,side:'expense'|'income',unit:BudgetUnit):number|null{
 const value=point?.[side][key];
 if(value===null||value===undefined||!point)return null;
 if(unit==='share'){
  const total=side==='expense'?point.expenseTotal:point.incomeTotal;
  return total&&total>0?value/total*100:null;
 }
 if(unit==='nominal')return value/1000;
 const price=budgetPrices[String(point.year)],base=budgetPrices['2024'];
 return price&&base?value*base/price/1000:null;
}

export const budgetEvents=[
 {id:'budget-2014',year:2014,title:'Vuoden 2014 budjettilinja: sopeutus ja verotuksen painopiste',kind:'Talousarvioesitys · annettu 2013',text:'Kataisen hallituksen esitys yhdisti menosäästöjä ja verotuksen muutoksia. Perusteluissa kuvattiin kuntien valtionosuuksien leikkauksia ja indeksikorotusten poisjättämistä. Yhteisöveroa ehdotettiin alennettavaksi 20 prosenttiin ja ympäristö- sekä terveysperusteisia veroja korotettaviksi. Tavoite ja esitetty tuottovaikutus eivät ole toteutuneen vaikutuksen mittaus.',url:'https://budjetti.vm.fi/sisalto.jsp?lang=fi&maindoc=/2014/tae/hallituksenEsitys/hallituksenEsitys.xml&opennode=0:1:3:19:&year=2014'},
 {id:'budget-2015',year:2015,title:'Vuoden 2015 budjetti: Stubb valmisteli, Sipilä muutti',kind:'Budjettivastuun vaihtuminen',text:'Alkuperäisen esityksen antoi Stubbin hallitus 15.9.2014, valtiovarainministerinä Antti Rinne. Sipilän hallitus aloitti 29.5.2015. Vuoden toteumaa ei kohdisteta kokonaan kummankaan hallituksen päätöksiksi; lisätalousarviot on tarkistettava erikseen.',url:proposalSource(2015)},
 {id:'budget-2020',year:2020,title:'Vuoden 2020 budjetti: Rinteen esitys ja Marinin kriisivuosi',kind:'Budjettivastuun vaihtuminen',text:'Alkuperäisen esityksen antoi Rinteen hallitus 7.10.2019. Marinin hallitus aloitti joulukuussa 2019 ja valmisteli vuoden 2020 lisätalousarviot. Alkuperäisen esityksen ja toteuman ero sisältää myös kriisin, tuloennusteiden ja määrärahojen käytön muutoksia.',url:proposalSource(2020)},
 {id:'budget-2023',year:2023,title:'Vuoden 2023 budjetti: Marinin esitys ja sote-siirto',kind:'Budjettivastuu ja vertailukatkos',text:'Alkuperäisen esityksen antoi Marinin hallitus 19.9.2022. Orpon hallitus aloitti 20.6.2023. Hyvinvointialueiden rahoitus ja verotulojen siirto kasvattivat valtion talousarviota: käyrän tasomuutos ei yksin tarkoita palvelujen kasvua.',url:proposalSource(2023)},
 {id:'budget-cancellation-2023',year:2023,title:'Vuoden 2023 tulot: käyttämättömän määrärahan peruutus',kind:'Kirjanpidon tulkinta',text:'Valtiokonttorin mukaan vuoden 2023 sekalaisiin tuloihin kirjattiin käyttämättömän 10 miljardin euron siirtomäärärahan peruutus. Se ei ollut uutta varsinaista tuloa valtiolle. Toteutumalaskelman ylijäämä sisältää myös nettolainanoton; sitä ei voi tulkita velattoman talouden ylijäämäksi.',url:'https://www.valtiokonttori.fi/uutinen/valtion-tilinpaatos-2023-visualisoituna/'},
].map(e=>({...e,theme:'Budjettivalta'}));
