import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
type Context={year:number;setYear:Dispatch<SetStateAction<number>>;region:string;setRegion:Dispatch<SetStateAction<string>>};
const TimelineContext=createContext<Context|null>(null);
export function TimelineProvider({children,initialYear=1987}:{children:ReactNode;initialYear?:number}){
 const [year,setYear]=useState(initialYear);const [region,setRegion]=useState('MK08');
 return <TimelineContext.Provider value={{year,setYear,region,setRegion}}>{children}</TimelineContext.Provider>;
}
export const useTimeline=()=>useContext(TimelineContext);
export function resolveTimelineYear(year:number,{min,max,observed}:{min:number;max:number;observed?:readonly number[]}){
 const bounded=Math.max(min,Math.min(max,year));
 return observed?.length ? [...observed].sort((a,b)=>a-b).filter(y=>y<=bounded).at(-1) ?? Math.min(...observed) : bounded;
}
export function useLinkedYear(initial:number,range:{min:number;max:number;observed?:readonly number[]}):[number,Dispatch<SetStateAction<number>>]{
 const context=useTimeline();const [local,setLocal]=useState(initial);
 const year=resolveTimelineYear(context?.year??local,range);
 const setYear:Dispatch<SetStateAction<number>>=value=>{
  const next=typeof value==='function'?value(year):value;
  if(context)context.setYear(next);else setLocal(next);
 };
 return [year,setYear];
}
export function useLinkedRegion(initial:string):[string,Dispatch<SetStateAction<string>>]{
 const context=useTimeline();const [local,setLocal]=useState(initial);
 return context?[context.region,context.setRegion]:[local,setLocal];
}
export function TimelineCoverage({year,label='Tämä näkymä'}:{year:number;label?:string}){
 const context=useTimeline();
 return context&&context.year!==year?<p className="tl-coverage"><b>Yhteinen vuosi {context.year}:</b> {label} ei sisällä havaintoa tältä vuodelta nykyisellä rajauksella. Näytetään havaintovuosi {year}; sitä ei tulkita vuoden {context.year} luvuksi.</p>:null;
}
