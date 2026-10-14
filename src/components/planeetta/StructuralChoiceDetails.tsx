import { structuralEvents } from './structural-choices';
export function StructuralChoiceDetails({id}:{id:string}){
 const e=structuralEvents.find(e=>e.id===id);if(!e)return null;
 return <article><h3>{e.date}: {e.title}</h3><p><b>{e.kind} · {e.lane}.</b> {e.text}</p><p><b>Näytön raja:</b> {e.limit}</p><a href={e.url}>Tarkista tapahtuman alkuperäinen lähde</a></article>;
}
