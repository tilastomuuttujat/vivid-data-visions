import snapshot from './work-opportunity-data.json';
import regional from './regional-path-data.json';
import productivity from './productivity-data.json';
export type WorkPoint={year:number;workingAge:number|null;employed:number|null;unemployed:number|null;outside:number|null;jobs:Record<string,number|null>;jobseekers:number|null;longTerm:number|null;vacancies:number|null;domesticNet:number|null;internationalNet:number|null;naturalChange:number|null};
export const workRegions=snapshot.regions as {id:string;name:string;points:WorkPoint[]}[];
export const workSources=snapshot.sources;
export const workYears=Array.from({length:38},(_,i)=>1987+i);
export const workPoint=(id:string,year:number)=>workRegions.find(r=>r.id===id)?.points.find(p=>p.year===year)??null;
export function ratio(n:number|null|undefined,d:number|null|undefined){return n==null||d==null||d===0?null:n/d*100;}
export function workIndex(id:string,year:number,key:'workingAge'|'employed'|'jobseekers'|'longTerm'|'vacancies',base:number){return ratio(workPoint(id,year)?.[key],workPoint(id,base)?.[key]);}
export const employmentShare=(id:string,year:number)=>{const p=workPoint(id,year);return ratio(p?.employed,p?.workingAge);};
export const longTermShare=(id:string,year:number)=>{const p=workPoint(id,year);return ratio(p?.longTerm,p?.jobseekers);};
export const workIncome=(id:string,year:number)=>regional.regions.find(r=>r.id===id)?.points.find(p=>p.year===year)?.income??null;
export const workPoverty=(id:string,year:number)=>regional.regions.find(r=>r.id===id)?.points.find(p=>p.year===year)?.poverty??null;
export const incomeIndex=(id:string,year:number)=>year<2010?null:ratio(workIncome(id,year),workIncome(id,2010));
export const earningsIndex=(year:number)=>year<2010?null:ratio(productivity.series.find(p=>p.year===year)?.realEarnings,productivity.series.find(p=>p.year===2010)?.realEarnings);
export const jobGroups=[['A','Maa-, metsä- ja kalatalous'],['C','Teollisuus'],['F','Rakentaminen'],['J','Informaatio ja viestintä'],['M','Ammatillinen, tieteellinen ja tekninen toiminta'],['Q','Terveys- ja sosiaalipalvelut'],['other','Muut ja tuntematon']] as const;
export function jobChanges(id:string,from:number,to:number){
 const a=workPoint(id,from)?.jobs,b=workPoint(id,to)?.jobs;
 if(!a||!b||['SSS','A','C','F','J','M','Q'].some(k=>a[k]==null||b[k]==null))return null;
 const groups=jobGroups.slice(0,-1).map(([id,name])=>({id,name,value:b[id]!-a[id]!}));
 const total=b['SSS']!-a['SSS']!;
 return {total,groups:[...groups,{id:'other',name:'Muut ja tuntematon',value:total-groups.reduce((sum,g)=>sum+g.value,0)}]};
}
export const workEvents=[
 {id:'work-register-2017',year:2017,title:'Työnhakijarekisteriä ajantasaistettiin',text:'Määräaikaishaastattelut johtivat työnhakijarekisterin päivityksiin. Työttömien määrän laskua ei pidä tulkita kokonaan työllistymiseksi. Tarkkaa vaikutusta ei tunneta.',url:'https://stat.fi/fi/dokumentaatio/tilastojen-dokumentaatio/tyokay',kind:'Tilastokatkos',theme:'Työn kysyntä ja turva'},
 {id:'work-income-register-2019',year:2019,title:'Tulorekisteri tuli työssäkäyntitilaston lähteeksi',text:'Tulorekisteri korvasi useita aiempia työsuhdeaineistoja. Työllisten ja työpaikkojen kuvaajat katkaistaan tässä lähdemuutoksessa.',url:'https://stat.fi/fi/dokumentaatio/tilastojen-dokumentaatio/tyokay',kind:'Tilastokatkos',theme:'Työn kysyntä ja turva'},
];
