import {crisisCases,type CrisisId} from './crisis-management';
import {employmentShare,workPoint,workIncome,workPoverty,workRegions} from './work-opportunity';
import {groupRate} from './group-opportunity';
export type RecoveryMetric='employment'|'employed'|'jobs'|'income'|'poverty';
export type RecoveryStatus='noFollowup'|'noBaseline'|'missing'|'break'|'below'|'lost'|'pending'|'held'|'noDip';
export const recoveryRegions=workRegions.filter(r=>r.id!=='SSS');
export const recoveryMetrics:Record<RecoveryMetric,{name:string;unit:string;direction:'up'|'down';count:boolean;breaks:number[];source:string}>={
 employment:{name:'Työllisten osuus 18–64 väestöstä',unit:'%',direction:'up',count:false,breaks:[2017,2019],source:'https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__tyokay/115b.px/'},
 employed:{name:'Työlliset asukkaat 18–64',unit:'henkilöä',direction:'up',count:true,breaks:[2019],source:'https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__tyokay/115b.px/'},
 jobs:{name:'Alueella sijaitsevat työpaikat · kaikki iät',unit:'henkilöä',direction:'up',count:true,breaks:[2019],source:'https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__tyokay/115h.px/'},
 income:{name:'Asuntoväestön reaalinen mediaanitulo',unit:'2024 €/kulutusyksikkö',direction:'up',count:true,breaks:[],source:'https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__tjt/14ww.px/'},
 poverty:{name:'Asuntoväestön pienituloisuusaste',unit:'%',direction:'down',count:false,breaks:[],source:'https://statfin.stat.fi/PxWeb/pxweb/fi/StatFin/StatFin__tjt/14ww.px/'},
};
export const recoveryColors:Record<RecoveryStatus,string>={noFollowup:'#6c7784',noBaseline:'#6c7784',missing:'#6c7784',break:'#a193cb',below:'#bc856d',lost:'#e7ad72',pending:'#ddca86',held:'#62c9bd',noDip:'#a4cddd'};
export const recoveryLabels:Record<RecoveryStatus,string>={noFollowup:'Ei vielä jälkihavaintoja',noBaseline:'Lähtötaso puuttuu',missing:'Seurannassa puuttuvia havaintoja',break:'Tilastokatkos vertailuvälillä',below:'Lähtötasoa ei saavutettu heikentymisen jälkeen',lost:'Palasi tasolle, myöhemmin jäi sen alle',pending:'Nykyinen paluu on vielä lyhyt',held:'Nykyinen paluu täyttää havaintovuosiehdon',noDip:'Ei havaittua heikentymistä lähtötasosta'};
export type RecoveryResult={status:RecoveryStatus;firstReturn:number|null;spellStart:number|null;streak:number;baseline:number|null;last:number|null};
export function classifyRecovery(baseline:number|null,points:{year:number;value:number|null}[],direction:'up'|'down',required:number,breaks:number[]=[]):RecoveryResult{
 const rows=[...points].sort((a,b)=>a.year-b.year),last=rows.at(-1)?.value??null;
 const empty=(status:RecoveryStatus):RecoveryResult=>({status,firstReturn:null,spellStart:null,streak:0,baseline,last});
 if(!rows.length)return empty('noFollowup');if(baseline==null)return empty('noBaseline');
 if(rows.some((r,i)=>r.value==null||i>0&&r.year!==rows[i-1]!.year+1))return empty('missing');
 if(rows.some(r=>breaks.includes(r.year)))return empty('break');
 let dipped=false,firstReturn:number|null=null,spellStart:number|null=null,streak=0;
 for(const r of rows){const atLevel=direction==='up'?r.value!>=baseline:r.value!<=baseline;
  if(!atLevel){dipped=true;spellStart=null;streak=0;}else{if(streak===0)spellStart=r.year;streak++;if(dipped&&firstReturn==null)firstReturn=r.year;}
 }
 const status:RecoveryStatus=!dipped?'noDip':streak===0?firstReturn==null?'below':'lost':streak>=Math.max(1,Math.round(required))?'held':'pending';
 return {status,firstReturn,spellStart:dipped?spellStart:null,streak,baseline,last};
}
export function recoveryPeriod(crisis:CrisisId,year:number){const c=crisisCases.find(c=>c.id===crisis)!;return {start:c.start,base:c.start-1,end:Math.min(2024,c.start+10,year)};}
export function recoveryValue(region:string,year:number,metric:RecoveryMetric):number|null{
 if(year>2024)return null;
 if(metric==='employment')return employmentShare(region,year);
 if(metric==='employed')return workPoint(region,year)?.employed??null;
 if(metric==='jobs')return workPoint(region,year)?.jobs['SSS']??null;
 if(year<2010)return null;
 return metric==='income'?workIncome(region,year):workPoverty(region,year);
}
export function assessRecovery(crisis:CrisisId,year:number,metric:RecoveryMetric,region:string,required=3){const {start,base,end}=recoveryPeriod(crisis,year);return classifyRecovery(recoveryValue(region,base,metric),Array.from({length:Math.max(0,end-start+1)},(_,i)=>({year:start+i,value:recoveryValue(region,start+i,metric)})),recoveryMetrics[metric].direction,required,recoveryMetrics[metric].breaks);}
export function assessGroupRecovery(crisis:CrisisId,year:number,kind:'education'|'age',group:string,region:string,required=3){const {start,base,end}=recoveryPeriod(crisis,year);return classifyRecovery(groupRate(region,base,kind,group,'employment'),Array.from({length:Math.max(0,end-start+1)},(_,i)=>({year:start+i,value:groupRate(region,start+i,kind,group,'employment')})),'up',required,[2017,2019]);}
