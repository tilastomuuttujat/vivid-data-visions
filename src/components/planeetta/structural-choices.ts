import data from './structural-choices-data.json';
import regions from './regional-path-data.json';
export const structuralEvents=data.events;
export const norwayShares=data.norwayShares;
export const norwaySource=data.norwaySource;
export const transitionRegions=regions.regions.filter(r=>r.id!=='SSS');
export function transitionChange(region:string,year:number,key:'industry'|'information'){
 const r=transitionRegions.find(r=>r.id===region);const base=r?.points.find(p=>p.year===2000)?.[key];const current=r?.points.find(p=>p.year===year)?.[key];
 return base==null||current==null?null:{base,current,change:current-base};
}
export const structuralTimelineEvents=structuralEvents.map(e=>({id:`structural-${e.id}`,structuralId:e.id,year:e.year,title:`${e.date}: ${e.title}`,text:e.text,url:e.url,kind:e.kind,theme:'Omistus ja vaikutusvalta'}));
