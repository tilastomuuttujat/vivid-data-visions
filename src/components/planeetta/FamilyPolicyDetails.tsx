import { familyPolicyEvents } from './family-policy-data';
export function FamilyPolicyDetails({id}:{id:string}){
 const e=familyPolicyEvents.find(e=>e.id===id);if(!e)return null;
 return <article><h3>{e.date}: {e.title}</h3><p><b>{e.kind}.</b> {e.text}</p><p><b>Hallitus ja vastuut:</b> {e.government}</p><p><b>Näytön raja:</b> {e.limit}</p><a href={e.url}>Tarkista päätöksen tai puheen lähde</a></article>;
}
