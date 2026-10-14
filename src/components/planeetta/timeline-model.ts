import { budgetEvents, budgetPoints, budgetValue } from './budget-history';
import { structuralTimelineEvents } from './structural-choices';
import { fertility, familyPolicyEvents } from './family-policy-data';
import { lawEvents } from './law-history';
import { policyRecords } from './policy-history';
import { electionYears, partySeries, historicalSources } from './historical-election-data';
import productivity from './productivity-data.json';
import regions from './regional-path-data.json';
import redistribution from './redistribution-data.json';
import wealth from './housing-wealth-data.json';
import debt from './public-debt-data.json';
import { ownershipEvents } from './OwnershipPath';
import { storaSnapshots } from './stora-comparison-data';
export type TimelinePoint={year:number;value:number|null};
export type TimelineSeries={name:string;color:string;points:TimelinePoint[];sparse?:boolean;breaks?:number[]};
export type TimelineLane={id:string;name:string;unit:string;source:string;series:TimelineSeries[];note:string};
const colors=['#65d9ec','#ffad83','#d5a4f1'];
const source=(ds:string,id:string)=>`https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__${ds}/${id}.px/`;
export const timelineRegions=regions.regions.filter(r=>r.id!=='SSS');
export function timelineLanes(regionId:string):TimelineLane[]{
 const region=regions.regions.find(r=>r.id===regionId)!;
 const national=redistribution.regions.find(r=>r.id==='SSS')!;
 const state=debt.sectors.find(r=>r.id==='S1311')!;
 const kok=partySeries.find(p=>p.id==='kok')!;
 const indexed=(key:'population'|'jobs',baseYear:number)=>{const base=region.points.find(p=>p.year===baseYear)![key];return region.points.filter(p=>p.year>=baseYear).map(p=>({year:p.year,value:p[key]===null||base===null?null:p[key]!/base*100}));};
 return [
  {id:'budget',name:'Budjetin menojen painopisteet',unit:'% menoista ilman velan lyhennyksiä',source:'https://budjetti.vm.fi/',note:'Valtion talousarviotalouden toteumat 2000–2024, eri käsite kuin tilinpidon menot. Opetusalan rahoitussiirrot 2013 ja 2015 katkaisevat sarjan.',series:([['29','Opetus ja kulttuuri'],['30','Maa- ja metsätalous'],['36','Velan korot']] as const).map(([key,name],i)=>({name,color:colors[i]!,breaks:key==='29'?[2013,2015]:[],points:budgetPoints.filter(p=>p.stage==='actual').map(p=>({year:p.year,value:budgetValue(p,key,'expense','share')}))}))},
  {id:'fertility',name:'Syntyvyys',unit:'kokonaishedelmällisyysluku',source:fertility.source,note:'Vuosisarja 2010–2025; ei lopullinen lapsiluku eikä hallitusvaikutuksen mittari.',series:[{name:'Kokonaishedelmällisyysluku',color:'#65d9ec',points:fertility.points.map(p=>({year:p.year,value:p.tfr}))}]},
  {id:'politics',name:'Kokoomuksen kannatus',unit:'ääniosuus, %',source:historicalSources.results,note:'Vain vaalivuosien havainnot; nykyinen sarja päättyy 1991.',series:[{name:'Kokoomus',color:colors[0]!,sparse:true,points:electionYears.map((year,i)=>({year,value:kok.values[i]!}))}]},
  {id:'work',name:'Tuottavuus ja reaaliansiot',unit:'1980=100',source:source('ttut','14w1'),note:'Tuottavuuden ja ansioiden kattavuus eroaa; lähteet ja laskenta tarkemmassa näkymässä.',series:([['productivity','Tuottavuus'],['realEarnings','Reaaliansiot']] as const).map(([key,name],i)=>({name,color:colors[i]!,points:productivity.series.map(p=>({year:p.year,value:p[key]}))}))},
  {id:'region',name:region.name,unit:'väestö 1990=100; työ 2000=100',source:source('vaerak','11ra'),note:'Sarjojen perusvuodet eroavat. Vertaa ajoitusta ja kehitystä, älä viivojen tasoeroa.',series:[{name:'Väestö (1990=100)',color:colors[0]!,points:indexed('population',1990)},{name:'Työllisyys (2000=100)',color:colors[1]!,points:indexed('jobs',2000)}]},
  {id:'redistribution',name:'Tuloerot ja uudelleenjako',unit:'Gini, 0–100',source:source('tjt','14ww'),note:'Koko maa. Tulokäsite muuttui 2010; viivat katkaistaan.',series:([['gini_tuotektu','Ennen tulonsiirtoja'],['gini_bruttotu','Bruttotulot'],['gini_kturaha','Käytettävissä olevat rahatulot']] as const).map(([key,name],i)=>({name,color:colors[i]!,breaks:[2010],points:national.points.map(p=>({year:p.year,value:p[key]}))}))},
  {id:'wealth',name:'Nettovarallisuus',unit:'mediaani, € (2023)',source:source('vtutk','151z'),note:'Vain tutkimusvuodet. Menetelmät ja ryhmät eroavat eri aikoina; tarkempi näkymä kertoo rajaukset.',series:[['1','Velaton omistaja'],['2','Asuntovelallinen'],['3','Vuokra tai muu']].map(([group,name],i)=>({name:name!,color:colors[i]!,sparse:true,points:wealth.wealth.filter(p=>p.group===group).map(p=>({year:p.year,value:p.median}))}))},
  {id:'housing',name:'Asumisen rasitus',unit:'nettokustannusten tulo-osuus, %',source:source('tjt','12g4'),note:'Mediaanit. Nettokustannusten määritelmä muuttui 2023.',series:[['1','Oma asunto'],['2','Vuokra-asunto']].map(([group,name],i)=>({name:name!,color:colors[i]!,breaks:[2023],points:wealth.housing.filter(p=>p.group===group).map(p=>({year:p.year,value:p.costShare}))}))},
  {id:'debt',name:'Valtionvelka',unit:'% BKT:stä',source:debt.treasury.source,note:'Valtiokonttorin velkarajaus; bruttovelka. Koostetaulukon päivityskierros voi erota tilinpidosta.',series:[{name:'Valtionvelka',color:colors[0]!,points:debt.treasury.points.map(p=>({year:p.year,value:p.gdpRatio}))}]},
  {id:'finance',name:'Valtion tulot ja menot',unit:'% BKT:stä',source:source('ntp','15ah'),note:'Valtionhallinnon tilinpito, ei budjettikassavirta. Sote muutti rahoitusvastuuta 2023.',series:([['OTRU_ntp-bkt_suhde','Tulot'],['OTEU_ntp-bkt_suhde','Menot'],['D411K_ntp-bkt_suhde','Todelliset korot']] as const).map(([key,name],i)=>({name,color:colors[i]!,points:state.points.map(p=>({year:p.year,value:p[key]}))}))},
 ];
}
export const exactValue=(series:TimelineSeries,year:number)=>series.points.find(p=>p.year===year)?.value??null;
export type TimelineEvent={id:string;year:number;title:string;text:string;url:string;kind:string;policyId?:string;lawId?:string;familyId?:string;structuralId?:string;theme?:string};
export const timelineEvents:TimelineEvent[]=[
 ...budgetEvents,
 ...structuralTimelineEvents,
 ...familyPolicyEvents.map(e=>({id:`family-${e.id}`,familyId:e.id,year:e.year,title:`${e.date}: ${e.title}`,text:e.text,url:e.url,kind:e.kind,theme:'Perheet ja työvoima'})),
 ...lawEvents,
 ...policyRecords.map(p=>({id:`policy-${p.id}`,year:p.year,title:`${p.date}: ${p.title}`,text:`${p.phase}. Päätöksen sisältö, vastuut ja arviot eritellään alla.`,url:p.sources[0]!.url,kind:p.phase,theme:p.theme,policyId:p.id})),
 ...electionYears.map((year,i)=>({id:`election-${year}`,year,title:`Eduskuntavaalit ${year}`,text:`Kokoomuksen ääniosuus ${partySeries[0]!.values[i]} %. Vaalitulos ei yksin kerro äänestäjän motiivia.`,url:historicalSources.results,kind:'Vaalihavainto'})),
 ...ownershipEvents.map((e,i)=>({id:`ownership-${i}`,year:Math.floor(e.year),title:`${e.date}: ${e.title}`,text:`${e.text} ${e.limit}`,url:e.url,kind:'Omistus ja työ',theme:e.lane===2?'Työn ehdot':'Omistus'})),
 ...storaSnapshots.map(e=>({id:`stora-${e.year}`,year:e.year,title:`Stora Enso: henkilöstöhavainto ${e.year}`,text:`Suomessa ${e.finland}, konsernissa ${e.total}. ${e.basis}. Vuosien 1998 ja 2018 mittaustavat eroavat; väliin ei muodosteta henkilöstösarjaa.`,url:e.source,kind:'Yrityshavainto'})),
 {id:'research',year:1991,title:'Vaalit, puolueet ja yhteiskunnan muutos',text:'Tutkimuksen julkaisuvuosi. Kuntatutkimuksen tarkastelu 1962–1983 liittyy Kokoomuksen kasvun ja elinkeinorakenteen yhteyteen, ei vuoden 1991 äänestäjien veromotiiveihin.',url:historicalSources.research,kind:'Tutkimus'},
 {id:'statoil',year:2001,title:'Statoilin osittainen yksityistäminen',text:'Norja listasi Statoilin mutta säilytti valtion määräysvallan. Öljyvarannon ja siirrettävän teollisuustuotannon ero rajoittaa maiden vertailua.',url:'https://www.regjeringen.no/no/dokumenter/Stmeld-nr-38-2003-2004-/id404848/?ch=4',kind:'Vertailutapaus'},
 {id:'income-break',year:2010,title:'Tulokäsitteen muutos',text:'Vuosien 1995–2009 ja 2010–2024 tulonjakosarjat eivät ole täysin vertailukelpoisia.',url:source('tjt','14ww'),kind:'Tilastokatkos'},
 {id:'housing-break',year:2023,title:'Nettokustannusten määritelmä muuttui',text:'Perustoimeentulotuen varsinaisia asumiskustannuksia käsitellään asumistukien tavoin. Asumisrasituksen viiva katkaistaan tässä kohdassa.',url:source('tjt','12g4'),kind:'Tilastokatkos'},
 {id:'sote',year:2023,title:'Hyvinvointialueiden rahoitusvastuun muutos',text:'Valtion rahoitusvastuu kasvoi kun sote ja pelastustoimi siirtyivät kunnilta hyvinvointialueille. Valtion tasonmuutosta ei tulkita yksin koko julkisen talouden kasvuksi.',url:'https://budjetti.vm.fi/indox/sisalto.jsp?lang=fi&maindoc=%2F2024%2Ftae%2FhallituksenEsitys%2FhallituksenEsitys.xml&opennode=0%3A1%3A3%3A19%3A&year=2024',kind:'Rahoituspäätös'},
].sort((a,b)=>a.year-b.year);
