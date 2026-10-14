import data from './work-mobility-data.json';
import {workPoint,ratio} from './work-opportunity';
const lookup=new Map(data.points.map(r=>[`${r[0]}:${r[1]}`,r.slice(2) as [number,number,number]]));
export function mobilityPoint(region:string,year:number){const p=lookup.get(`${region}:${year}`);return p?{employed:p[0],outsideMunicipality:p[1],withinMunicipality:p[2],commutingShare:ratio(p[1],p[0])}:null;}
export function mobilityIndex(region:string,year:number,metric:'jobs'|'employed',base=2007){return ratio(metric==='jobs'?workPoint(region,year)?.jobs['SSS']:mobilityPoint(region,year)?.employed,metric==='jobs'?workPoint(region,base)?.jobs['SSS']:mobilityPoint(region,base)?.employed);}
export function mobilityChange(region:string,from:number,to:number,metric:'jobs'|'employed'|'unemployed'|'outside'|'workingAge'|'commutingShare'){
 if(to<from)return null;
 const value=(y:number)=>metric==='jobs'?workPoint(region,y)?.jobs['SSS']:metric==='employed'||metric==='commutingShare'?mobilityPoint(region,y)?.[metric]:workPoint(region,y)?.[metric];
 const a=value(from),b=value(to);return a==null||b==null?null:b-a;
}
