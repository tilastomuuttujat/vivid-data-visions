import data from './local-adaptation-data.json';
import evidence from './local-adaptation-cases.json';
export type LocalPoint={year:number;population:number|null;workingAge:number|null;employed:number|null;unemployed:number|null;outside:number|null;jobs:Record<string,number|null>;domesticNet:number|null;internationalNet:number|null;naturalChange:number|null;educationPopulation:number|null;higherEducation:number|null;qualification:number|null;income:number|null;poverty:number|null;jobseekers:number|null;longTerm:number|null};
export type LocalMetric='jobs'|'industry'|'employed'|'workingAge';
export const localPlaces=data.places as {id:string;name:string;points:LocalPoint[]}[];
export const adaptationCases=evidence.cases;
export const adaptationEvidence=evidence.events;
export const localSources=data.sources;
export const localYears=Array.from({length:35},(_,i)=>1990+i);
export const localPoint=(id:string,year:number)=>localPlaces.find(p=>p.id===id)?.points.find(p=>p.year===year)??null;
export const localRatio=(a:number|null|undefined,b:number|null|undefined)=>a==null||b==null||b===0?null:a/b*100;
export function localValue(id:string,year:number,metric:LocalMetric){const p=localPoint(id,year);if(!p)return null;return metric==='jobs'?p.jobs['SSS']??null:metric==='industry'?p.jobs['C']??null:p[metric];}
export const localIndex=(id:string,year:number,metric:LocalMetric,base:number)=>localRatio(localValue(id,year,metric),localValue(id,base,metric));
export function localChange(id:string,year:number,metric:LocalMetric,base:number){if(year<base)return null;const v=localIndex(id,year,metric,base);return v===null?null:v-100;}
export const localEmploymentShare=(id:string,year:number)=>{const p=localPoint(id,year);return localRatio(p?.employed,p?.workingAge);};
export const localEducationShare=(id:string,year:number)=>{const p=localPoint(id,year);return localRatio(p?.higherEducation,p?.educationPopulation);};
export function firstReturn(caseId:string,metric:LocalMetric,through:number){
 const c=adaptationCases.find(c=>c.id===caseId);if(!c||through<c.eventYear||through>2024)return null;
 const base=localValue(c.place,c.eventYear-1,metric);if(base===null)return null;
 return localYears.filter(y=>y>c.eventYear&&y<=through).find(y=>{const v=localValue(c.place,y,metric);return v!==null&&v>=base;})??null;
}
export function localJobChanges(place:string,from:number,to:number){
 if(to<from)return null;const a=localPoint(place,from)?.jobs,b=localPoint(place,to)?.jobs;
 const keys=['A','C','F','J','M','Q'];if(!a||!b||['SSS',...keys].some(k=>a[k]==null||b[k]==null))return null;
 const groups=keys.map(id=>({id,value:b[id]!-a[id]!}));const total=b['SSS']!-a['SSS']!;
 return {total,groups:[...groups,{id:'other',value:total-groups.reduce((s,g)=>s+g.value,0)}]};
}
export const adaptationTimelineEvents=adaptationEvidence.map(e=>({id:`adapt-${e.id}`,year:e.year,title:`${adaptationCases.find(c=>c.id===e.caseId)!.name}: ${e.title}`,text:`${e.text} ${e.limit}`,kind:e.kind,url:e.url,theme:'Kuntien sopeutuminen'}));
