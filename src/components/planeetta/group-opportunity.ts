import data from './group-opportunity-data.json';
export const groupRegions=data.regions;
export const educationGroups:[string,string][]=[['9_X','Ei perusasteen jälkeistä tutkintoa tai tuntematon'],['3_4','Toinen aste tai erikoisammattitutkinto'],['5_6','Alin tai alempi korkea-aste'],['7_8','Ylempi korkea-aste tai tutkijakoulutus']];
export const ageGroups:[string,string][]=[['18-24','18–24-vuotiaat'],['25-34','25–34-vuotiaat'],['35-44','35–44-vuotiaat'],['45-54','45–54-vuotiaat'],['55-64','55–64-vuotiaat']];
export const incomeGroups:[string,string][]=[['9','Ei perusasteen jälkeistä tutkintoa tai tuntematon'],['3','Toinen aste'],['456','Alin/alempi korkea-aste tai erikoisammattitutkinto'],['78','Ylempi korkea-aste tai tutkijakoulutus']];
const ageMembers:Record<string,string[]>={'18-24':['18-24'],'25-34':['25-29','30-34'],'35-44':['35-39','40-44'],'45-54':['45-49','50-54'],'55-64':['55-59','60-64']};
export type GroupMetric='employment'|'unemployment'|'students';
const educationIndex=new Map(data.education.map(r=>[`${r[0]}:${r[1]}:${r[2]}`,r.slice(3) as [number,number,number,number,number]]));
const ageIndex=new Map(data.age.map(r=>[`${r[0]}:${r[1]}:${r[2]}`,r.slice(3) as [number,number,number,number,number]]));
const incomeIndex=new Map(data.income.map(r=>[`${r[0]}:${r[1]}`,r.slice(2) as [number|null,number|null,number|null]]));
export function groupCounts(region:string,year:number,kind:'education'|'age',group:string):[number,number,number,number,number]|null{
 const index=kind==='education'?educationIndex:ageIndex;
 const members=kind==='education'?[group]:ageMembers[group]??[];
 const rows=members.map(g=>index.get(`${region}:${g}:${year}`));
 if(!rows.length||rows.some(r=>!r))return null;
 return [0,1,2,3,4].map(i=>rows.reduce((sum,r)=>sum+(r![i]??0),0)) as [number,number,number,number,number];
}
export function groupRate(region:string,year:number,kind:'education'|'age',group:string,metric:GroupMetric):number|null{
 const p=groupCounts(region,year,kind,group);if(!p)return null;
 const denominator=metric==='unemployment'?p[1]+p[2]:p[0];
 return denominator>0?100*p[metric==='employment'?1:metric==='unemployment'?2:4]/denominator:null;
}
export function groupIncome(year:number,group:string,metric:'poverty'|'median'):number|null{
 const p=incomeIndex.get(`${group}:${year}`);if(!p)return null;
 return metric==='median'?p[2]:p[0]&&p[1]!=null?100*p[1]/p[0]:null;
}
