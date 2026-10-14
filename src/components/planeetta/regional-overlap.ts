import regional from './regional-path-data.json';
import { longTermShare, workPoint } from './work-opportunity';
export type OverlapMetric='jobs'|'workingAge'|'longTerm'|'poverty'|'older';
export type OverlapCondition={metric:OverlapMetric;direction:'up'|'down'};
export const overlapRegions=regional.regions.filter(r=>r.id!=='SSS');
export const overlapYears=Array.from({length:35},(_,i)=>1990+i);
export const overlapMetrics:Record<OverlapMetric,{name:string;unit:string;changeUnit:string;start:number;breaks:number[];source:string;note:string}>={
 jobs:{name:'Työpaikat',unit:'henkilöä',changeUnit:'%',start:2007,breaks:[2019],source:'https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__tyokay/115h.px/',note:'Alueella sijaitsevat rekisterityöpaikat, kaikki ikäluokat. Pendelöinti erottaa luvun asukkaiden työllisyydestä.'},
 workingAge:{name:'Työikäinen väestö 18–64',unit:'henkilöä',changeUnit:'%',start:1987,breaks:[],source:'https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__tyokay/115b.px/',note:'Alueella asuvat 18–64-vuotiaat. Määrään vaikuttavat muuton lisäksi ikäryhmään tuleminen ja siitä poistuminen.'},
 longTerm:{name:'Pitkäaikaistyöttömien osuus',unit:'% työnhakijatyöttömistä',changeUnit:'%-yks.',start:2009,breaks:[2017],source:'https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__tyonv/12r5.px/',note:'Kuukauden lopun pitkäaikaistyöttömien ja työnhakijatyöttömien vuosikeskiarvojen suhde. Osuus voi kasvaa myös muun työttömyyden vähentyessä.'},
 poverty:{name:'Pienituloisuusaste',unit:'% asuntoväestöstä',changeUnit:'%-yks.',start:2010,breaks:[],source:'https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__tjt/14ww.px/',note:'Suhteellinen raja 60 % koko maan mediaanitulosta. Ei mittaa palvelujen saatavuutta.'},
 older:{name:'65 vuotta täyttäneiden osuus',unit:'% väestöstä',changeUnit:'%-yks.',start:1990,breaks:[],source:'https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__vaerak/11ra.px/',note:'Ikärakenteen mittari, ei todellisen avuntarpeen määrä. Palvelupaneelin ikäryhmä on erikseen 75+.'},
};
export const overlapMetricIds=Object.keys(overlapMetrics) as OverlapMetric[];
export function overlapValue(region:string,year:number,metric:OverlapMetric):number|null{
 if(year<overlapMetrics[metric].start||year>2024)return null;
 if(metric==='jobs')return workPoint(region,year)?.jobs['SSS']??null;
 if(metric==='workingAge')return workPoint(region,year)?.workingAge??null;
 if(metric==='longTerm')return longTermShare(region,year);
 const p=regional.regions.find(r=>r.id===region)?.points.find(p=>p.year===year);
 return metric==='poverty'?p?.poverty??null:p?.olderShare??null;
}
export function overlapChange(region:string,from:number,to:number,metric:OverlapMetric):number|null{
 if(from>to)return null;const a=overlapValue(region,from,metric),b=overlapValue(region,to,metric);
 if(a===null||b===null)return null;
 if(metric==='jobs'||metric==='workingAge')return a===0?null:(b/a-1)*100;
 return b-a;
}
export function overlapMatch(region:string,from:number,to:number,conditions:OverlapCondition[]):'yes'|'no'|'missing'{
 const values=conditions.map(c=>({c,v:overlapChange(region,from,to,c.metric)}));
 if(values.some(({v})=>v===null))return 'missing';
 return values.every(({c,v})=>c.direction==='up'?v!>0:v!<0)?'yes':'no';
}
export function overlapTurns(region:string,metric:OverlapMetric){
 let sign=0;const turns:{year:number;direction:'up'|'down'}[]=[];
 for(const year of overlapYears){
  const current=overlapValue(region,year,metric),previous=overlapValue(region,year-1,metric);
  if(current===null||previous===null||overlapMetrics[metric].breaks.includes(year)){sign=0;continue;}
  const next=Math.sign(current-previous);if(next&&sign&&next!==sign)turns.push({year,direction:next>0?'up':'down'});if(next)sign=next;
 }
 return turns;
}
export function overlapShade(value:number|null,metric:OverlapMetric){
 if(value===null)return '#667783';const step=metric==='jobs'||metric==='workingAge'?5:1;
 return value<-step?'#af6751':value<0?'#d8a88c':value===0?'#96a5ad':value<=step?'#7fbec3':'#43bfd0';
}
