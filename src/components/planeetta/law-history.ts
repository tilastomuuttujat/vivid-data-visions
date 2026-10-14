import data from './law-history-data.json';
export type LawSource={title:string;url:string;location:string;kind:string};
export type LawRecord={id:string;title:string;number:string;theme:string;enacted:number;enactedDate:string;entryYear:number|null;entryDate:string;content:string;mechanism:string;distribution:string;actors:string;evidence:string;limit:string;sources:LawSource[]};
export const laws:LawRecord[]=data;
export const lawThemes=['Maa ja omistus','Työ ja neuvotteluvoima','Koulutus','Toimeentulo ja palvelut','Verotus ja julkinen omistus'];
export const lawEventYears=[...new Set(laws.flatMap(l=>l.entryYear===null?[l.enacted]:[l.enacted,l.entryYear]))].sort((a,b)=>a-b);
export const lawEvents=laws.flatMap(l=>[
 {id:`law-${l.id}-enacted`,lawId:l.id,year:l.enacted,title:`${l.enactedDate}: ${l.title} · annettu`,text:`${l.number}. ${l.content}`,url:l.sources[0]!.url,kind:'Säädös annettu',theme:'Lainsäädäntö'},
 ...(l.entryYear===null?[]:[{id:`law-${l.id}-entry`,lawId:l.id,year:l.entryYear,title:`${l.entryDate}: ${l.title} · voimaantulo`,text:'Voimaantulo erotetaan antamisesta ja vaikutusten toteutumisesta. '+l.limit,url:(l.sources.find(s=>s.kind==='Voimaanpano')??l.sources[0]!).url,kind:'Voimaantulo',theme:'Lainsäädäntö'}])
]);
